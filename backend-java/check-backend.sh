#!/bin/bash

echo "=========================================="
echo "🔍 Checking Backend Status"
echo "=========================================="
echo ""

# Check if backend is running on port 8080
echo "1. Checking if port 8080 is in use..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Port 8080 is in use"
    echo "   Process: $(lsof -Pi :8080 -sTCP:LISTEN | tail -1)"
else
    echo "   ❌ Port 8080 is NOT in use"
    echo "   Backend is not running!"
    echo ""
    echo "   To start backend:"
    echo "   cd backend-java"
    echo "   ./start-backend.sh"
    exit 1
fi

echo ""
echo "2. Testing backend endpoint..."
RESPONSE=$(curl -s http://localhost:8080/ 2>&1)

if [ $? -eq 0 ]; then
    echo "   ✅ Backend is responding"
    echo "   Response: $RESPONSE"
else
    echo "   ❌ Backend is not responding"
    echo "   Error: $RESPONSE"
    exit 1
fi

echo ""
echo "3. Checking backend binding..."
BINDING=$(lsof -Pi :8080 -sTCP:LISTEN | grep LISTEN | awk '{print $9}')
if [[ $BINDING == *"*:8080"* ]] || [[ $BINDING == *"0.0.0.0:8080"* ]]; then
    echo "   ✅ Backend is bound to 0.0.0.0 (accessible from emulator)"
else
    echo "   ⚠️  Backend binding: $BINDING"
    echo "   If binding to 127.0.0.1, emulator won't be able to connect"
fi

echo ""
echo "=========================================="
echo "✅ Backend is running and accessible!"
echo "=========================================="
echo ""
echo "Backend URL: http://localhost:8080"
echo "For Android Emulator: http://10.0.2.2:8080"
echo ""
