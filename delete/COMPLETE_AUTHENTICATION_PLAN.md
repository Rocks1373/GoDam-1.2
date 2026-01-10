# Complete Authentication Implementation Plan

## Current Status: Backend Ready ✅

### ✅ Completed Tasks

1. **Backend Authentication System**
   - JWT token generation & validation
   - BCrypt password hashing
   - User entity with all required fields
   - AuthController with /auth/login endpoint
   - Database migration completed
   - 20 test users being inserted

2. **Test Users**
   - 1 OWNER: godam_admin / 123456789
   - 4 ADMINS: admin1-4 / admin123
   - 10 PICKERS: picker1-10 / picker123
   - 5 DRIVERS: driver1-5 / driver123

---

## 🎯 Remaining Tasks

### Phase 1: Test Backend Authentication (5 minutes)
**Priority: HIGH**

1. Verify users inserted successfully
2. Test login endpoint with curl
3. Verify JWT token generation
4. Test with different user roles

**Commands:**
```bash
# Test owner login
curl -X POST http://72.61.245.23:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"godam_admin","password":"123456789"}'

# Test admin login
curl -X POST http://72.61.245.23:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123"}'

# Test picker login
curl -X POST http://72.61.245.23:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"picker1","password":"picker123"}'
```

---

### Phase 2: Web Admin Login Page (30 minutes)
**Priority: HIGH**

#### 2.1 Create Login Component
**File:** `web-admin/src/pages/Login.tsx`

Features needed:
- Username & password input fields
- Login button
- Error message display
- Loading state
- Remember me checkbox (optional)
- Professional styling matching current theme

#### 2.2 Create Authentication Context
**File:** `web-admin/src/contexts/AuthContext.tsx`

Features needed:
- Store user info & JWT token
- Login function
- Logout function
- Check if user is authenticated
- Get current user info
- Store token in localStorage

#### 2.3 Update App.tsx
**File:** `web-admin/src/App.tsx`

Changes needed:
- Add AuthProvider wrapper
- Add route protection
- Redirect to login if not authenticated
- Redirect to dashboard after login

#### 2.4 Add Logout Button
**File:** `web-admin/src/components/Topbar.tsx`

Features needed:
- Logout button in topbar
- Show current user info
- Confirm logout dialog (optional)
- Clear token on logout

#### 2.5 Update API Service
**File:** `web-admin/src/services/api.ts`

Changes needed:
- Add Authorization header with JWT token
- Handle 401 responses (redirect to login)
- Refresh token logic (optional)

---

### Phase 3: Flutter Mobile App (20 minutes)
**Priority: HIGH**

#### 3.1 Update API Configuration
**File:** `flutter/lib/services/api_service.dart` or similar

Changes needed:
- Change base URL from `http://10.0.2.2:8080` to `http://72.61.245.23:8081`
- Update all API endpoints
- Test connection

#### 3.2 Test Login Flow
- Open app
- Try logging in with test credentials
- Verify connection to production server
- Test different user roles

---

### Phase 4: Build Android APK (15 minutes)
**Priority: MEDIUM**

#### 4.1 Update Build Configuration
**File:** `flutter/android/app/build.gradle.kts`

Verify:
- App name
- Package name
- Version code & name
- Signing configuration (if needed)

#### 4.2 Build APK
```bash
cd flutter
flutter clean
flutter pub get
flutter build apk --release
```

#### 4.3 Test APK
- Install on Android device
- Test login
- Test all features
- Verify API connectivity

---

### Phase 5: Final Testing (20 minutes)
**Priority: HIGH**

#### 5.1 Backend Testing
- [ ] Test all user roles login
- [ ] Verify JWT token expiry (24 hours)
- [ ] Test invalid credentials
- [ ] Test CORS from web admin
- [ ] Check backend logs for errors

#### 5.2 Web Admin Testing
- [ ] Login with owner account
- [ ] Login with admin account
- [ ] Login with picker account
- [ ] Test logout functionality
- [ ] Verify protected routes
- [ ] Test token persistence (refresh page)
- [ ] Test token expiry handling

