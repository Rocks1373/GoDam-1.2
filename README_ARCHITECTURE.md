# GoDam Project - Architecture Overview

## 🎯 Clear Architecture

### **One Backend, Two Frontends**

```
┌─────────────────────────────────────────────────────────┐
│                    Java Backend                        │
│              (Spring Boot - Port 8080)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Single REST API                         │  │
│  │    (Serves both web and mobile)                 │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                    ▲                    ▲
                    │                    │
        ┌───────────┘                    └───────────┐
        │                                            │
┌───────┴────────┐                        ┌─────────┴────────┐
│  Web App       │                        │  Mobile App      │
│  (React/Vite)  │                        │  (Flutter)        │
│                │                        │                  │
│  Location:     │                        │  Location:       │
│  web-admin/    │                        │  flutter/        │
│                │                        │  flutter_android/│
│  Platform:     │                        │  Platform:       │
│  Web Browser   │                        │  Android/iOS    │
└────────────────┘                        └──────────────────┘
```

---

## 📦 Components

### 1. Backend (Java Spring Boot)
- **Location**: `backend-java/`
- **Technology**: Java Spring Boot
- **Port**: 8080 (local), 8081 (VPS)
- **Database**: PostgreSQL
- **Purpose**: Single backend API for both web and mobile

### 2. Web Application (React/Vite)
- **Location**: `web-admin/`
- **Technology**: React + Vite + TypeScript
- **Purpose**: Web-based admin interface
- **Backend**: Connects to Java backend

### 3. Mobile Application (Flutter)
- **Location**: `flutter/flutter_android/`
- **Technology**: Flutter/Dart
- **Platform**: Android and iOS **ONLY**
- **Purpose**: Mobile app for warehouse operations
- **Backend**: Connects to Java backend

---

## ✅ What We Have

- ✅ **One Backend**: Java Spring Boot
- ✅ **Web Frontend**: React/Vite (`web-admin/`)
- ✅ **Mobile Frontend**: Flutter Android/iOS (`flutter/flutter_android/`)

## ❌ What We DON'T Have

- ❌ **Flutter Web**: Removed completely
- ❌ **Multiple Backends**: Only one Java backend
- ❌ **Node.js Backend**: Only Java backend

---

## 🚀 Quick Start

### Start Backend
```bash
cd backend-java
./start-backend.sh
```

### Start Web App
```bash
cd web-admin
echo "VITE_API_BASE_URL=http://localhost:8080" > .env
npm run dev
```

### Start Mobile App
```bash
cd flutter/flutter_android
flutter run
```

---

## 📝 Key Points

1. **Backend**: Java Spring Boot only
2. **Web**: React/Vite (not Flutter Web)
3. **Mobile**: Flutter (Android/iOS only)
4. **One Backend**: Both web and mobile use the same Java backend

---

## 🔧 Configuration

| Component | Backend URL | Config Method |
|-----------|-------------|---------------|
| **Web App** | `localhost:8080` | `.env` file (`VITE_API_BASE_URL`) |
| **Mobile App** | `10.0.2.2:8080` (emulator) | Environment variable (`GODAM_API`) |

---

## 📁 Project Structure

```
GoDam_1.2/
├── backend-java/          # Java Spring Boot Backend
│   └── src/
│
├── web-admin/             # React/Vite Web Application
│   └── src/
│
└── flutter/
    └── flutter_android/   # Flutter Mobile App (Android/iOS)
        └── lib/
```

---

## 🎯 Summary

- **Web Application** = React/Vite frontend + Java backend
- **Mobile Application** = Flutter (Android/iOS) frontend + Java backend
- **Backend** = Single Java Spring Boot backend for both

**No Flutter Web. No confusion. Clear architecture.**
