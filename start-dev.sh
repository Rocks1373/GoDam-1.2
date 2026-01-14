#!/bin/bash
# GoDam 1.2 - Development Environment Startup Script
# Usage: ./start-dev.sh

set -e

echo "🚀 Starting GoDam 1.2 Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found. Please run from project root.${NC}"
    exit 1
fi

# Step 1: Start Database
echo -e "${BLUE}[1/3] Starting PostgreSQL database...${NC}"
docker-compose up -d postgres
sleep 5
echo -e "${GREEN}✓ Database started on port 5432${NC}"
echo ""

# Step 2: Start Backend
echo -e "${BLUE}[2/3] Starting Backend API (Spring Boot)...${NC}"
cd backend-java
if [ ! -d "target" ]; then
    echo "Building backend for the first time..."
    mvn clean install -DskipTests
fi
mvn spring-boot:run > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo -e "${GREEN}✓ Backend starting on port 8080 (PID: $BACKEND_PID)${NC}"
echo ""

# Step 3: Start Web Admin
echo -e "${BLUE}[3/3] Starting Web Admin (React/Vite)...${NC}"
cd web-admin
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for the first time..."
    npm install
fi
npm run dev > ../logs/web-admin.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > ../logs/web-admin.pid
cd ..
echo -e "${GREEN}✓ Web Admin starting on port 3000 (PID: $WEB_PID)${NC}"
echo ""

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 15

# Health checks
echo ""
echo -e "${BLUE}Checking service health...${NC}"

# Check database
if docker ps | grep -q godam-db; then
    echo -e "${GREEN}✓ Database: Running${NC}"
else
    echo -e "${RED}✗ Database: Not running${NC}"
fi

# Check backend
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend: Running on http://localhost:8081${NC}"
else
    echo -e "${RED}✗ Backend: Not responding (check logs/backend.log)${NC}"
fi

# Check web admin
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Web Admin: Running on http://localhost:3000${NC}"
else
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Web Admin: Running on http://localhost:5173${NC}"
    else
        echo -e "${RED}✗ Web Admin: Not responding (check logs/web-admin.log)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 GoDam 1.2 Development Environment Ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo "   - Web Admin:  http://localhost:3000"
echo "   - Backend API: http://localhost:8081"
echo "   - API Docs:    http://localhost:8081/swagger-ui.html"
echo "   - Database:    localhost:5432"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo "   - View backend logs:   tail -f logs/backend.log"
echo "   - View web logs:       tail -f logs/web-admin.log"
echo "   - Stop all services:   ./stop-dev.sh"
echo "   - Restart services:    ./restart-dev.sh"
echo ""
echo -e "${BLUE}📱 To start Flutter mobile app:${NC}"
echo "   cd flutter && flutter run"
echo ""
echo -e "${BLUE}🧪 To test DN fix:${NC}"
echo "   curl http://localhost:8081/api/orders | grep dnCreated"
echo ""
