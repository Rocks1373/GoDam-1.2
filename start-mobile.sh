#!/bin/bash
# GoDam 1.2 - Start Mobile App (Flutter)
# Usage: ./start-mobile.sh [android|ios|both]

set -e

PLATFORM=${1:-both}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📱 Starting GoDam 1.2 Mobile App..."
echo ""

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}Error: Flutter is not installed${NC}"
    echo "Install Flutter from: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# Navigate to flutter directory
if [ ! -d "flutter" ]; then
    echo -e "${RED}Error: flutter directory not found${NC}"
    exit 1
fi
cd flutter

# Check Flutter doctor
echo -e "${BLUE}Checking Flutter environment...${NC}"
flutter doctor

# Get dependencies
echo ""
echo -e "${BLUE}Getting Flutter dependencies...${NC}"
flutter pub get

# List available devices
echo ""
echo -e "${BLUE}Available devices:${NC}"
flutter devices

# Start based on platform
case $PLATFORM in
    android)
        echo ""
        echo -e "${BLUE}Starting Android emulator...${NC}"
        # Check if emulator is already running
        if ! adb devices | grep -q "emulator"; then
            # List available AVDs
            AVDS=$(emulator -list-avds)
            if [ -z "$AVDS" ]; then
                echo -e "${RED}No Android AVDs found${NC}"
                echo "Create one using: Android Studio > AVD Manager"
                exit 1
            fi

            # Start first available AVD
            FIRST_AVD=$(echo "$AVDS" | head -1)
            echo "Starting AVD: $FIRST_AVD"
            emulator -avd "$FIRST_AVD" &

            # Wait for emulator to boot
            echo "Waiting for emulator to boot..."
            adb wait-for-device
            sleep 10
        fi

        echo -e "${GREEN}✓ Android emulator ready${NC}"
        echo ""
        echo -e "${BLUE}Running Flutter app on Android...${NC}"
        flutter run -d android
        ;;

    ios)
        if [[ "$OSTYPE" != "darwin"* ]]; then
            echo -e "${RED}Error: iOS simulator only available on macOS${NC}"
            exit 1
        fi

        echo ""
        echo -e "${BLUE}Starting iOS simulator...${NC}"
        open -a Simulator

        # Wait for simulator to boot
        sleep 10

        echo -e "${GREEN}✓ iOS simulator ready${NC}"
        echo ""
        echo -e "${BLUE}Running Flutter app on iOS...${NC}"
        flutter run -d iphone
        ;;

    both)
        echo ""
        echo -e "${YELLOW}Starting both Android and iOS...${NC}"

        # Start Android
        if ! adb devices | grep -q "emulator"; then
            AVDS=$(emulator -list-avds)
            if [ ! -z "$AVDS" ]; then
                FIRST_AVD=$(echo "$AVDS" | head -1)
                echo "Starting Android AVD: $FIRST_AVD"
                emulator -avd "$FIRST_AVD" &
            fi
        fi

        # Start iOS (macOS only)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open -a Simulator
        fi

        echo ""
        echo -e "${BLUE}Waiting for devices to be ready...${NC}"
        sleep 15

        echo ""
        echo -e "${BLUE}Available devices for testing:${NC}"
        flutter devices

        echo ""
        echo -e "${BLUE}Running Flutter app on first available device...${NC}"
        flutter run
        ;;

    *)
        echo -e "${RED}Invalid platform: $PLATFORM${NC}"
        echo "Usage: ./start-mobile.sh [android|ios|both]"
        exit 1
        ;;
esac

cd ..

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📱 Mobile app started successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Hot Reload:${NC}"
echo "   - Press 'r' for hot reload"
echo "   - Press 'R' for hot restart"
echo "   - Press 'q' to quit"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "   flutter logs"
echo ""
