# GoDam Web Admin - Deployment Guide

## Problem Analysis

Your application was showing `ERR_CONNECTION_REFUSED` errors because:
1. The frontend was trying to connect to `localhost:8080` instead of your backend at `http://72.61.245.23:8081`
2. The environment variable wasn't being properly read during the Vite build process
3. The built files weren't correctly deployed to the server

## Solution

I've created multiple deployment scripts to fix this issue. Choose the one that works best for you:

---

## Option 1: Automated Python Script (RECOMMENDED)

This is the easiest and most reliable method.

### Prerequisites
```bash
# Install sshpass (one-time setup)
brew install hudochenkov/sshpass/sshpass
```

### Deploy
```bash
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
./deploy.py
```

This script will:
- ✓ Clean previous builds
- ✓ Set correct environment variables
- ✓ Build the application with proper API URL
- ✓ Copy files to server
- ✓ Configure Nginx automatically
- ✓ Restart services

---

## Option 2: Bash Script with sshpass

### Prerequisites
```bash
brew install hudochenkov/sshpass/sshpass
```

### Deploy
```bash
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
./deploy.sh
```

---

## Option 3: Manual Deployment (If automated scripts fail)

### Step 1: Build locally
```bash
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin

# Clean
rm -rf dist

# Set environment
printf "VITE_API_BASE_URL=http://72.61.245.23:8081\n" > .env

# Build
npm run build
```

### Step 2: Copy to server
```bash
# Copy files (will ask for password: 9804409636Aa@themaninthemoon)
scp -r dist root@72.61.245.23:/root/godam-web
```

### Step 3: Configure server
```bash
# SSH into server
ssh root@72.61.245.23
# Password: 9804409636Aa@themaninthemoon

# Install Nginx (if not installed)
apt-get update && apt-get install -y nginx

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
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# Exit SSH
exit
```

---

## Verification

After deployment, verify your application:

1. **Check Frontend**: Open http://72.61.245.23:8082 in your browser
2. **Check Backend**: Verify http://72.61.245.23:8081 is responding
3. **Check Browser Console**: Should show no connection errors
4. **Check Network Tab**: API calls should go to `http://72.61.245.23:8081`

---

## Troubleshooting

### Issue: Still seeing localhost errors

**Solution**: Clear browser cache and hard reload (Cmd+Shift+R on Mac)

### Issue: Nginx not starting

**Check logs**:
```bash
ssh root@72.61.245.23 'tail -f /var/log/nginx/error.log'
```

**Check status**:
```bash
ssh root@72.61.245.23 'systemctl status nginx'
```

### Issue: 502 Bad Gateway

This means Nginx is running but can't reach the backend. Check if backend is running:
```bash
ssh root@72.61.245.23 'netstat -tlnp | grep 8081'
```

### Issue: Files not updating

**Clear the dist folder and rebuild**:
```bash
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
rm -rf dist
npm run build
```

---

## Server Configuration Details

- **Frontend URL**: http://72.61.245.23:8082
- **Backend URL**: http://72.61.245.23:8081
- **Server IP**: 72.61.245.23
- **Server User**: root
- **Deploy Path**: /root/godam-web
- **Nginx Config**: /etc/nginx/sites-available/godam-web

---

## Quick Commands Reference

### Rebuild and redeploy
```bash
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
./deploy.py
```

### Check server status
```bash
ssh root@72.61.245.23 'systemctl status nginx'
```

### View Nginx logs
```bash
ssh root@72.61.245.23 'tail -f /var/log/nginx/access.log'
ssh root@72.61.245.23 'tail -f /var/log/nginx/error.log'
```

### Restart Nginx
```bash
ssh root@72.61.245.23 'systemctl restart nginx'
```

### Check what's listening on ports
```bash
ssh root@72.61.245.23 'netstat -tlnp | grep -E "8081|8082"'
```

---

## Backend Deployment (If needed)

If your backend at port 8081 is not running, you'll need to start it:

```bash
ssh root@72.61.245.23

# Navigate to backend directory
cd /root/godam-backend  # or wherever your backend is

# Start the backend (adjust command based on your backend type)
# For Node.js:
npm start

# For Java:
java -jar your-backend.jar

# For Python:
python app.py
```

---

## Security Notes

⚠️ **Important**: The deployment scripts contain the server password. In production:
1. Use SSH keys instead of passwords
2. Store credentials in environment variables
3. Use a secrets management system
4. Restrict file permissions: `chmod 600 deploy.py`

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Nginx logs on the server
3. Verify the backend is running on port 8081
4. Ensure firewall allows ports 8081 and 8082
