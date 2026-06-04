# Standard Operating Procedure (SOP): Docker Deployment

This document provides a detailed guide on how to build, run, and push the Dockerized version of the Anaesthesia Department Portal. The application uses a multi-stage Dockerfile that optimizes the final image size and serves the production build.

## Prerequisites
- Docker Engine installed (or Docker Desktop)
- Docker Compose installed
- A Docker Hub account or any private container registry (if pushing to a registry)
- A `.env` file containing your `GEMINI_API_KEY` and any other backend secrets
- The `firebase-applet-config.json` file securely present in your root directory (the Docker build process requires this file to bundle the Firebase connection into the frontend app).

---

## 1. Local Development & Testing

Using `docker-compose` is the easiest way to test the application locally before deploying it to production.

### Step 1.1: Environment Setup
Ensure you have a `.env` file in the root directory (same folder as `docker-compose.yml`) containing your secrets:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 1.2: Build and Run with Docker Compose
To build the image and start the container locally:
```bash
docker-compose up --build -d
```
- The `--build` flag forces Docker to rebuild the image using the `Dockerfile`.
- The `-d` flag runs the container in detached mode (in the background).

### Step 1.3: Access the Application
Open your web browser and navigate to:
**http://localhost:3000**

### Step 1.4: View Logs and Stop the Container
To view the logs of your running container:
```bash
docker-compose logs -f
```
To stop the container without deleting the persistent volumes:
```bash
docker-compose stop
```
To completely remove the container:
```bash
docker-compose down
```

---

## 2. Pushing the Image to a Docker Registry

To deploy the application on a production server (like AWS, DigitalOcean, or a remote VPS), you need to push the image to a container registry (e.g., Docker Hub, AWS ECR, Google Artifact Registry).

### Step 2.1: Login to your Registry
If using Docker Hub, run:
```bash
docker login
```
Enter your Docker Hub username and password.

### Step 2.2: Build and Tag the Image
Replace `<your-dockerhub-username>` with your actual username.
```bash
docker build -t <your-dockerhub-username>/anaesthesia-portal:latest .
```
- `-t` tags the image with a name and a version (`latest`).
- `.` specifies the current directory contains the `Dockerfile`.

### Step 2.3: Push the Image
Push the tagged image to the registry:
```bash
docker push <your-dockerhub-username>/anaesthesia-portal:latest
```

---

## 3. Production Deployment

Once the image is in a registry, you can pull it and run it on any production server.

### Step 3.1: Server Setup
1. SSH into your production server.
2. Install Docker and Docker Compose on the server.
3. Login to your Docker registry on the server (`docker login`).

### Step 3.2: Transfer Configuration Files
You don't need the entire source code on the production server. You only need:
- `docker-compose.yml`
- `.env` file (with production API keys)

You can modify the `docker-compose.yml` on the server to use your pushed image instead of building locally:

```yaml
version: '3.8'

services:
  inventory-app:
    image: <your-dockerhub-username>/anaesthesia-portal:latest
    container_name: inventory-app
    ports:
      - "80:3000" # Maps port 80 (HTTP) to port 3000 inside the container
    restart: always
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./data:/app/data
```

### Step 3.3: Run the Production Container
In the directory containing your updated `docker-compose.yml` and `.env` file, run:
```bash
docker-compose up -d
```
*Note: We mapped port 80 to 3000 in the example above, meaning the application will be accessible directly via your server's IP address or domain name without specifying a port.*

### Step 3.4: Updating the Production App
When you make code changes and want to update the production server:
1. Build and push the new image from your local machine (Step 2.2 & 2.3).
2. On the production server, pull the latest image:
   ```bash
   docker-compose pull
   ```
3. Restart the container to apply the new image:
   ```bash
   docker-compose up -d
   ```
Docker will automatically stop the old container and start a new one with zero downtime.

---

## 4. Production Best Practices & Security

