ooN
#!/bin/bash

# Deployment script for GoDam Web Admin
# This script builds and deploys the web application to the VPS server

set -e  # Exit on any error

# Configuration
SERVER_IP="72.61.245.23"
SERVER_USER="root"
SERVER_PASSWORD="9804409636Aa@themaninthemoon"
BACKEND_URL="http://72.61.245.23:8081"
FRONTEND_PORT="8082"
DEPLOY_PATH="/root/godam-web"

echo "=========================================="
echo "GoDam Web Admin Deployment Script"
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

# Step 3: Install dependencies (if needed)
echo "Step 3: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Step 4: Build the application
echo "Step 4: Building application..."
npm run build
echo "✓ Application built successfully"
echo ""

# Step 5: Deploy to server using sshpass
echo "Step 5: Deploying to server..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            echo "Error: Homebrew not found. Please install sshpass manually."
            echo "Visit: https://github.com/hudochenkov/homebrew-sshpass"
            exit 1
        fi
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

# Create deployment directory on server
echo "Creating deployment directory on server..."
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "mkdir -p ${DEPLOY_PATH}"

# Copy files to server
echo "Copying files to server..."
sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no -r dist/* ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/

echo "✓ Files deployed successfully"
echo ""

# Step 6: Setup Nginx configuration on server
echo "Step 6: Setting up Nginx configuration..."
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/godam-web << 'EOF'
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
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/godam-web /etc/nginx/sites-enabled/godam-web

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "✓ Nginx configured and restarted"
ENDSSH

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Your application is now available at:"
echo "  Frontend: http://${SERVER_IP}:${FRONTEND_PORT}"
echo "  Backend:  ${BACKEND_URL}"
echo ""
echo "To check the status:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'systemctl status nginx'"
echo ""
