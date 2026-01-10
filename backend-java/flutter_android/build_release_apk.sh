#!/bin/bash
set -eu

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FLUTTER_DIR="$REPO_ROOT/flutter"

echo "=========================================="
echo "🔨 Building GoDam Android release APK"
echo "=========================================="
echo "Backend URL: http://72.61.245.23:8081"
echo ""

cd "$FLUTTER_DIR"

flutter pub get

flutter build apk --release --dart-define=API_BASE_URL=http://72.61.245.23:8081

echo ""
ls -lh build/app/outputs/flutter-apk/
echo "=========================================="
echo "Release APK ready (see build/app/outputs/flutter-apk/)"
echo "=========================================="
