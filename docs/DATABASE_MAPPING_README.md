# GoDam 1.2 - Database Schema & Mapping Documentation

**Generated:** 2026-01-10
**Purpose:** Complete database schema documentation with field-level mappings across frontend, backend, and database layers.

---

## 📊 **Reports Generated**

| Report File | Description | Columns | Use Case |
|-------------|-------------|---------|----------|
| **DATABASE_SCHEMA_REPORT.csv** | Complete database schema with all tables and columns | 11 columns | Database design, schema migration, SQL queries |
| **DATABASE_ENTITY_MAPPING_REPORT.csv** | Maps Java entities to database tables | 7 columns | Backend development, ORM configuration |
| **FIELD_MAPPING_REPORT.csv** | Field-level mapping across all layers | 8 columns | API integration, debugging data flow |

---

## 📋 **Report 1: DATABASE_SCHEMA_REPORT.csv**

### **Purpose**
Complete inventory of all database tables and columns with type mappings between PostgreSQL and SQL Server.

### **Columns**
1. **Schema** - Database schema name (always "godam")
2. **Table Name** - Database table identifier
3. **Column Name** - Column identifier
4. **Data Type (PostgreSQL)** - PostgreSQL data type
5. **Data Type (SQL Server)** - SQL Server equivalent type
6. **Is Primary Key** - YES/NO flag
7. **Is Foreign Key** - YES/NO flag
8. **FK References** - Foreign key target (Table(column))
9. **Nullable** - YES/NO - whether column accepts NULL
10. **Default Value** - Default value or expression
11. **Description** - Business purpose of the column

### **Key Tables**

| Table | Purpose | Row Count Estimate |
|-------|---------|-------------------|
| **OrderWorkflows** | Order lifecycle management | High - primary business entity |
| **OrderItems** | Order line items | Very High - multiple per order |
| **Stock** | Inventory tracking | Very High - all parts |
| **StockMovements** | Stock transaction log | Very High - all movements |
| **Users** | User authentication | Medium - staff accounts |
| **Customers** | Customer master data | Medium - client records |
| **Drivers** | Driver profiles | Medium - transport staff |
| **Transporters** | Transporter companies | Low - vendor list |

### **Critical Field: dn_created**

```sql
-- Location: OrderWorkflows table, line 171 in schema
dn_created BOOLEAN NOT NULL DEFAULT FALSE
```

**Purpose:** Tracks whether a Delivery Note has been created for an order.
**Status:** ✅ **FIXED** - Now properly set when DN is saved via `/api/delivery-note` endpoint.

---

## 📋 **Report 2: DATABASE_ENTITY_MAPPING_REPORT.csv**

### **Purpose**
Maps Java backend entities and DTOs to their corresponding database tables.

### **Columns**
1. **Backend Entity/DTO** - Java class name
2. **Database Table** - Target table name
3. **Database Schema** - Schema name
4. **Mapping Type** - Entity type (JPA Entity, DTO, Lookup Table)
5. **Used In Module** - Functional module
6. **Key Relationships** - Foreign key relationships
7. **Notes** - Special considerations

### **Mapping Types**

| Type | Description | Example |
|------|-------------|---------|
| **JPA Entity** | Direct ORM mapping with `@Entity` annotation | `OrderWorkflow.java` → `OrderWorkflows` |
| **DTO (Read)** | Data Transfer Object for API responses | `OrderSummaryDto.java` → `OrderWorkflows` |
| **DTO (Write)** | Input DTO for API requests | `DeliveryNoteRequest.java` → `delivery_notes` |
| **Data Table** | Non-entity data storage | `matching_dn_files` |
| **Lookup Table** | Reference data | `matching_masters_accessories` |

### **Key Entities**

```java
// Core business entities
OrderWorkflow.java    → OrderWorkflows    (orders)
OrderItem.java        → OrderItems        (line items)
Stock.java            → Stock             (inventory)
StockMovement.java    → StockMovements    (transactions)

// Master data
Customer.java         → Customers         (clients)
Driver.java           → Drivers           (transport staff)
Transporter.java      → Transporters      (vendors)

// Delivery Notes
DeliveryNote.java     → delivery_notes    (DN records)
DeliveryNoteQty.java  → delivery_note_quantities (DN items)
```

