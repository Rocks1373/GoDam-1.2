# Quick Fix: Backend Connection Issue

## 🔴 Problem
Mobile app shows "Cannot connect to backend server" error.

## ✅ Solution

### Step 1: Check if Backend is Running

```bash
cd backend-java
./check-backend.sh
```

This will tell you:
- ✅ If backend is running
- ✅ If backend is accessible
- ✅ If backend is bound correctly for emulator

### Step 2: Start Backend (if not running)

```bash
cd backend-java
./start-backend.sh
```

Wait for: `Started GoDamApplication in X.XXX seconds`

### Step 3: Verify Backend is Accessible

```bash
# From host machine
curl http://localhost:8080/
# Should return: {"status":"ok","service":"GoDam backend"}
```

### Step 4: Test from Emulator

```bash
# From Android emulator (via adb)
adb shell curl http://10.0.2.2:8080/
# Should return: {"status":"ok","service":"GoDam backend"}
```

### Step 5: Retry in Mobile App

1. Open the mobile app
2. If you see the error, tap **"Retry Connection"** button
3. Or try logging in again

---

## 🔧 Common Issues

### Issue 1: Backend Not Running
**Symptom**: Port 8080 is not in use

**Fix**:
```bash
cd backend-java
./start-backend.sh
```

### Issue 2: Backend Bound to localhost Only
**Symptom**: Backend running but emulator can't connect

**Fix**: Check `application.yml` has:
```yaml
server:
  address: 0.0.0.0  # Not 127.0.0.1
```

### Issue 3: Firewall Blocking
**Symptom**: Backend running but connection refused

**Fix**: Allow port 8080 through firewall

---

## 📱 Mobile App Configuration

The mobile app is configured to use:
- **Android Emulator**: `http://10.0.2.2:8080`
- **iOS Simulator**: `http://127.0.0.1:8080`
- **Physical Device**: `http://YOUR_IP:8080`

To override:
```bash
flutter run --dart-define=GODAM_API=http://YOUR_URL
```

---

## ✅ Verification Checklist

- [ ] Backend is running (`./check-backend.sh`)
- [ ] Backend responds to `curl http://localhost:8080/`
- [ ] Backend is bound to `0.0.0.0` (not just `127.0.0.1`)
- [ ] Firewall allows port 8080
- [ ] Mobile app shows correct server URL in error message
- [ ] Tap "Retry Connection" after starting backend

---

## 🆘 Still Not Working?

1. **Check backend logs** for errors
2. **Check mobile app logs** for connection errors
3. **Verify database** is accessible
4. **Restart both** backend and mobile app
5. **Check network** connectivity

---

## 📝 Quick Commands

```bash
# Check backend status
cd backend-java && ./check-backend.sh

# Start backend
cd backend-java && ./start-backend.sh

# Test backend
curl http://localhost:8080/

# Test from emulator
adb shell curl http://10.0.2.2:8080/
```
