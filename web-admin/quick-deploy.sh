#!/bin/bash

# Quick Deployment Script
# Simple script that builds and copies files to server

set -e

echo "=========================================="
echo "Quick Deploy - GoDam Web Admin"
echo "=========================================="
echo ""

cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin

# Step 1: Clean
echo "Cleaning..."
rm -rf dist

# Step 2: Set env
echo "Setting environment..."
printf "VITE_API_BASE_URL=http://72.61.245.23:8081\n" > .env

# Step 3: Build
echo "Building..."
npm run build

# Step 4: Copy to server
echo "Copying to server..."
echo "Password: 9804409636Aa@themaninthemoon"
scp -r dist root@72.61.245.23:/root/godam-web

echo ""
echo "✓ Files copied!"
echo ""
echo "Now SSH into server and run:"
echo "  ssh root@72.61.245.23"
echo ""
echo "Then run these commands on the server:"
echo "-------------------------------------------"
cat << 'EOF'
# Install Nginx if not installed
apt-get update && apt-get install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/godam-web << 'NGINXEOF'
server {
    listen 8082;
    server_name _;
    root /root/godam-web/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/godam-web /etc/nginx/sites-enabled/godam-web
rm -f /etc/nginx/sites-enabled/default

# Restart Nginx
nginx -t && systemctl restart nginx

echo "Done! Visit http://72.61.245.23:8082"
EOF
echo "-------------------------------------------"