Before opening the app to your real users on the internet, ensure you have these best practices in place:

### Setting up a Reverse Proxy & SSL (HTTPS)
Browsers heavily restrict applications served over plain HTTP, and Firebase Authentication popups may fail. You must place this Docker container behind a Reverse Proxy like **Nginx** or **Caddy** equipped with an SSL Certificate (e.g., Let's Encrypt).
1. The Docker container runs on port 3000 locally.
2. Nginx should be configured to listen on port 443 (HTTPS) and proxy requests to `localhost:3000`.

### The `.env` Configuration
In production, your `.env` file should be heavily secured. Run `chmod 600 .env` on your server to prevent unauthorized users from reading your `GEMINI_API_KEY`.

### Firebase Connection Verification
Your application uses `firebase-applet-config.json` to connect to Firebase services (Auth, Firestore).
- **During Build:** Docker copies this file into the image during the `npm run build` step (Stage 1 of the `Dockerfile`). It bundles the config directly into the static HTML/JS.
- **In Production:** You do NOT need to mount the `firebase-applet-config.json` via Docker volumes on the production server because the connection details are already baked into the production frontend assets during the build phase.

### Stateless Container Note
This application stores its data in the cloud via Firebase (Firestore). The backend Express server handles temporary in-memory processing (e.g., using Gemini AI for document parsing) and does not save files to the local disk. Thus, the container is **stateless**. If your container crashes or is deleted, you will not lose any user data or forms.

---

## 5. Troubleshooting Common Issues

### Scenario 1: The container starts but immediately crashes
**Symptom:** Running `docker-compose ps` shows the container state as `Exit 1` or `Restarting`.
**Solution:**
1. Check the logs to see the exact error: `docker-compose logs inventory-app`
2. **Common Cause:** Missing environment variables. Ensure your `.env` file exists and contains `GEMINI_API_KEY`. If the backend crashes on startup, it's often due to the `server.ts` checking for this key.

### Scenario 2: Build fails during "npm install" or "npm run build"
**Symptom:** `docker-compose up --build` fails with a red error during the `RUN npm install` or `RUN npm run build` step.
**Solution:**
1. **Common Cause:** Network issues or memory limits. If the server is low on RAM, the Vite build process might be killed.
2. Ensure you have at least 1GB to 2GB of free RAM on the machine running the build.
3. Try building locally on your powerful desktop, pushing the image, and only pulling the pre-built image on the production server (as outlined in Step 3.4).

### Scenario 3: Database/Firestore Permissions Errors
**Symptom:** You can log in, but no data loads, or saving fails with "Missing or insufficient permissions."
**Solution:**
1. This is not a Docker issue. It means your Firebase Firestore rules are not correctly applied in the Firebase Console.
2. Go to Firebase Console -> Firestore Database -> Rules and ensure you have copy-pasted the latest `firestore.rules` file contents exactly as they appear in the source code.

### Scenario 4: "Bind for 0.0.0.0:3000 failed: port is already allocated"
**Symptom:** Docker fails to start the container because the port is in use.
**Solution:**
1. Another application (or an older ghost instance of this container) is already using port 3000.
2. Find the process using port 3000: `sudo lsof -i :3000` or `netstat -ano | findstr 3000` (on Windows).
3. If it's a ghost container, restart the Docker daemon or stop all running containers with `docker stop $(docker ps -a -q)`.
4. Alternatively, map to a different external port in `docker-compose.yml` (e.g., `"8080:3000"`).

### Scenario 5: Image Push fails with "denied: requested access to the resource is denied"
**Symptom:** `docker push` fails with authentication errors.
**Solution:**
1. You are not logged into Docker correctly, or you are trying to push to a namespace you don't own.
2. Run `docker login` and ensure the credentials are correct.
3. Ensure the image tag matches your exact Docker Hub username: `docker tag old-name <your-exact-username>/anaesthesia-portal:latest`.
