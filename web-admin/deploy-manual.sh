#!/bin/bash

# Manual Deployment Script (without sshpass)
# This script prepares the build and provides manual deployment instructions

set -e

# Configuration
BACKEND_URL="http://72.61.245.23:8081"
SERVER_IP="72.61.245.23"
SERVER_USER="root"
DEPLOY_PATH="/root/godam-web"

echo "=========================================="
echo "GoDam Web Admin - Manual Deployment"
echo "=========================================="
echo ""

# Step 1: Clean previous build
echo "Step 1: Cleaning previous build..."
rm -rf dist
echo "✓ Previous build cleaned"
echo ""

# Step 2: Set environment variables
echo "Step 2: Setting environment variables..."
cat > .env << EOF
VITE_API_BASE_URL=${BACKEND_URL}
EOF
echo "✓ Environment variables set"
echo "  VITE_API_BASE_URL=${BACKEND_URL}"
echo ""

# Step 3: Build the application
echo "Step 3: Building application..."
npm run build
echo "✓ Application built successfully"
echo ""

# Step 4: Create deployment package
echo "Step 4: Creating deployment package..."
cd dist
tar -czf ../godam-web-dist.tar.gz .
cd ..
echo "✓ Deployment package created: godam-web-dist.tar.gz"
echo ""

echo "=========================================="
echo "Build completed! Now deploy manually:"
echo "=========================================="
echo ""
echo "1. Upload the package to server:"
echo "   scp godam-web-dist.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/"
echo ""
echo "2. SSH into the server:"
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo ""
echo "3. Extract and deploy:"
echo "   mkdir -p ${DEPLOY_PATH}"
echo "   cd ${DEPLOY_PATH}"
echo "   tar -xzf /tmp/godam-web-dist.tar.gz"
echo "   rm /tmp/godam-web-dist.tar.gz"
echo ""
echo "4. Setup Nginx (if not already done):"
echo "   See the nginx-config.txt file for configuration"
echo ""

# Create Nginx configuration file
cat > nginx-config.txt << 'EOF'
# Nginx Configuration for GoDam Web Admin
# Save this to: /etc/nginx/sites-available/godam-web

server {
    listen 8082;
    server_name _;
    
    root /root/godam-web;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Commands to enable:
# ln -sf /etc/nginx/sites-available/godam-web /etc/nginx/sites-enabled/godam-web
# nginx -t
# systemctl restart nginx
EOF

echo "✓ Nginx configuration saved to: nginx-config.txt"
echo ""
