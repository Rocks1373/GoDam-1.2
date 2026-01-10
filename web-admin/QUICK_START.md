# Quick Start - Deploy GoDam Web Admin

## One-Command Deployment

```bash
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/web-admin
python3 deploy.py
```

That's it! The script will:
- ✓ Build your application with correct backend URL
- ✓ Deploy to server at 72.61.245.23
- ✓ Configure Nginx on port 8082
- ✓ Restart services

## Access Your Application

- **Frontend**: http://72.61.245.23:8082
- **Backend**: http://72.61.245.23:8081

## Troubleshooting

### If deployment fails:
```bash
# Check if backend is running
ssh root@72.61.245.23 'netstat -tlnp | grep 8081'

# Check Nginx status
ssh root@72.61.245.23 'systemctl status nginx'

# View Nginx logs
ssh root@72.61.245.23 'tail -f /var/log/nginx/error.log'
```

### Clear browser cache
After deployment, hard refresh your browser:
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

## Server Credentials

- **IP**: 72.61.245.23
- **User**: root
- **Password**: 9804409636Aa@themaninthemooN

## Files Location on Server

- **Frontend**: /root/godam-web
- **Nginx Config**: /etc/nginx/sites-available/godam-web

## Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions.
