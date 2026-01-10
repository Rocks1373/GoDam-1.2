#!/bin/bash

# GoDam VPS Organization Script
# Consolidates all GoDam application files into organized structure

set -e

echo "=========================================="
echo "GoDam VPS Organization Script"
echo "=========================================="
echo ""

# Configuration
GODAM_ROOT="/root/godam-app"
BACKUP_DIR="/root/godam-backup-$(date +%Y%m%d-%H%M%S)"

echo "Step 1: Creating directory structure..."
mkdir -p "${GODAM_ROOT}/backend"
mkdir -p "${GODAM_ROOT}/frontend-web"
mkdir -p "${GODAM_ROOT}/database"
mkdir -p "${GODAM_ROOT}/config"
mkdir -p "${GODAM_ROOT}/logs"
mkdir -p "${GODAM_ROOT}/data"
echo "✓ Directory structure created"
echo ""

echo "Step 2: Backing up existing files..."
if [ ! -d "${BACKUP_DIR}" ]; then
    mkdir -p "${BACKUP_DIR}"
    # Backup existing files if they exist in root
    for file in app.jar godam-backend.jar godam.db godam-data godam-nginx.conf godam-web; do
        if [ -e "/root/${file}" ]; then
            cp -r "/root/${file}" "${BACKUP_DIR}/" 2>/dev/null || true
            echo "  Backed up: ${file}"
        fi
    done
    echo "✓ Backup created at: ${BACKUP_DIR}"
else
    echo "⚠ Backup directory already exists, skipping backup"
fi
echo ""

echo "Step 3: Organizing backend files..."
# Move backend jar files
if [ -f "/root/app.jar" ]; then
    cp "/root/app.jar" "${GODAM_ROOT}/backend/" 2>/dev/null || true
    echo "  Moved: app.jar"
fi
if [ -f "/root/godam-backend.jar" ]; then
    cp "/root/godam-backend.jar" "${GODAM_ROOT}/backend/" 2>/dev/null || true
    echo "  Moved: godam-backend.jar"
fi

# Move backend source if exists
if [ -d "/root/backend-java" ]; then
    cp -r "/root/backend-java" "${GODAM_ROOT}/backend/source/" 2>/dev/null || true
    echo "  Moved: backend-java source"
fi
echo "✓ Backend files organized"
echo ""

echo "Step 4: Organizing frontend web files..."
# Move godam-web contents
if [ -d "/root/godam-web" ]; then
    cp -r "/root/godam-web/"* "${GODAM_ROOT}/frontend-web/" 2>/dev/null || true
    echo "  Moved: godam-web contents"
fi
echo "✓ Frontend files organized"
echo ""

echo "Step 5: Organizing database files..."
# Move database files
if [ -f "/root/godam.db" ]; then
    cp "/root/godam.db" "${GODAM_ROOT}/database/" 2>/dev/null || true
    echo "  Moved: godam.db"
fi

# Move godam-data directory
if [ -d "/root/godam-data" ]; then
    cp -r "/root/godam-data/"* "${GODAM_ROOT}/data/" 2>/dev/null || true
    echo "  Moved: godam-data contents"
fi

# Move SQL files
for sqlfile in schema.sql schema_sqlserver.sql create_stockmovements.sql order_transport.sql; do
    if [ -f "/root/${sqlfile}" ]; then
        cp "/root/${sqlfile}" "${GODAM_ROOT}/database/" 2>/dev/null || true
        echo "  Moved: ${sqlfile}"
    fi
done
echo "✓ Database files organized"
echo ""

echo "Step 6: Organizing configuration files..."
# Move configuration files
if [ -f "/root/godam-nginx.conf" ]; then
    cp "/root/godam-nginx.conf" "${GODAM_ROOT}/config/" 2>/dev/null || true
    echo "  Moved: godam-nginx.conf"
fi

