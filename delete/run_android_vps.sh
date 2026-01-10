#!/bin/bash

echo "📱 Starting GoDam Android App..."
echo "🌐 Connecting to VPS Backend: http://72.61.245.23:8081"
echo ""

# Check for connected devices
echo "📱 Available devices:"
flutter devices

echo ""
echo "🚀 Starting app with VPS backend..."
echo "   Backend URL: http://72.61.245.23:8081"
echo "   Web URL: http://72.61.245.23:8082"
echo ""

# Run with VPS backend URL
flutter run \
  --dart-define=API_BASE_URL=http://72.61.245.23:8081 \
  -d $(flutter devices --machine | grep -o 'iphone\|android' | head -1)