#### 5.3 Mobile App Testing
- [ ] Login with different roles
- [ ] Test all features
- [ ] Verify API calls work
- [ ] Test logout
- [ ] Test on different Android versions

---

## 📋 Implementation Checklist

### Backend ✅
- [x] Add Spring Security dependency
- [x] Add JWT dependencies
- [x] Create User entity with auth fields
- [x] Create UserRepository
- [x] Create JwtUtil for token management
- [x] Create AuthService
- [x] Create AuthController
- [x] Create SecurityConfig
- [x] Create DataInitializer
- [x] Migrate database schema
- [x] Insert test users
- [ ] Test login endpoint
- [ ] Verify JWT tokens

### Web Admin 📝
- [ ] Create Login.tsx component
- [ ] Create AuthContext
- [ ] Update App.tsx with routes
- [ ] Add logout button to Topbar
- [ ] Update api.ts with auth headers
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Deploy to production

### Mobile App 📝
- [ ] Update API base URL
- [ ] Test connection
- [ ] Test login flow
- [ ] Build APK
- [ ] Test APK on device

---

## 🔧 Technical Details

### JWT Token Structure
```json
{
  "sub": "username",
  "role": "OWNER",
  "userId": 1,
  "iat": 1704489600,
  "exp": 1704576000
}
```

### API Endpoints
- `POST /auth/login` - Login endpoint
  - Request: `{ "username": "string", "password": "string" }`
  - Response: `{ "accessToken": "string", "user": {...} }`

### Authentication Flow
1. User enters credentials
2. Frontend sends POST to /auth/login
3. Backend validates credentials
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. Frontend includes token in all API requests
7. Backend validates token on each request

### Token Storage
- **Web Admin**: localStorage
- **Mobile App**: Secure storage (flutter_secure_storage)

---

## 🚀 Deployment Steps

### 1. Backend (Already Deployed)
- Backend running at http://72.61.245.23:8081
- Database at /root/godam-data/godam.db
- Docker container: godam-backend

### 2. Web Admin
```bash
cd web-admin
npm run build
./quick-deploy.sh
```

### 3. Mobile App
```bash
cd flutter
flutter build apk --release
# APK will be at: build/app/outputs/flutter-apk/app-release.apk
```

---

## 📞 Testing Credentials

### Owner
- Username: `godam_admin`
- Password: `123456789`
- Role: OWNER

### Admin
- Username: `admin1` (or admin2, admin3, admin4)
- Password: `admin123`
- Role: ADMIN

### Picker
- Username: `picker1` (or picker2-10)
- Password: `picker123`
- Role: PICKER

### Driver
- Username: `driver1` (or driver2-5)
- Password: `driver123`
- Role: DRIVER

---

## 🐛 Troubleshooting

### Backend Issues
- Check logs: `docker logs godam-backend`
- Verify users: `sqlite3 /root/godam-data/godam.db "SELECT * FROM Users;"`
- Test endpoint: `curl http://72.61.245.23:8081/auth/login`

### Web Admin Issues
- Check browser console for errors
- Verify API URL in .env file
- Check network tab for failed requests
- Clear localStorage and try again

### Mobile App Issues
- Verify API URL in code
- Check device internet connection
- Test API from device browser first
- Check app logs

---

## 📝 Next Steps After Completion

1. **Security Enhancements**
   - Add refresh token mechanism
   - Implement rate limiting
   - Add password reset functionality
   - Add 2FA (optional)

2. **User Management**
   - Add user CRUD operations
   - Add role management
   - Add user activity logs
   - Add password change functionality

3. **Monitoring**
   - Add logging for authentication events
   - Monitor failed login attempts
   - Track active sessions
   - Set up alerts for suspicious activity

---

**Last Updated**: January 5, 2026
**Current Phase**: Testing Backend Authentication
**Next Phase**: Web Admin Login Page
