#!/bin/bash

echo "=========================================="
echo "🔨 Building GoDam Android APK"
echo "=========================================="
echo ""
echo "🌐 Backend URL: http://72.61.245.23:8081"
echo ""

cd "/Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2/flutter"

echo "Step 1: Getting dependencies..."
flutter pub get
echo "✓ Dependencies installed"
echo ""

echo "Step 2: Building debug APK (faster)..."
flutter build apk --debug
echo ""
echo "✅ Debug APK built successfully!"
echo ""

echo "Step 3: APK location..."
ls -lh build/app/outputs/flutter-apk/*.apk 2>/dev/null || echo "APK not found in expected location"
echo ""

echo "=========================================="
echo "APK Build Complete!"
echo "=========================================="
echo ""
echo "📱 To install on connected device:"
echo "   flutter install"
echo ""
echo "📁 APK files:"
ls -lh build/app/outputs/flutter-apk/ 2>/dev/null || echo "Check: build/app/outputs/flutter-apk/"
echo ""
