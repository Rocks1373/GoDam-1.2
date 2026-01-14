#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting GoDam Backend Server"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  - Port: 8080"
echo "  - Address: 0.0.0.0 (all interfaces)"
echo "  - This allows connections from Android emulator (10.0.2.2)"
echo ""
echo "To stop: Press Ctrl+C"
echo "=========================================="
echo ""

# Check if Maven wrapper exists
if [ ! -f "./mvnw" ]; then
    echo "❌ Maven wrapper (mvnw) not found!"
    echo "Please run this script from the backend-java directory"
    exit 1
fi

# Make mvnw executable
chmod +x ./mvnw

# Check if port is already in use
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 8080 is already in use!"
    echo ""
    echo "To see what's using it:"
    echo "  lsof -i :8080"
    echo ""
    echo "To kill the process:"
    echo "  kill -9 \$(lsof -t -i:8080)"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Starting Spring Boot application..."
echo ""

# Start the backend
./mvnw spring-boot:run
