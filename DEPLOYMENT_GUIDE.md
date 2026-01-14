# GoDam 1.2 - Complete Deployment & Testing Guide

**Last Updated:** 2026-01-10
**Platform:** macOS (also works on Linux/Windows with minor adjustments)

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Quick Start (Development)](#quick-start-development)
3. [Docker Deployment (Production)](#docker-deployment-production)
4. [Mobile App Development](#mobile-app-development)
5. [Testing Complete Flow](#testing-complete-flow)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 **Prerequisites**

### **Required Software**

```bash
# Check installed versions
java --version          # Java 17 or higher
node --version          # Node.js 18 or higher
npm --version           # npm 9 or higher
docker --version        # Docker 20 or higher
docker-compose --version # Docker Compose 1.29 or higher
flutter --version       # Flutter 3.0 or higher (for mobile)
```

### **Install Missing Dependencies**

```bash
# macOS (using Homebrew)
brew install openjdk@17
brew install node
brew install docker
brew install --cask docker
brew install postgresql@15

# Install Flutter (if not installed)
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"
flutter doctor  # Check Flutter installation

# Install Android Studio (for Android emulator)
brew install --cask android-studio

# Install Xcode (for iOS emulator - macOS only)
# Download from App Store
xcode-select --install
```

---

## 🚀 **Quick Start (Development)**

### **Option 1: Run All Services Separately**

#### **Step 1: Start Database**

```bash
# Navigate to project root
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2

# Start PostgreSQL database
docker run -d \
  --name godam-postgres \
  -e POSTGRES_DB=godam \
  -e POSTGRES_USER=godam \
  -e POSTGRES_PASSWORD=godam \
  -p 5432:5432 \
  -v $(pwd)/backend-java/postgresql_schema.sql:/docker-entrypoint-initdb.d/schema.sql \
  postgres:15

# Wait 10 seconds for DB to initialize
sleep 10

# Verify database is running
docker ps | grep godam-postgres
```

#### **Step 2: Start Backend (Java/Spring Boot)**

```bash
# Terminal 1: Backend
cd backend-java

# Clean and compile
mvn clean install -DskipTests

# Run Spring Boot application
mvn spring-boot:run

# OR using JAR
# mvn package -DskipTests
# java -jar target/godam-backend-0.0.1-SNAPSHOT.jar

# Backend will start on: http://localhost:8080
# API docs available at: http://localhost:8080/swagger-ui.html
```

**Backend Health Check:**
```bash
# In new terminal
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

#### **Step 3: Start Web Admin (React/Vite)**

```bash
# Terminal 2: Web Admin
cd web-admin

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Web admin will start on: http://localhost:3000
# OR http://localhost:5173 (depending on Vite config)
```

**Web Admin Environment Variables:**
```bash
# Create .env file in web-admin/
cat > .env << EOF
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=GoDam Admin
EOF
```

#### **Step 4: Start Flutter Mobile App (Development)**

```bash
# Terminal 3: Flutter
cd flutter

# Get dependencies (first time only)
flutter pub get

# List available devices
flutter devices

# Run on Android emulator
flutter run -d <android-device-id>

# Run on iOS simulator (macOS only)
flutter run -d <ios-device-id>

# Run on Chrome (for web testing)
flutter run -d chrome

# Hot reload: Press 'r' in terminal
# Hot restart: Press 'R' in terminal
```

---

## 🐳 **Docker Deployment (Production)**

### **Option 2: Run Everything with Docker Compose**

#### **Single Container Deployment**

```bash
# Navigate to project root
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2

# Build and start all services
docker-compose up -d --build

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Services will be available at:
# - Database: localhost:5432
# - Backend API: http://localhost:8080
# - Web Admin: http://localhost:3000
```

#### **Stop All Services**

```bash
# Stop containers (preserve data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

#### **Individual Container Commands**

```bash
# Restart specific service
docker-compose restart backend
docker-compose restart web

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f db

# Execute commands in running container
docker-compose exec backend bash
docker-compose exec db psql -U godam -d godam
```

---

## 📱 **Mobile App Development**

### **Android Setup**

#### **1. Start Android Emulator**

```bash
# List available Android Virtual Devices (AVDs)
emulator -list-avds

# Start emulator
emulator -avd Pixel_4_API_30 &

# OR create new AVD using Android Studio
android-studio
# Tools → AVD Manager → Create Virtual Device
```

#### **2. Run Flutter App on Android**

```bash
cd flutter

# Check connected devices
flutter devices

# Run on Android emulator
flutter run

# OR specify device
flutter run -d emulator-5554

# Build APK for testing
flutter build apk --debug
# APK location: build/app/outputs/flutter-apk/app-debug.apk

# Build production APK
flutter build apk --release
# APK location: build/app/outputs/flutter-apk/app-release.apk
```

#### **3. Install APK on Physical Device**

```bash
# Enable USB debugging on Android device
# Connect via USB

# Install debug APK
adb install build/app/outputs/flutter-apk/app-debug.apk

# View device logs
adb logcat | grep flutter
```

### **iOS Setup (macOS Only)**

#### **1. Start iOS Simulator**

```bash
# List available iOS simulators
xcrun simctl list devices

# Boot iOS simulator
open -a Simulator

# OR boot specific device
xcrun simctl boot "iPhone 14 Pro"
```

#### **2. Run Flutter App on iOS**

```bash
cd flutter

# Check iOS setup
flutter doctor

# Run on iOS simulator
flutter run

# OR specify simulator
flutter run -d <simulator-id>

# Build IPA (requires Apple Developer account)
flutter build ios --release

# Open in Xcode for signing
open ios/Runner.xcworkspace
```

---

## 🧪 **Testing Complete Flow**

### **End-to-End Test Scenario**

```bash
# 1. Start all services
docker-compose up -d
cd flutter && flutter run &

# 2. Wait for services to be ready
sleep 30

# 3. Test Backend API
curl http://localhost:8080/api/orders
# Expected: JSON array of orders

# 4. Test Web Admin
open http://localhost:3000
# Login with credentials

# 5. Test Complete DN Flow
```

### **Manual Test Checklist**

#### **Backend Tests**

```bash
# Test 1: Health check
curl http://localhost:8080/actuator/health

# Test 2: Get orders
curl http://localhost:8080/api/orders

# Test 3: Get order details
curl http://localhost:8080/api/orders/1

# Test 4: Create delivery note
curl -X POST http://localhost:8080/api/delivery-note \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "dnNumber": "DN-TEST-001",
    "outboundNumber": "OB-TEST-001",
    "customerId": 1,
    "transporterId": 1,
    "driverId": 1,
    "quantities": [
      {"description": "Test Item", "quantity": 10}
    ]
  }'

# Test 5: Verify dnCreated flag was set
curl http://localhost:8080/api/orders/1 | grep dnCreated
# Expected: "dnCreated":true
```

#### **Web Admin Tests**

1. **Login**
   - URL: http://localhost:3000
   - Username: `admin` (or from DB)
   - Password: `your_password`

2. **Navigate to Orders**
   - Click "Orders" in sidebar
   - Verify orders list loads
   - Check `dnCreated` status column

3. **Create Delivery Note**
   - Select order without DN
   - Click "Generate DN"
   - Fill form:
     - Customer: Select from dropdown
     - Transporter: Select from dropdown
     - Driver: Select from dropdown
     - Quantities: Add items
   - Click "Save"
   - Verify success message
   - Check order disappears from "Pending DN" list

4. **Print Delivery Note**
   - Click "Print" button
   - Verify DN opens in new window
   - Check all fields populated correctly

#### **Mobile App Tests (Flutter)**

1. **Android Emulator**
   ```bash
   # Start emulator
   emulator -avd Pixel_4_API_30 &

   # Run Flutter app
   cd flutter
   flutter run -d emulator-5554
   ```

2. **iOS Simulator**
   ```bash
   # Start simulator
   open -a Simulator

   # Run Flutter app
   cd flutter
   flutter run
   ```

3. **Test Mobile Flow**
   - Launch app
   - Login with credentials
   - Navigate to Orders
   - View order details
   - Test DN creation (if supported in mobile)
   - Test delivery status update

---

## 🔍 **Monitoring & Logs**

### **Check Service Status**

```bash
# Docker Compose services
docker-compose ps

# Individual container health
docker inspect godam-backend | grep -A 5 Health
docker inspect godam-db | grep -A 5 Health

# Port bindings
docker-compose port backend 8080
docker-compose port web 3000
```

### **View Logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 backend

# Backend Java logs (if running without Docker)
tail -f backend-java/logs/application.log

# Flutter logs
flutter logs
```

### **Database Access**

```bash
# Connect to PostgreSQL via Docker
docker-compose exec db psql -U godam -d godam

# Or using local psql client
psql -h localhost -p 5432 -U godam -d godam

# Common queries
SELECT * FROM "Users" LIMIT 5;
SELECT * FROM "OrderWorkflows" WHERE dn_created = true;
SELECT * FROM "Stock" ORDER BY created_at DESC LIMIT 10;
```

---

## 🛠️ **Troubleshooting**

### **Backend Issues**

#### **Port Already in Use**

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in application.properties
echo "server.port=8081" >> backend-java/src/main/resources/application.properties
```

#### **Database Connection Failed**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -p 5432 -U godam -d godam -c "SELECT 1"

# Restart database
docker-compose restart db

# Check backend application.properties
cat backend-java/src/main/resources/application.properties | grep datasource
```

#### **Maven Build Fails**

```bash
# Clean Maven cache
cd backend-java
mvn clean

# Update dependencies
mvn clean install -U

# Skip tests
mvn clean install -DskipTests

# Increase memory
export MAVEN_OPTS="-Xmx2048m"
mvn clean install
```

### **Web Admin Issues**

#### **npm install fails**

```bash
cd web-admin

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use yarn instead
npm install -g yarn
yarn install
```

#### **API Connection Error**

```bash
# Check .env file
cat web-admin/.env
# Should have: VITE_API_URL=http://localhost:8080

# Check backend is accessible
curl http://localhost:8080/actuator/health

# Check browser console for CORS errors
# Fix CORS in backend if needed
```

### **Flutter Issues**

#### **Flutter Doctor Issues**

```bash
flutter doctor -v

# Fix Android licenses
flutter doctor --android-licenses

# Fix iOS setup (macOS)
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

#### **Emulator Not Starting**

```bash
# Android emulator
emulator -list-avds
emulator -avd <avd-name> -verbose

# iOS simulator
xcrun simctl list devices
killall Simulator
open -a Simulator

# Check available space
df -h
```

#### **Build Errors**

```bash
cd flutter

# Clean build
flutter clean

# Get dependencies
flutter pub get

# Rebuild
flutter run

# Check for platform-specific issues
flutter doctor
```

### **Docker Issues**

#### **Container Won't Start**

```bash
# Check logs
docker-compose logs backend

# Remove and rebuild
docker-compose down
docker-compose up -d --build --force-recreate

# Check disk space
docker system df
docker system prune -a
```

#### **Database Schema Not Applied**

```bash
# Manually run schema
docker-compose exec db psql -U godam -d godam -f /docker-entrypoint-initdb.d/schema.sql

# Or restart with fresh volume
docker-compose down -v
docker-compose up -d
```

---

## 📦 **Production Deployment**

### **Build Production Images**

```bash
# Build backend
cd backend-java
mvn clean package -DskipTests
docker build -t godam-backend:1.2.0 .

# Build web admin
cd ../web-admin
npm run build
docker build -t godam-web:1.2.0 .

# Tag for registry
docker tag godam-backend:1.2.0 your-registry/godam-backend:1.2.0
docker tag godam-web:1.2.0 your-registry/godam-web:1.2.0

# Push to registry
docker push your-registry/godam-backend:1.2.0
docker push your-registry/godam-web:1.2.0
```

### **Deploy to Server**

```bash
# SSH to server
ssh user@your-server.com

# Pull images
docker pull your-registry/godam-backend:1.2.0
docker pull your-registry/godam-web:1.2.0

# Run with docker-compose
cd /opt/godam
docker-compose up -d
```

---

## 🎯 **Quick Reference Commands**

### **Development Workflow**

```bash
# Start development environment
docker-compose up -d db              # Start database
cd backend-java && mvn spring-boot:run &  # Start backend
cd web-admin && npm run dev &        # Start web
cd flutter && flutter run &          # Start mobile

# Test DN fix
curl http://localhost:8080/api/orders | grep dnCreated
```

### **Testing Checklist**

- [ ] Backend starts without errors
- [ ] Web admin loads at http://localhost:3000
- [ ] Login works
- [ ] Orders list loads
- [ ] Can create DN with orderId
- [ ] dnCreated flag is set to true
- [ ] Order disappears from pending list
- [ ] Print DN works
- [ ] Mobile app connects to backend
- [ ] Mobile app can view orders

---

## 📞 **Support**

- **Backend Issues:** Check `backend-java/logs/`
- **Frontend Issues:** Check browser console
- **Database Issues:** Check `docker-compose logs db`
- **Mobile Issues:** Run `flutter doctor`

---

**Generated by:** Claude Code (Anthropic)
**Project:** GoDam 1.2 Inventory Management Platform
**Last Updated:** 2026-01-10
