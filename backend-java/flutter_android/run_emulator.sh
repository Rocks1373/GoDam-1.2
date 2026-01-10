#!/bin/bash
set -eu

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FLUTTER_DIR="$REPO_ROOT/flutter"

echo "📱 Launching GoDam Android (VPS backend)"
echo "🌐 Backend URL: http://72.61.245.23:8081"
echo ""

cd "$FLUTTER_DIR"

flutter pub get

echo ""
echo "Available devices:"
flutter devices

echo ""
echo "Starting Flutter on emulator/device..."
flutter run --dart-define=API_BASE_URL=http://72.61.245.23:8081
