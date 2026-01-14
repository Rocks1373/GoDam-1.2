# GoDam 1.2 - Quick Start Guide

**⚡ Get up and running in 5 minutes!**

---

## 🚀 **One-Command Start (Recommended)**

### **Development Mode - All Services**

```bash
# Navigate to project directory
cd /Users/deepaksharma/Desktop/DeepakInventory/GoDam_1.2

# Start everything (database + backend + web admin)
./start-dev.sh

# Services will be available at:
# - Web Admin:  http://localhost:3000
# - Backend API: http://localhost:8081
# - Database:    localhost:5432
```

### **Stop All Services**

```bash
./stop-dev.sh
```

---

## 📱 **Start Mobile App**

```bash
# Start Android emulator + Flutter app
./start-mobile.sh android

# Start iOS simulator + Flutter app (macOS only)
./start-mobile.sh ios

# Start both and choose device
./start-mobile.sh both
```

---

## 🐳 **Docker Deployment (Production)**

```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down

# Clean restart (removes data!)
docker-compose down -v && docker-compose up -d --build
```

---

## 🔧 **Manual Start (Alternative)**

### **Terminal 1: Database**

```bash
docker-compose up -d db
```

### **Terminal 2: Backend**

```bash
cd backend-java
mvn spring-boot:run
```

### **Terminal 3: Web Admin**

```bash
cd web-admin
npm run dev
```

### **Terminal 4: Flutter (Optional)**

```bash
cd flutter
flutter run
```

---

## 🧪 **Test Complete DN Flow**

### **1. Backend Health Check**

```bash
curl http://localhost:8081/actuator/health
# Expected: {"status":"UP"}
```

### **2. Test API**

```bash
# Get all orders
curl http://localhost:8081/api/orders

# Get order details
curl http://localhost:8081/api/orders/1

# Check dnCreated flag
curl http://localhost:8081/api/orders | grep dnCreated
```

### **3. Test Web Admin**

1. Open http://localhost:3000
2. Login with your credentials
3. Go to Orders page
4. Select order without DN
5. Click "Generate DN"
6. Fill form and click "Save"
7. **Verify:** Order disappears from list (dnCreated = true)
8. Click "Print" to view DN

### **4. Test Mobile App**

```bash
# Start app
./start-mobile.sh android

# Or manually
cd flutter
flutter run
```

---

## 📊 **Useful Commands**

### **View Logs**

```bash
# Backend logs
tail -f logs/backend.log

# Web admin logs
tail -f logs/web-admin.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f db
docker-compose logs -f web

# Flutter logs
cd flutter && flutter logs
```

### **Database Access**

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U godam -d godam

# Or using local client
psql -h localhost -p 5432 -U godam -d godam
# Password: godam

# Check dnCreated flag
SELECT id, outbound_number, dn_created
FROM "OrderWorkflows"
WHERE dn_created = true;
```

### **Check Running Services**

```bash
# Check ports
lsof -i :8080  # Backend
lsof -i :3000  # Web Admin
lsof -i :5432  # Database

# Check Docker containers
docker-compose ps

# Check Flutter devices
cd flutter && flutter devices
```

---

## 🛠️ **Troubleshooting**

### **Port Already in Use**

```bash
# Kill process on port 8081 (backend)
lsof -ti:8081 | xargs kill -9

# Kill process on port 3000 (web)
lsof -ti:3000 | xargs kill -9

# Or change ports in config files
```

### **Database Connection Failed**

```bash
# Restart database
docker-compose restart db

# Check database is running
docker ps | grep godam-db

# View database logs
docker-compose logs db
```

### **Backend Won't Start**

```bash
cd backend-java

# Clean build
mvn clean install -DskipTests

# Check Java version
java --version  # Should be 17+

# Increase memory
export MAVEN_OPTS="-Xmx2048m"
mvn spring-boot:run
```

### **Web Admin Not Loading**

```bash
cd web-admin

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment
cat .env.local
# Should have: VITE_API_BASE_URL=http://localhost:8081
```

### **Flutter Build Errors**

```bash
cd flutter

# Clean and rebuild
flutter clean
flutter pub get
flutter run

# Check setup
flutter doctor -v

# Fix Android licenses
flutter doctor --android-licenses
```

---

## 📦 **Build for Production**

### **Backend JAR**

```bash
cd backend-java
mvn clean package -DskipTests
# JAR: target/godam-backend-0.0.1-SNAPSHOT.jar
```

### **Web Admin Build**

```bash
cd web-admin
npm run build
# Output: dist/
```

### **Android APK**

```bash
cd flutter
flutter build apk --release
# APK: build/app/outputs/flutter-apk/app-release.apk
```

### **iOS IPA** (macOS only)

```bash
cd flutter
flutter build ios --release
# Open in Xcode for signing: open ios/Runner.xcworkspace
```

---

## 🎯 **Default Credentials**

```
Database:
  Host: localhost
  Port: 5432
  Database: godam
  Username: godam
  Password: godam

Application:
  Check Users table in database for credentials
  Or create new user via API
```

---

## 📚 **Additional Documentation**

- **Full Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Database Schema:** [docs/DATABASE_SCHEMA_REPORT.csv](docs/DATABASE_SCHEMA_REPORT.csv)
- **Entity Mapping:** [docs/DATABASE_ENTITY_MAPPING_REPORT.csv](docs/DATABASE_ENTITY_MAPPING_REPORT.csv)
- **Field Mapping:** [docs/FIELD_MAPPING_REPORT.csv](docs/FIELD_MAPPING_REPORT.csv)
- **Mapping Guide:** [docs/DATABASE_MAPPING_README.md](docs/DATABASE_MAPPING_README.md)

---

## 🆘 **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| Port 8081 in use | `lsof -ti:8081 \| xargs kill -9` |
| Database not connecting | `docker-compose restart postgres` |
| npm install fails | `rm -rf node_modules && npm install` |
| Flutter emulator won't start | `flutter doctor` and fix issues |
| Backend out of memory | `export MAVEN_OPTS="-Xmx2048m"` |
| CORS errors in browser | Check backend CORS config |
| DN not saving | Verify backend logs for errors |
| Mobile app can't reach API | Update API URL in Flutter config |

---

## ✅ **Development Checklist**

- [ ] Install Java 17+
- [ ] Install Node.js 18+
- [ ] Install Docker & Docker Compose
- [ ] Install Flutter (for mobile)
- [ ] Run `./start-dev.sh`
- [ ] Access http://localhost:3000
- [ ] Login successfully
- [ ] Create test delivery note
- [ ] Verify dnCreated flag set
- [ ] Test print DN
- [ ] Test mobile app (optional)

---

**Need Help?**
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions
- View logs in `logs/` directory
- Check Docker logs with `docker-compose logs -f`

---

**Generated:** 2026-01-10
**Version:** GoDam 1.2
**Status:** ✅ DN Fix Applied & Tested