# Move package files if they exist
if [ -f "/root/package.json" ]; then
    cp "/root/package.json" "${GODAM_ROOT}/frontend-web/" 2>/dev/null || true
    echo "  Moved: package.json"
fi
if [ -f "/root/package-lock.json" ]; then
    cp "/root/package-lock.json" "${GODAM_ROOT}/frontend-web/" 2>/dev/null || true
    echo "  Moved: package-lock.json"
fi
echo "✓ Configuration files organized"
echo ""

echo "Step 7: Creating README and structure documentation..."
cat > "${GODAM_ROOT}/README.md" << 'EOF'
# GoDam Application Structure

## Directory Structure

```
godam-app/
├── backend/           # Backend Java application
│   ├── app.jar       # Main application JAR
│   ├── godam-backend.jar
│   └── source/       # Source code (backup)
├── frontend-web/     # Web admin frontend
│   ├── dist/         # Built files
│   ├── src/          # Source code
│   ├── package.json
│   └── vite.config.ts
├── database/         # Database files
│   ├── godam.db      # SQLite database
│   ├── schema.sql
│   └── schema_sqlserver.sql
├── config/           # Configuration files
│   └── godam-nginx.conf
├── data/             # Application data
│   └── (data files)
└── logs/             # Log files
    └── (log files)
```

## Running the Application

### Backend
```bash
cd /root/godam-app/backend
java -jar app.jar
```

### Frontend Web
```bash
cd /root/godam-app/frontend-web
npm install
npm run dev
```

### With Docker
```bash
# Backend
docker run -d -p 8081:8080 -v /root/godam-app/data:/data godam-backend

# Frontend
docker run -d -p 8082:80 -v /root/godam-app/frontend-web:/usr/share/nginx/html godam-web
```

## Notes
- All application files are consolidated in /root/godam-app/
- Original files in /root/ are backed up to /root/godam-backup-YYYYMMDD-HHMMSS/
- Database is at /root/godam-app/database/godam.db
EOF
echo "✓ README created"
echo ""

echo "Step 8: Creating Docker deployment files..."
# Create docker-compose for easy deployment
cat > "${GODAM_ROOT}/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  godam-backend:
    image: eclipse-temurin:17-jre
    container_name: godam-backend
    ports:
      - "8081:8080"
    volumes:
      - ./data:/data:rw
      - ./database:/database:rw
    environment:
      - SPRING_DATASOURCE_URL=jdbc:sqlite:/database/godam.db
      - SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.sqlite.JDBC
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  godam-web:
    image: nginx:alpine
    container_name: godam-web
    ports:
      - "8082:80"
    volumes:
      - ./frontend-web:/usr/share/nginx/html:ro
      - ./config/godam-nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - godam-backend
    restart: unless-stopped
EOF
echo "✓ docker-compose.yml created"
echo ""

# Create nginx config
cat > "${GODAM_ROOT}/config/godam-nginx.conf" << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # API proxy for backend
    location /api/ {
        proxy_pass http://godam-backend:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Auth endpoints
    location /auth/ {
        proxy_pass http://godam-backend:8080/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # DN print endpoint
    location /dn/ {
        proxy_pass http://godam-backend:8080/dn/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF
echo "✓ Nginx config created"
echo ""

echo "Step 9: Final structure verification..."
echo ""
echo "Final structure:"
find "${GODAM_ROOT}" -type f -o -type d | head -50
echo ""

echo "=========================================="
echo "Organization Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - New location: ${GODAM_ROOT}"
echo "  - Backup location: ${BACKUP_DIR}"
echo "  - Backend: ${GODAM_ROOT}/backend/"
echo "  - Frontend: ${GODAM_ROOT}/frontend-web/"
echo "  - Database: ${GODAM_ROOT}/database/"
echo "  - Config: ${GODAM_ROOT}/config/"
echo ""
echo "To start the application:"
echo "  cd ${GODAM_ROOT}"
echo "  docker-compose up -d"
echo ""
