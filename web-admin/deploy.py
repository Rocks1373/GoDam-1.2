#!/usr/bin/env python3
"""
Automated deployment script for GoDam Web Admin
Handles SSH authentication and deployment automatically
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Configuration
SERVER_IP = "72.61.245.23"
SERVER_USER = "root"
SERVER_PASSWORD = "9804409636Aa@themaninthemooN"
BACKEND_URL = "http://72.61.245.23:8081"
DEPLOY_PATH = "/root/godam-web"
FRONTEND_PORT = "8082"

def run_command(cmd, cwd=None, check=True):
    """Run a shell command and return output"""
    print(f"Running: {cmd}")
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        capture_output=True,
        text=True,
        check=check
    )
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result

def install_sshpass():
    """Install sshpass if not available"""
    if shutil.which("sshpass"):
        print("✓ sshpass already installed")
        return True
    
    print("Installing sshpass...")
    if sys.platform == "darwin":  # macOS
        if shutil.which("brew"):
            run_command("brew install hudochenkov/sshpass/sshpass")
            return True
        else:
            print("Error: Homebrew not found. Please install sshpass manually.")
            return False
    else:  # Linux
        run_command("sudo apt-get update && sudo apt-get install -y sshpass")
        return True

def ssh_command(cmd, password=SERVER_PASSWORD):
    """Execute command on remote server"""
    full_cmd = f'sshpass -p "{password}" ssh -o StrictHostKeyChecking=no {SERVER_USER}@{SERVER_IP} "{cmd}"'
    return run_command(full_cmd, check=False)

def scp_command(source, dest, password=SERVER_PASSWORD):
    """Copy files to remote server"""
    full_cmd = f'sshpass -p "{password}" scp -o StrictHostKeyChecking=no -r {source} {SERVER_USER}@{SERVER_IP}:{dest}'
    return run_command(full_cmd)

def main():
    print("=" * 50)
    print("GoDam Web Admin - Automated Deployment")
    print("=" * 50)
    print()
    
    # Get script directory
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Step 1: Install sshpass if needed
    print("Step 1: Checking dependencies...")
    if not install_sshpass():
        print("Please install sshpass manually and try again.")
        return 1
    print()
    
    # Step 2: Clean previous build
    print("Step 2: Cleaning previous build...")
    if os.path.exists("dist"):
        shutil.rmtree("dist")
    print("✓ Cleaned")
    print()
    
    # Step 3: Set environment variables
    print("Step 3: Setting environment variables...")
    with open(".env", "w") as f:
        f.write(f"VITE_API_BASE_URL={BACKEND_URL}\n")
    print(f"✓ Set VITE_API_BASE_URL={BACKEND_URL}")
    print()
    
    # Step 4: Build application
    print("Step 4: Building application...")
    result = run_command("npm run build")
    if result.returncode != 0:
        print("Build failed!")
        return 1
    print("✓ Build successful")
    print()
    
    # Step 5: Create deployment directory on server
    print("Step 5: Preparing server...")
    ssh_command(f"mkdir -p {DEPLOY_PATH}")
    print("✓ Directory created")
    print()
    
    # Step 6: Copy files to server
    print("Step 6: Copying files to server...")
    scp_command("dist/*", f"{DEPLOY_PATH}/")
    print("✓ Files copied")
    print()
    
    # Step 7: Setup Nginx
    print("Step 7: Setting up Nginx...")
    
    nginx_config = f"""server {{
    listen {FRONTEND_PORT};
    server_name _;
    
    root {DEPLOY_PATH};
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {{
        try_files $uri $uri/ /index.html;
    }}
    
    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
}}"""
    
    # Install Nginx if needed
    ssh_command("command -v nginx || (apt-get update && apt-get install -y nginx)")
    
    # Create config file
    ssh_command(f"cat > /etc/nginx/sites-available/godam-web << 'EOF'\n{nginx_config}\nEOF")
    
    # Enable site
    ssh_command("ln -sf /etc/nginx/sites-available/godam-web /etc/nginx/sites-enabled/godam-web")
    ssh_command("rm -f /etc/nginx/sites-enabled/default")
    
    # Test and restart Nginx
    result = ssh_command("nginx -t && systemctl restart nginx && systemctl enable nginx")
    
    if result.returncode == 0:
        print("✓ Nginx configured and restarted")
    else:
        print("⚠ Nginx configuration may have issues")
    print()
    
    # Step 8: Verify deployment
    print("Step 8: Verifying deployment...")
    result = ssh_command(f"ls -la {DEPLOY_PATH}/")
    print()
    
    print("=" * 50)
    print("Deployment completed!")
    print("=" * 50)
    print()
    print(f"Frontend: http://{SERVER_IP}:{FRONTEND_PORT}")
    print(f"Backend:  {BACKEND_URL}")
    print()
    print("To check Nginx status:")
    print(f"  ssh {SERVER_USER}@{SERVER_IP} 'systemctl status nginx'")
    print()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