---

## 📋 **Report 3: FIELD_MAPPING_REPORT.csv**

### **Purpose**
Detailed field-level mapping showing how data flows from frontend → backend → database.

### **Columns**
1. **Frontend Field (TypeScript)** - React/TypeScript field name
2. **Backend DTO Field (Java)** - DTO property name
3. **Backend Entity Field (Java)** - Entity property name
4. **Database Column (SQL)** - Database column name
5. **Database Table** - Target table
6. **Data Flow Direction** - Unidirectional or bidirectional
7. **Module** - Functional module
8. **Notes** - Special handling or transformations

### **Data Flow Patterns**

#### **Pattern 1: Frontend → Backend → Database**
```
Frontend:  orderId (number)
   ↓
Backend:   orderId (Long) in DeliveryNoteRequest
   ↓
Entity:    id (Long) in OrderWorkflow
   ↓
Database:  id (BIGSERIAL) in OrderWorkflows
```

#### **Pattern 2: Database → Backend → Frontend**
```
Database:  dn_created (BOOLEAN) in OrderWorkflows
   ↓
Entity:    dnCreated (boolean) in OrderWorkflow
   ↓
DTO:       dnCreated (boolean) in OrderSummaryDto
   ↓
Frontend:  dnCreated (boolean) in TypeScript
```

#### **Pattern 3: Computed Fields**
```
Database:  COUNT(*) over OrderItems WHERE order_id = ?
   ↓
Service:   items.size() in OrdersService
   ↓
DTO:       itemCount (int) in OrderSummaryDto
   ↓
Frontend:  itemCount (number) displayed in UI
```

### **Example: Delivery Note Creation Flow**

```typescript
// 1. Frontend sends
{
  orderId: 123,              // ← ADDED in fix
  dnNumber: "DN-2024-001",
  customerId: 5,
  transporterId: 3,
  driverId: 7,
  quantities: [...]
}

// 2. Backend DTO receives
DeliveryNoteRequest {
  Long orderId;              // ← ADDED in fix
  String dnNumber;
  Long customerId;
  Long transporterId;
  Long driverId;
  List<DeliveryNoteQtyRequest> quantities;
}

// 3. Service processes
DeliveryNoteService.createDeliveryNote() {
  // Save DN entity
  DeliveryNote savedNote = repository.save(note);

  // ← ADDED in fix
  if (request.getOrderId() != null) {
    OrderWorkflow order = orderRepo.findById(request.getOrderId());
    order.setDnCreated(true);  // ← KEY FIX
    orderRepo.save(order);
  }
}

// 4. Database updates
UPDATE "OrderWorkflows"
SET dn_created = true       // ← Result
WHERE id = 123;
```

---

## 🔧 **Recent Changes (2026-01-10)**

### **Issue Fixed: DN Not Setting Up**

| Component | File | Change | Status |
|-----------|------|--------|--------|
| **Backend DTO** | `DeliveryNoteRequest.java:31` | Added `orderId` field | ✅ Complete |
| **Backend Service** | `DeliveryNoteService.java:31` | Injected `OrderWorkflowRepository` | ✅ Complete |
| **Backend Service** | `DeliveryNoteService.java:54-60` | Set `dnCreated=true` on save | ✅ Complete |
| **Frontend** | `DeliveryNotes.tsx:507` | Added `orderId` to POST payload | ✅ Complete |
| **Frontend** | `DeliveryNotes.tsx:527` | Refresh orders list after save | ✅ Complete |

### **What Was Broken**
```java
// BEFORE (broken)
public DeliveryNoteResponse createDeliveryNote(DeliveryNoteRequest request) {
  DeliveryNote note = new DeliveryNote();
  applyRequestToNote(note, request);
  DeliveryNoteResponse response = toResponse(deliveryNoteRepository.save(note));
  documentService.generatePdf(response);
  return response;
  // ❌ dnCreated flag never set!
}
```

