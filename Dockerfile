# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the Vite React app and bundle the server
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets and server from the builder stage
COPY --from=builder /app/dist ./dist

# Ensure the scratch directory or required runtime volumes exist
RUN mkdir -p /app/data

# Expose the application port
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
