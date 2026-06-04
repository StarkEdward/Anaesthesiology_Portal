To run this offline version of the app:

Modern web browsers block direct loading of JavaScript modules (ES modules) over the `file://` protocol due to security policies (CORS). This means simply double-clicking `index.html` will result in a blank white screen.

To view the offline version, you need to use a simple local web server. Here are a few easy options:

Option 1: Using Python (if installed)
1. Open a terminal or command prompt in this `offline-version` folder.
2. Run the command: `python -m http.server 8000` (or `python3 -m http.server 8000`)
3. Open your browser and go to http://localhost:8000

Option 2: Using Node.js and npx (if installed)
1. Open a terminal or command prompt in this `offline-version` folder.
2. Run the command: `npx serve`
3. Open your browser and go to the link provided (usually http://localhost:3000)

Option 3: Using VS Code
1. Open this folder in VS Code
2. Install the "Live Server" extension
3. Right-click `index.html` and select "Open with Live Server"

Note: Since the app has migrated to Firebase, you will need active internet connection for database functionality, even when served "offline" through these methods.

You will see `index.html` in this folder, and your `.css` and `.js` files are inside the `assets/` folder.
