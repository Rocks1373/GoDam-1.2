#!/bin/bash

# Backend Deployment Script with CORS Fix
set -e

# Configuration
SERVER_IP="72.61.245.23"
SERVER_USER="root"
SERVER_PASSWORD="9804409636Aa@themaninthemooN"

echo "=========================================="
echo "GoDam Backend Deployment (CORS Fix)"
echo "=========================================="
echo ""

# Step 1: Build the backend
echo "Step 1: Building backend with Maven..."
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/backend-java

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "Error: Maven is not installed. Please install Maven first."
    echo "Visit: https://maven.apache.org/install.html"
    exit 1
fi

# Clean and build
mvn clean package -DskipTests
echo "✓ Backend built successfully"
echo ""

# Step 2: Find the JAR file
JAR_FILE=$(find target -name "*.jar" -not -name "*-sources.jar" | head -1)
if [ -z "$JAR_FILE" ]; then
    echo "Error: JAR file not found in target directory"
    exit 1
fi

echo "Step 2: Found JAR file: $JAR_FILE"
echo ""

# Step 3: Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

# Step 4: Deploy to server
echo "Step 3: Deploying to server..."
sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no "$JAR_FILE" ${SERVER_USER}@${SERVER_IP}:/root/app.jar
echo "✓ JAR file uploaded to server"
echo ""

# Step 5: Restart the backend container
echo "Step 4: Restarting backend container..."
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Stop and remove old container
docker stop godam-backend 2>/dev/null || true
docker rm godam-backend 2>/dev/null || true

# Start new container with updated JAR
docker run -d \
  --name godam-backend \
  --restart unless-stopped \
  -p 8081:8080 \
  -v /root/app.jar:/app/app.jar \
  -v /root/godam.db:/data/godam.db \
  eclipse-temurin:17-jre \
  java -jar /app/app.jar

echo "✓ Backend container restarted"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Check if backend is running
if docker ps | grep -q godam-backend; then
    echo "✓ Backend is running"
else
    echo "✗ Backend failed to start"
    docker logs godam-backend --tail 50
    exit 1
fi
ENDSSH

echo ""
echo "=========================================="
echo "Backend Deployment Complete!"
echo "=========================================="
echo ""
echo "CORS has been fixed to allow:"
echo "  - http://72.61.245.23:8082 (production frontend)"
echo "  - http://localhost:5173 (local development)"
echo ""
echo "Backend is now running at: http://${SERVER_IP}:8081"
echo ""
echo "To check logs:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'docker logs godam-backend --tail 50'"
echo ""
