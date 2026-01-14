# How to Start the Backend Server

## Quick Start

```bash
cd backend-java
./mvnw spring-boot:run
```

Wait for the message: `Started GoDamApplication in X.XXX seconds`

## Important Configuration

The backend is configured to bind to **0.0.0.0** (all network interfaces) to allow connections from:
- Android Emulator (10.0.2.2)
- iOS Simulator (127.0.0.1)
- Physical devices on the same network

This is configured in `application.yml`:
```yaml
server:
  port: ${PORT:8080}
  address: ${SERVER_ADDRESS:0.0.0.0}
```

## Verify Backend is Running

### From Host Machine
```bash
curl http://localhost:8080/
# Should return: {"status":"ok","service":"GoDam backend"}
```

### From Android Emulator
The emulator uses `10.0.2.2` to access the host machine:
```bash
# From adb shell
adb shell
curl http://10.0.2.2:8080/
```

## Troubleshooting

### Backend Won't Start

1. **Check if port 8080 is already in use**:
   ```bash
   lsof -i :8080
   # Kill the process if needed
   kill -9 <PID>
   ```

2. **Check database connection**:
   - Ensure PostgreSQL is running (if using PostgreSQL)
   - Or ensure SQLite database file exists (if using SQLite)

3. **Check logs**:
   ```bash
   ./mvnw spring-boot:run
   # Look for error messages in the console
   ```

### Backend Starts But Flutter Can't Connect

1. **Verify binding address**:
   - Backend must bind to `0.0.0.0`, not `localhost`
   - Check `application.yml` has: `server.address: 0.0.0.0`

2. **Check firewall**:
   ```bash
   # macOS - Allow Java through firewall
   # System Preferences > Security & Privacy > Firewall
   
   # Linux
   sudo ufw allow 8080
   
   # Windows - Add inbound rule for port 8080
   ```

3. **Test connectivity**:
   ```bash
   # From host
   curl http://localhost:8080/
   
   # From emulator (via adb)
   adb shell curl http://10.0.2.2:8080/
   ```

### For Physical Devices

1. **Find your computer's IP**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. **Update Flutter app**:
   ```bash
   flutter run --dart-define=GODAM_API=http://YOUR_IP:8080
   ```

3. **Ensure same WiFi network**:
   - Device and computer must be on the same WiFi network

## Environment Variables

You can override the default configuration:

```bash
# Change port
PORT=8081 ./mvnw spring-boot:run

# Change bind address (not recommended)
SERVER_ADDRESS=127.0.0.1 ./mvnw spring-boot:run

# Database configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/godam ./mvnw spring-boot:run
```

## Default Credentials

After first startup, default admin user is created:
- **Username**: `admin`
- **Password**: `admin`

## Next Steps

Once backend is running:
1. Verify it's accessible: `curl http://localhost:8080/`
2. Start Flutter app: `cd flutter/flutter_android && flutter run`
3. Try logging in with default credentials
