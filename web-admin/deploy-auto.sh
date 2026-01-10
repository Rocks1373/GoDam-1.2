#!/bin/bash

# Automated Deployment Script using expect
# This script handles SSH password authentication automatically

set -e

# Configuration
SERVER_IP="72.61.245.23"
SERVER_USER="root"
SERVER_PASSWORD="9804409636Aa@themaninthemoon"
BACKEND_URL="http://72.61.245.23:8081"
DEPLOY_PATH="/root/godam-web"

echo "=========================================="
echo "GoDam Web Admin - Automated Deployment"
echo "=========================================="
echo ""

# Step 1: Clean and build
echo "Step 1: Cleaning previous build..."
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
rm -rf dist
echo "✓ Cleaned"
echo ""

echo "Step 2: Setting environment variables..."
printf "VITE_API_BASE_URL=${BACKEND_URL}\n" > .env
echo "✓ Environment set"
echo ""

echo "Step 3: Building application..."
npm run build
echo "✓ Build complete"
echo ""

# Step 4: Deploy using expect
echo "Step 4: Deploying to server..."

# Create expect script
cat > /tmp/deploy_expect.sh << 'EXPECTEOF'
#!/usr/bin/expect -f

set timeout 60
set server_ip [lindex $argv 0]
set server_user [lindex $argv 1]
set server_password [lindex $argv 2]
set deploy_path [lindex $argv 3]

# Create directory on server
spawn ssh -o StrictHostKeyChecking=no ${server_user}@${server_ip} "mkdir -p ${deploy_path}"
expect {
    "password:" {
        send "${server_password}\r"
        expect eof
    }
    eof
}

# Copy files
spawn scp -o StrictHostKeyChecking=no -r dist root@${server_ip}:${deploy_path}/
expect {
    "password:" {
        send "${server_password}\r"
        expect eof
    }
    eof
}

# Setup Nginx
spawn ssh -o StrictHostKeyChecking=no ${server_user}@${server_ip}
expect "password:"
send "${server_password}\r"
expect "# "

# Install Nginx if needed
send "command -v nginx || (apt-get update && apt-get install -y nginx)\r"
expect "# "

# Create Nginx config
send "cat > /etc/nginx/sites-available/godam-web << 'EOF'\r"
send "server {\r"
send "    listen 8082;\r"
send "    server_name _;\r"
send "    root /root/godam-web/dist;\r"
send "    index index.html;\r"
send "    gzip on;\r"
send "    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;\r"
send "    location / {\r"
send "        try_files \$uri \$uri/ /index.html;\r"
send "    }\r"
send "    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {\r"
send "        expires 1y;\r"
send "        add_header Cache-Control \"public, immutable\";\r"
send "    }\r"
send "}\r"
send "EOF\r"
expect "# "

# Enable site
send "ln -sf /etc/nginx/sites-available/godam-web /etc/nginx/sites-enabled/godam-web\r"
expect "# "
send "rm -f /etc/nginx/sites-enabled/default\r"
expect "# "
send "nginx -t && systemctl restart nginx\r"
expect "# "
send "exit\r"
expect eof
EXPECTEOF

chmod +x /tmp/deploy_expect.sh

# Check if expect is installed
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install expect
    else
        sudo apt-get install -y expect
    fi
fi

# Run expect script
/tmp/deploy_expect.sh "${SERVER_IP}" "${SERVER_USER}" "${SERVER_PASSWORD}" "${DEPLOY_PATH}"

rm /tmp/deploy_expect.sh

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
echo ""
echo "Frontend: http://${SERVER_IP}:8082"
echo "Backend:  ${BACKEND_URL}"
echo ""
