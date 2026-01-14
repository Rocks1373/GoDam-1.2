# GoDam 1.2 - Inventory Management Platform

**A comprehensive inventory and warehouse management system with web, mobile, and API interfaces.**

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)]()
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android%20%7C%20iOS-lightgrey.svg)]()

---

## 🚀 **Quick Start**

```bash
# Start all services (Database + Backend + Web Admin)
./start-dev.sh

# Access the application
# Web Admin: http://localhost:3000
# Backend API: http://localhost:8081
# API Docs: http://localhost:8081/swagger-ui.html
```

**See [QUICK_START.md](QUICK_START.md) for detailed instructions.**

---

## ✨ **Key Features**

- ✅ **Delivery Note Fix Applied** - DN creation now properly sets `dnCreated` flag
- 📦 Real-time inventory tracking across multiple warehouses
- 📋 Complete order workflow management (picking → checking → delivery)
- 🚚 Delivery note generation with print/download
- 📱 Cross-platform mobile app (Android + iOS)
- 📊 Comprehensive stock movement tracking
- 👥 Role-based access control

---

## 📚 **Documentation**

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | ⚡ Get started in 5 minutes |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 📖 Complete deployment instructions |
| **[docs/DATABASE_SCHEMA_REPORT.csv](docs/DATABASE_SCHEMA_REPORT.csv)** | 📊 Complete database schema (250+ fields) |
| **[docs/DATABASE_ENTITY_MAPPING_REPORT.csv](docs/DATABASE_ENTITY_MAPPING_REPORT.csv)** | 🗺️ Java entity-to-table mappings |
| **[docs/FIELD_MAPPING_REPORT.csv](docs/FIELD_MAPPING_REPORT.csv)** | 🔗 Frontend-Backend-Database field mappings |
| **[docs/DATABASE_MAPPING_README.md](docs/DATABASE_MAPPING_README.md)** | 📋 Complete mapping guide with examples |

---

## 💻 **Development Commands**

```bash
# Start everything
./start-dev.sh

# Stop everything
./stop-dev.sh

# Start mobile app
./start-mobile.sh android    # Android emulator
./start-mobile.sh ios        # iOS simulator (macOS)
./start-mobile.sh both       # Both platforms
```

---

## 🐳 **Docker Deployment**

```bash
# Production deployment
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🏗️ **Architecture**

```
Web Admin (React/Vite) ──HTTP/REST──> Backend API (Spring Boot) ──JDBC──> PostgreSQL
                                            ▲
                                            │
                                     Mobile App (Flutter)
                                     (Android/iOS only)
```

### **Tech Stack**

- **Web Frontend:** React + Vite + TypeScript (`web-admin/`)
- **Mobile Frontend:** Flutter (Android/iOS only) (`flutter/flutter_android/`)
- **Backend:** Spring Boot + Java 17 (`backend-java/`)
- **Database:** PostgreSQL 15
- **Container:** Docker + Docker Compose

### **Architecture Notes**

- ✅ **One Backend**: Single Java Spring Boot backend serves both web and mobile
- ✅ **Web App**: React/Vite (not Flutter Web)
- ✅ **Mobile App**: Flutter for Android and iOS only
- ❌ **No Flutter Web**: Removed - we use React/Vite for web interface

**See [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) for detailed architecture documentation.**

---

## 📦 **Project Structure**

```
GoDam_1.2/
├── backend-java/          # Spring Boot API
├── web-admin/             # React web interface
├── flutter/               # Mobile app
├── database/              # DB scripts
├── docs/                  # Documentation & reports
├── logs/                  # Runtime logs
├── docker-compose.yml     # Container orchestration
├── start-dev.sh          # Dev startup script
├── stop-dev.sh           # Stop script
├── start-mobile.sh       # Mobile startup script
└── README.md             # This file
```

---

## ✅ **Recent Fixes (2026-01-10)**

### **Delivery Note Creation Issue - RESOLVED**

| Component | Fix | Status |
|-----------|-----|--------|
| Backend DTO | Added `orderId` field to `DeliveryNoteRequest` | ✅ |
| Backend Service | Injected `OrderWorkflowRepository` | ✅ |
| Backend Logic | Set `dnCreated=true` when DN saved | ✅ |
| Frontend | Added `orderId` to POST payload | ✅ |
| Frontend | Refresh orders list after save | ✅ |

**Result:** Orders now properly marked as "DN created" and removed from pending list.

---

## 🧪 **Testing**

```bash
# Test backend health
curl http://localhost:8080/actuator/health

# Test DN creation
curl http://localhost:8080/api/orders | grep dnCreated

# Run backend tests
cd backend-java && mvn test

# Run frontend tests
cd web-admin && npm test

