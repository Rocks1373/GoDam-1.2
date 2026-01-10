#!/bin/sh
VPS_IP="72.61.245.23"
VPS_USER="root"
VPS_PASS="9804409636Aa@themaninthemooN"
BACKEND_URL="http://72.61.245.23:8081"
FRONTEND_PORT="8082"
DEPLOY_PATH="/root/godam-web"

cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env
npm run build

sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "mkdir -p $DEPLOY_PATH"
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no -r dist/* $VPS_USER@$VPS_IP:$DEPLOY_PATH/

sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "cat > /etc/nginx/sites-available/godam-web << 'NGINX'
server {
    listen 8082;
    root /root/godam-web;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location /api/ { proxy_pass http://72.61.245.23:8081; }
}
NGINX
ln -sf /etc/nginx/sites-available/godam-web /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx"

echo "Done! http://$VPS_IP:$FRONTEND_PORT"
SCRIPT

