# GoDam Project Architecture

## 🏗️ Clear Architecture Overview

### **One Backend, Two Frontends**

This project uses a **single Java Spring Boot backend** that serves both:
1. **Web Application** (React/Vite frontend)
2. **Mobile Application** (Flutter - Android/iOS only)

---

## 📦 Components

### 1. Backend (Java Spring Boot)
**Location**: `backend-java/`

- **Technology**: Java Spring Boot
- **Port**: 8080 (local), 8081 (VPS/Docker)
- **Database**: PostgreSQL
- **Purpose**: Single backend API for both web and mobile apps

**Start Backend**:
```bash
cd backend-java
./start-backend.sh
```

---

### 2. Web Application (React/Vite)
**Location**: `web-admin/`

- **Frontend**: React with Vite
- **Technology**: TypeScript, React
- **Purpose**: Web-based admin interface
- **Connects to**: Java backend

**Start Web App**:
```bash
cd web-admin
npm install
npm run dev
```

**Configuration**:
- Set `VITE_API_BASE_URL` in `.env` file
- Local: `http://localhost:8080`
- VPS: `http://72.61.245.23:8081`

---

### 3. Mobile Application (Flutter)
**Location**: `flutter/flutter_android/`

- **Platform**: Android and iOS only
- **Technology**: Flutter/Dart
- **Purpose**: Mobile app for warehouse operations
- **Connects to**: Java backend

**Start Mobile App**:
```bash
cd flutter/flutter_android
flutter run
```

**Configuration**:
- Android Emulator: `http://10.0.2.2:8080`
- iOS Simulator: `http://127.0.0.1:8080`
- Physical Device: `http://YOUR_IP:8080`
- Override: `flutter run --dart-define=GODAM_API=http://YOUR_URL`

---

## 🔄 Data Flow

```
┌─────────────────┐
│  Web App (Vite) │──────┐
└─────────────────┘      │
                         │
┌─────────────────┐      │      ┌──────────────────┐
│ Mobile (Flutter)│──────┼─────▶│ Java Backend     │
│ Android/iOS     │      │      │ (Spring Boot)    │
└─────────────────┘      │      │ Port: 8080/8081  │
                         │      └──────────────────┘
                         │              │
                         │              ▼
                         │      ┌──────────────────┐
                         └─────▶│   PostgreSQL     │
                                │   Database       │
                                └──────────────────┘
```

---

## ✅ What We Have

- ✅ **One Backend**: Java Spring Boot (single source of truth)
- ✅ **Web Frontend**: React/Vite (`web-admin/`)
- ✅ **Mobile Frontend**: Flutter Android/iOS (`flutter/flutter_android/`)

## ❌ What We DON'T Have

- ❌ **Flutter Web**: Removed - not needed (we use React/Vite for web)
- ❌ **Multiple Backends**: Only one Java backend
- ❌ **Confusion**: Clear separation of concerns

---

## 🎯 Key Points

1. **Backend is Java only** - No Node.js backend, no Flutter backend
2. **Web is React/Vite** - Not Flutter Web
3. **Mobile is Flutter** - Android and iOS only
4. **One Backend for All** - Both web and mobile use the same Java backend

---

## 📁 Directory Structure

```
GoDam_1.2/
├── backend-java/          # Java Spring Boot Backend (ONE BACKEND)
│   ├── src/
│   └── start-backend.sh
│
├── web-admin/             # React/Vite Web Application
│   ├── src/
│   └── .env
│
└── flutter/
    └── flutter_android/   # Flutter Mobile App (Android/iOS only)
        ├── lib/
        └── android/
```

---

## 🔧 Configuration Summary

| Component | Backend URL | Config Method |
|-----------|-------------|---------------|
| **Web App (Vite)** | `localhost:8080` or `72.61.245.23:8081` | `.env` file |
| **Mobile (Flutter)** | `10.0.2.2:8080` (emulator) or override | Environment variable |

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend-java
./start-backend.sh
```

### 2. Start Web App
```bash
cd web-admin
echo "VITE_API_BASE_URL=http://localhost:8080" > .env
npm run dev
```

### 3. Start Mobile App
```bash
cd flutter/flutter_android
flutter run
```

---

## 📝 Notes

- **No Flutter Web**: We removed Flutter Web completely - use React/Vite for web
- **Single Backend**: One Java backend serves both web and mobile
- **Clear Separation**: Web = React, Mobile = Flutter, Backend = Java
