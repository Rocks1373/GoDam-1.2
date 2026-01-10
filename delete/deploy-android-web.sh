#!/bin/bash

# Flutter GoDam Android & Web Deployment Script
# Deploys Flutter app to VPS (web) and builds Android APK

set -e

echo "=========================================="
echo "GoDam Flutter Deployment Script"
echo "=========================================="
echo ""

# Configuration
VPS_IP="72.61.245.23"
VPS_USER="root"
VPS_PASSWORD="9804409636Aa@themaninthemooN"
BACKEND_URL="http://72.61.245.23:8081"
FLUTTER_DIR="/Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/flutter"
VPS_APP_DIR="/root/godam-app/flutter-web"

echo "Step 1: Installing Flutter dependencies..."
cd "${FLUTTER_DIR}"
flutter pub get
echo "✓ Dependencies installed"
echo ""

echo "Step 2: Building Flutter web app..."
# Build with base href for subdirectory deployment
flutter build web --base-href "/flutter/"
echo "✓ Web build complete"
echo ""

echo "Step 3: Updating Flutter web configuration..."
# Update index.html with correct API base URL
sed -i '' "s|http://localhost:8080|${BACKEND_URL}|g" build/web/index.html 2>/dev/null || true
echo "✓ Configuration updated"
echo ""

echo "Step 4: Deploying Flutter web to VPS..."
# Create directory on VPS
sshpass -p "${VPS_PASSWORD}" ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" \
  "mkdir -p ${VPS_APP_DIR}"

# Copy web build to VPS
sshpass -p "${VPS_PASSWORD}" scp -o StrictHostKeyChecking=no -r \
  build/web/* "${VPS_USER}@${VPS_IP}:${VPS_APP_DIR}/"

echo "✓ Flutter web deployed to VPS"
echo ""

echo "=========================================="
echo "Flutter Web URL: http://${VPS_IP}:8082/flutter/"
echo "=========================================="
echo ""
echo "NOTE: The Flutter web app is deployed to port 8082 under /flutter/ path"
echo "      The web-admin frontend is also on port 8082 at /"
echo ""

echo "=========================================="
echo "Android APK Build Commands"
echo "=========================================="
echo ""
echo "To build Android APK, run one of these commands:"
echo ""
echo "1. Debug APK (faster build):"
echo "   cd ${FLUTTER_DIR}"
echo "   flutter build apk --debug"
echo ""
echo "2. Release APK (smaller, optimized):"
echo "   cd ${FLUTTER_DIR}"
echo "   flutter build apk --release"
echo ""
echo "3. App Bundle (for Play Store):"
echo "   cd ${FLUTTER_DIR}"
echo "   flutter build appbundle --release"
echo ""
echo "APK output location:"
echo "   ${FLUTTER_DIR}/build/app/outputs/flutter-apk/"
echo ""
echo "=========================================="