### **What Was Fixed**
```java
// AFTER (fixed)
public DeliveryNoteResponse createDeliveryNote(DeliveryNoteRequest request) {
  DeliveryNote note = new DeliveryNote();
  applyRequestToNote(note, request);
  DeliveryNote savedNote = deliveryNoteRepository.save(note);

  // ✅ Set dnCreated flag
  if (request.getOrderId() != null) {
    OrderWorkflow order = orderWorkflowRepository.findById(request.getOrderId())
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    order.setDnCreated(true);  // ← KEY FIX
    orderWorkflowRepository.save(order);
  }

  DeliveryNoteResponse response = toResponse(savedNote);
  documentService.generatePdf(response);
  return response;
}
```

---

## 📚 **How to Use These Reports**

### **For Database Administrators**
- Use **DATABASE_SCHEMA_REPORT.csv** to understand table structure
- Reference FK relationships for JOIN queries
- Check nullable columns for migration planning

### **For Backend Developers**
- Use **DATABASE_ENTITY_MAPPING_REPORT.csv** to find entity-table mappings
- Reference relationship columns for ORM configuration
- Check mapping types for proper entity design

### **For Frontend Developers**
- Use **FIELD_MAPPING_REPORT.csv** to understand API field names
- Check data flow direction for read-only vs. writable fields
- Reference notes for special transformations

### **For API Integration**
- Cross-reference all three reports for complete data flow
- Use field mapping to construct request payloads
- Validate response structures against entity mappings

---

## 🔍 **Query Examples Using These Reports**

### **Example 1: Find All Orders with DN Created**
```sql
-- Reference: DATABASE_SCHEMA_REPORT.csv, line 171
SELECT
  id,
  outbound_number,
  customer_name,
  dn_created,
  created_at
FROM "OrderWorkflows"
WHERE dn_created = true
ORDER BY created_at DESC;
```

### **Example 2: Get Order Details with Items**
```sql
-- Reference: FIELD_MAPPING_REPORT.csv
SELECT
  ow.id,
  ow.outbound_number,
  ow.customer_name,
  ow.dn_created,
  oi.part_number,
  oi.description,
  oi.qty,
  oi.picked_by,
  oi.is_picked
FROM "OrderWorkflows" ow
JOIN "OrderItems" oi ON oi.order_id = ow.id
WHERE ow.outbound_number = 'OB-2024-001';
```

### **Example 3: Find Delivery Notes with Customer Info**
```sql
-- Reference: DATABASE_ENTITY_MAPPING_REPORT.csv
SELECT
  dn.id,
  dn.dn_number,
  dn.outbound_number,
  c.name as customer_name,
  c.city,
  d.driver_name,
  t.company_name as transporter
FROM delivery_notes dn
LEFT JOIN "Customers" c ON c.id = dn.customer_id
LEFT JOIN "Drivers" d ON d.id = dn.driver_id
LEFT JOIN "Transporters" t ON t.id = dn.transporter_id
WHERE dn.created_at >= '2024-01-01';
```

---

## 📦 **Import Instructions**

### **Excel**
1. Open Excel
2. File → Import → CSV
3. Select any of the 3 CSV files
4. Choose "Comma" delimiter
5. Click "Import"

### **Google Sheets**
1. Open Google Sheets
2. File → Import → Upload
3. Select CSV file
4. Choose "Comma" separator
5. Click "Import data"

### **Database Tools (DBeaver, DataGrip)**
1. Copy SQL queries from this README
2. Paste into SQL editor
3. Execute to verify schema matches reports

---

## 🎯 **Summary**

These reports provide complete visibility into the GoDam 1.2 data architecture:

1. **DATABASE_SCHEMA_REPORT.csv** = "What's in the database?"
2. **DATABASE_ENTITY_MAPPING_REPORT.csv** = "How does code map to tables?"
3. **FIELD_MAPPING_REPORT.csv** = "How does data flow end-to-end?"

All three reports are synchronized and reflect the current state of the application **after the DN fix** was applied.

---

**Generated by:** Claude Code (Anthropic)
**Project:** GoDam 1.2 Inventory Management Platform
**Last Updated:** 2026-01-10
