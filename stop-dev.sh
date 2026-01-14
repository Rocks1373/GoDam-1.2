#!/bin/bash
# GoDam 1.2 - Stop Development Environment
# Usage: ./stop-dev.sh

set -e

echo "🛑 Stopping GoDam 1.2 Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Stop backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi
else
    echo "Backend PID file not found, trying port-based kill..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
fi

# Stop web admin
if [ -f logs/web-admin.pid ]; then
    WEB_PID=$(cat logs/web-admin.pid)
    if ps -p $WEB_PID > /dev/null 2>&1; then
        echo "Stopping Web Admin (PID: $WEB_PID)..."
        kill $WEB_PID
        rm logs/web-admin.pid
        echo -e "${GREEN}✓ Web Admin stopped${NC}"
    fi
else
    echo "Web Admin PID file not found, trying port-based kill..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# Stop database
echo "Stopping Database..."
docker-compose stop postgres
echo -e "${GREEN}✓ Database stopped${NC}"

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
echo "To start again, run: ./start-dev.sh"
echo ""
