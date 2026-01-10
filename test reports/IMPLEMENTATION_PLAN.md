# GoDam Complete Authentication Implementation Plan

## Overview
Implement full authentication system for web admin, backend API, and mobile app with role-based access control.

## Phase 1: Backend Authentication System ⭐ START HERE

### 1.1 Add Dependencies to pom.xml
```xml
- Spring Security
- JWT (io.jsonwebtoken:jjwt-api, jjwt-impl, jjwt-jackson)
- BCrypt (included in Spring Security)
```

### 1.2 Update User Entity
File: `backend-java/src/main/java/com/godam/common/User.java`
```java
Add fields:
- password (String, hashed)
- role (String: OWNER, ADMIN, PICKER, DRIVER)
- email (String)
- active (Boolean)
- createdAt (LocalDateTime)
- updatedAt (LocalDateTime)
```

### 1.3 Create Authentication Components
Files to create:
- `backend-java/src/main/java/com/godam/auth/AuthController.java`
- `backend-java/src/main/java/com/godam/auth/AuthService.java`
- `backend-java/src/main/java/com/godam/auth/JwtUtil.java`
- `backend-java/src/main/java/com/godam/auth/dto/LoginRequest.java`
- `backend-java/src/main/java/com/godam/auth/dto/LoginResponse.java`
- `backend-java/src/main/java/com/godam/config/SecurityConfig.java`

### 1.4 Create Database Seed Script
File: `backend-java/src/main/resources/data.sql`
```sql
INSERT INTO Users (username, password, role, email, active) VALUES
('godam_admin', '$2a$10$...', 'OWNER', 'admin@godam.com', true),
('admin1', '$2a$10$...', 'ADMIN', 'admin1@godam.com', true),
... (4 admins, 10 pickers, 5 drivers)
```

## Phase 2: Web Admin Authentication

### 2.1 Create Authentication Context
File: `web-admin/src/contexts/AuthContext.tsx`
- Login/logout functions
- User state management
- Token storage

### 2.2 Create Login Page
File: `web-admin/src/pages/Login.tsx`
- Username/password form
- Error handling
- Redirect after login

### 2.3 Update App.tsx
- Add AuthProvider
- Add protected routes
- Add login route

### 2.4 Update Topbar
- Add logout button
- Show current user
- Handle logout

### 2.5 Update API Service
File: `web-admin/src/services/api.ts`
- Add login method
- Add token interceptor
- Handle 401 errors

## Phase 3: Flutter Mobile App Configuration

### 3.1 Update API Base URL
File: `flutter/lib/app_mobile.dart`
```dart
Change: const String _lanIpBaseUrl = 'http://72.61.245.23:8081';
```

### 3.2 Test Login Flow
- Verify login works
- Test token storage
- Test API calls with auth

## Phase 4: Android APK Build

### 4.1 Configure Signing
File: `flutter/android/app/build.gradle`
- Add signing config
- Set version

### 4.2 Build APK
```bash
cd flutter
flutter build apk --release
```

### 4.3 Test APK
- Install on device
- Test login
- Test all features

## Phase 5: Deployment

### 5.1 Backend Deployment
```bash
cd backend-java
mvn clean package
scp target/godam-backend.jar root@72.61.245.23:/root/app.jar
ssh root@72.61.245.23 'docker restart godam-backend'
```

### 5.2 Web Admin Deployment
```bash
cd web-admin
npm run build
scp -r dist/* root@72.61.245.23:/root/godam-web/
ssh root@72.61.245.23 'docker restart godam-web'
```

### 5.3 Testing
- Test web admin login
- Test mobile app login
- Test all user roles
- Verify permissions

## Test Users to Create

### Owner (1)
- Username: `godam_admin`
- Password: `123456789`
- Role: OWNER
- Email: admin@godam.com

### Admins (4)
- admin1 / admin123 / ADMIN / admin1@godam.com
- admin2 / admin123 / ADMIN / admin2@godam.com
- admin3 / admin123 / ADMIN / admin3@godam.com
- admin4 / admin123 / ADMIN / admin4@godam.com

### Pickers (10)
- picker1 / picker123 / PICKER / picker1@godam.com
- picker2 / picker123 / PICKER / picker2@godam.com
- ... (picker3-10)

### Drivers (5)
- driver1 / driver123 / DRIVER / driver1@godam.com
- driver2 / driver123 / DRIVER / driver2@godam.com
- ... (driver3-5)

## Implementation Order

1. ✅ Analysis complete
2. 🔄 Add Spring Security dependencies
3. 🔄 Update User entity
4. 🔄 Create AuthController and JWT system
5. 🔄 Create database seed script
6. 🔄 Test backend authentication
7. 🔄 Create web admin login page
8. 🔄 Add authentication context
9. 🔄 Update routes and topbar
10. 🔄 Test web admin login
11. 🔄 Update Flutter API URL
12. 🔄 Build Android APK
13. 🔄 Deploy everything
14. 🔄 Final testing

## Current Status
- Backend: No authentication
- Web Admin: No authentication (goes directly to dashboard)
- Mobile App: Has auth UI, needs backend endpoint
- Database: Basic Users table, needs updates

## Next Action
START with Phase 1.1: Add Spring Security dependencies to pom.xml