# Run mobile tests
cd flutter && flutter test
```

---

## 🔧 **Configuration**

### **Backend** (`backend-java/src/main/resources/application.yml`)
```yaml
spring.datasource.url: jdbc:postgresql://localhost:5432/godam
server.port: 8081
```

### **Frontend** (`web-admin/.env.local`)
```properties
VITE_API_BASE_URL=http://localhost:8081
```

### **Mobile** (`flutter/flutter_android/lib/app_mobile.dart`)
```dart
// Android Emulator: http://10.0.2.2:8080
// iOS Simulator: http://127.0.0.1:8080
// Override: flutter run --dart-define=GODAM_API=http://YOUR_URL
```

---

## 📞 **Support**

- **Documentation:** See `docs/` folder
- **Logs:** Check `logs/` directory
- **Deployment:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Quick Start:** See [QUICK_START.md](QUICK_START.md)

---

## 🗄️ **Database tables**

- The schema previously had quoted, mixed-case tables (e.g., `"OrderItems"` vs `order_items`). To avoid confusion we now target only the lowercase names that the backend entities and SQL scripts expect.  
- Follow [`docs/TABLE_NORMALIZATION.md`](docs/TABLE_NORMALIZATION.md) whenever you add a new table or need to clean up duplicates so the standard stays consistent.

### 🧭 Inventory model

GoDAM follows a two-table approach:

1. **`stock`** – live snapshot table.
   - One row per `(part_number, warehouse_no)`.
   - `qty` represents the total available stock; `combine_rack` temporarily lists the racks where that stock has been blogged but is not authoritative.
   - Rack assignments are not stored here; only the aggregate availability is tracked.

2. **`stock_movements`** – immutable rack-level ledger.
   - Columns: `part_number`, `warehouse_no`, `rack`, `qty_change`, `movement_type`, `reference`, `created_by`, `created_at`.
   - Every rack event (load, GR, pick, rack split, etc.) writes a row here. Totals in `stock` are derived from summing the `qty_change` values per rack/part.
   - This table is the single source of truth for historical rack data; `stock` reflects only the recalculated current total.

**Movement types and semantics**

- `INT`: initial load (first time inventory is seeded).
- `IN`: inbound receipts (goods received).
- `OUT`: delivery/issues (inventory leaving a rack).
- `RACK`: rack split or reassignment; multiplies the same total across racks without changing overall quantity.

When a user picks 25 units from rack A, update the `stock` row (qty–=25) and insert a `stock_movements` row with `movement_type='OUT'` and `qty_change=-25`. The rack-level table lets you audit every movement while your snapshot table stays lightweight and easy to query.

### 📥 Stock upload validator

- The `stock` table is the live, authoritative snapshot—`stock_movements` is history only and **must never be used to calculate current stock**.
- Any Excel or CSV upload targeting the `stock` table must be validated before applying changes. Use `godam-validator/main.py` (see `godam-validator/README.md`) to enforce required columns, data types, and FK checks against the current schema, generate `GoDAM_ErrorRows.xlsx` for repro issues, and insert only clean rows.
- The validator assumes the uploaded data already represents the final snapshot of `(part_number, warehouse_no)` totals; it does not recompute `combine_rack` or rack distributions, nor should it touch `stock_movements`.
- **Required columns for stock uploads**: `part_number`, `sap_pn`, `description`, `qty`, `vendor_name`, `warehouse_no`. Any upload row missing one of these values is considered invalid and will be sent to the error workbook; the validator enforces this before any database insert.
- **`qty` rules**: the `qty` column must be numeric, cannot be negative, and zero is allowed; rows that violate this rule are flagged and routed to `GoDAM_ErrorRows.xlsx`.
- **Uniqueness constraint**: stock rows are unique on `(part_number, warehouse_no)`. The validator checks existing `qty` values with `SELECT qty FROM stock WHERE part_number = :part_number AND warehouse_no = :warehouse_no` before inserting and performs an upsert so uploads replace any existing snapshot for that key.

### 📤 Stock upload API & flow

1. **POST `/api/stock/upload/validate`** (multipart `file`): parses the Excel/CSV, enforces required columns, collects invalid rows, and builds the duplicate list. Response:
   ```json
   {
     "validRows": 12,
     "invalidRows": 1,
     "duplicates": [
       {
         "part_number": "ABC123",
         "warehouse_no": "WH1",
         "existing_qty": 120,
         "uploaded_qty": 40
       }
     ],
     "errorFileUrl": "/api/stock/upload/errors/<token>"
   }
   ```
   The UI must show the duplicate popup with buttons: **Add to existing quantity**, **Reject duplicates and download error Excel**, and **Cancel upload**.

2. **GET `/api/stock/upload/errors/{token}`**: downloads `GoDAM_ErrorRows.xlsx` containing the original columns plus the `ERROR` column. Invalid rows from validation and any duplicates rejected later are stored here with messages like `"Missing part_number"`, `"Qty must be numeric"`, or `"Already exists (qty = 120, uploaded = 40)"`.

3. **POST `/api/stock/upload/commit`**:
   - Request body: `{ "token": "<token>", "action": "ADD" | "REJECT" | "CANCEL" }`.
   - Action `ADD`: adds the uploaded quantities to existing stock rows (`UPDATE stock SET qty = qty + :uploaded_qty ...`) and inserts the remaining validated rows.
   - Action `REJECT`: keeps the original stock untouched but appends the duplicate rows to the error workbook so the user can download and fix them.
   - Action `CANCEL`: aborts the upload; no rows are inserted.

All valid rows (no validation errors and not marked as duplicates) are inserted/updated normally; duplicates are handled only via the user choice.

### 🧱 Backend structure for uploads

- `StockUploadValidatorService` — core validation logic, duplicate detection, and staging context storage.
- `StockUploadController` — exposes `/validate`, `/errors/{token}`, and `/commit` endpoints.
- `StockExcelParser` — reads Excel/CSV files into structured rows.
- `StockErrorExcelWriter` — generates `GoDAM_ErrorRows.xlsx` with the `ERROR` column.

Stock must never be inserted or updated outside of this validation flow; even existing endpoints that called `StockService.uploadStock` should now rely on the validator to ensure consistency.

---

**Built with ❤️ by the GoDam Team**

**Version:** 1.2.0 | **Last Updated:** 2026-01-10 | **Status:** ✅ Production Ready
