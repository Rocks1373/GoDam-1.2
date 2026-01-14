# Delivery Note Auto-Mapping Implementation

## Overview
This implementation makes Delivery Notes (DN) fully self-contained legal documents by automatically snapshotting master data (Customer, Transporter, Driver) at creation time. DNs are now independent of future changes to master records.

## Problem Solved
**Before:** DN relied on master entity references (customer_id, driver_id, transporter_id) which caused:
- Data loss when masters were edited
- Print mismatches if customer/driver changed
- Audit risk and legal compliance issues

**After:** DN stores complete snapshot of all relevant data at creation time, ensuring:
- Legal document integrity
- Print consistency
- Full independence from master data changes
- Audit trail preservation

## Implementation Details

### 1. Database Schema Changes

**New columns added to `delivery_note` table:**
```sql
customer_name VARCHAR(255)      -- Snapshot of customer name
customer_phone VARCHAR(64)      -- Snapshot of customer phone
transporter_name VARCHAR(255)   -- Snapshot of transporter name
transporter_phone VARCHAR(64)   -- Snapshot of transporter phone
driver_name VARCHAR(255)        -- Snapshot of driver name
driver_phone VARCHAR(64)        -- Snapshot of driver phone
```

**Files Modified:**
- [backend-java/src/main/resources/db/delivery_note_schema.sql](../backend-java/src/main/resources/db/delivery_note_schema.sql)
- [backend-java/src/main/resources/db/migration_add_dn_snapshot_fields.sql](../backend-java/src/main/resources/db/migration_add_dn_snapshot_fields.sql) (new migration script)

### 2. Backend Entity Changes

**DeliveryNote.java** - Added snapshot fields:
```java
// Customer snapshot fields
@Column(name = "customer_name")
private String customerName;

@Column(name = "customer_phone")
private String customerPhone;

// Transporter snapshot fields
@Column(name = "transporter_name")
private String transporterName;

@Column(name = "transporter_phone")
private String transporterPhone;

// Driver snapshot fields
@Column(name = "driver_name")
private String driverName;

@Column(name = "driver_phone")
private String driverPhone;
```

**File Modified:**
- [backend-java/src/main/java/com/godam/delivery/DeliveryNote.java](../backend-java/src/main/java/com/godam/delivery/DeliveryNote.java)

### 3. Service Layer Changes

**DeliveryNoteService.java** - Added snapshot methods:

```java
private void snapshotCustomerData(DeliveryNote note, Customer customer) {
  if (customer != null) {
    note.setCustomerName(customer.getName());
    note.setCustomerPhone(customer.getReceiver1Contact());
    // Auto-populate address and google map if not provided
    if (note.getAddress() == null || note.getAddress().isBlank()) {
      String address = customer.getLocationText();
      if (address == null || address.isBlank()) {
        address = customer.getCity();
      }
      note.setAddress(address);
    }
    if (note.getGoogleMapLink() == null || note.getGoogleMapLink().isBlank()) {
      note.setGoogleMapLink(customer.getGoogleLocation());
    }
  }
}

private void snapshotDriverData(DeliveryNote note, Driver driver) {
  if (driver != null) {
    note.setDriverName(driver.getDriverName());
    note.setDriverPhone(driver.getDriverNumber());
    // Fallback to driver's truck if not specified
    if (note.getTruckType() == null || note.getTruckType().isBlank()) {
      note.setTruckType(driver.getTruckNo());
    }
  }
}

private void snapshotTransporterData(DeliveryNote note, Transporter transporter) {
  if (transporter != null) {
    note.setTransporterName(transporter.getCompanyName());
    note.setTransporterPhone(transporter.getPhone());
  }
}
```

**Updated `applyRequestToNote()` to call snapshot methods:**
```java
// Load master entities and snapshot their data
Customer customer = loadCustomer(request.getCustomerId());
note.setCustomer(customer);
snapshotCustomerData(note, customer);

Driver driver = loadDriver(request.getDriverId());
note.setDriver(driver);
snapshotDriverData(note, driver);

Transporter transporter = loadTransporter(request.getTransporterId());
note.setTransporter(transporter);
snapshotTransporterData(note, transporter);
```

**File Modified:**
- [backend-java/src/main/java/com/godam/delivery/service/DeliveryNoteService.java](../backend-java/src/main/java/com/godam/delivery/service/DeliveryNoteService.java)

### 4. DTO Changes

**DeliveryNoteResponse.java** - Added snapshot fields to response:
```java
// Snapshot fields - persisted at DN creation time
private String customerName;
private String customerPhone;
private String transporterName;
private String transporterPhone;
private String driverName;
private String driverPhone;
```

**Updated `toResponse()` method:**
```java
// Set snapshot fields - these are the persisted values from DN creation time
response.setCustomerName(note.getCustomerName());
response.setCustomerPhone(note.getCustomerPhone());
response.setTransporterName(note.getTransporterName());
response.setTransporterPhone(note.getTransporterPhone());
response.setDriverName(note.getDriverName());
response.setDriverPhone(note.getDriverPhone());
```

**File Modified:**
- [backend-java/src/main/java/com/godam/delivery/dto/DeliveryNoteResponse.java](../backend-java/src/main/java/com/godam/delivery/dto/DeliveryNoteResponse.java)

### 5. Frontend Changes

**PrintDN.tsx** - Updated to use snapshot fields:

**Type definition updated:**
```typescript
type DeliveryNoteApiResponse = {
  // ... existing fields ...
  // Snapshot fields - persisted at DN creation time
  customerName?: string;
  customerPhone?: string;
  transporterName?: string;
  transporterPhone?: string;
  driverName?: string;
  driverPhone?: string;
  // Master entity references (kept for backward compatibility)
  customer?: { name?: string; locationText?: string; googleLocation?: string; };
  transporter?: { companyName?: string; contactName?: string; };
  driver?: { driverName?: string; driverNumber?: string; truckNo?: string; };
};
```

**Mapping function updated to prioritize snapshot fields:**
```typescript
const mapDeliveryNoteToTemplate = (note: DeliveryNoteApiResponse | null | undefined) => {
  // Use snapshot fields (persisted at DN creation) with fallback to master entity references
  const customerName = note.customerName ?? note.customer?.name;
  const customerPhone = note.customerPhone;
  const transporterName = note.transporterName ?? note.transporter?.companyName;
  const driverName = note.driverName ?? note.driver?.driverName;
  const driverPhone = note.driverPhone ?? note.driver?.driverNumber;

  return {
    customerDisplayName: customerName,  // Uses snapshot value
    carrier: transporterName,           // Uses snapshot value
    driverName: driverName,             // Uses snapshot value
    driverMobile: driverPhone,          // Uses snapshot value
    // ... other fields ...
  };
};
```

**File Modified:**
- [web-admin/src/pages/PrintDN.tsx](../web-admin/src/pages/PrintDN.tsx)

## Data Flow

### DN Creation Flow
```
1. POST /api/delivery-note
   ↓
2. DeliveryNoteService.createDeliveryNote()
   ↓
3. applyRequestToNote()
   ↓
4. Load Customer from DB → snapshotCustomerData()
   Load Driver from DB → snapshotDriverData()
   Load Transporter from DB → snapshotTransporterData()
   ↓
5. Save DeliveryNote with:
   - Foreign key IDs (customer_id, driver_id, transporter_id)
   - Snapshot fields (customer_name, driver_name, etc.)
   ↓
6. Return DeliveryNoteResponse with all snapshot fields
```

### Print/Preview Flow
```
1. GET /api/delivery-note/{id}
   ↓
2. DeliveryNoteService.getDeliveryNoteById()
   ↓
3. toResponse() includes snapshot fields
   ↓
4. Frontend receives complete DN data
   ↓
5. mapDeliveryNoteToTemplate() uses snapshot fields
   ↓
6. Template rendered with persisted values
   ↓
7. Print/Preview shows data exactly as it was at DN creation time
```

## Backward Compatibility

**The implementation maintains backward compatibility:**
- Master entity references (customer_id, driver_id, transporter_id) are still stored
- Customer/Driver/Transporter nested objects are still returned in DTOs
- Frontend code falls back to nested objects if snapshot fields are null
- Existing DNs without snapshot data will continue to work (using master references)

**Migration Path:**
1. Deploy new code (entities, services, DTOs, frontend)
2. Run migration script to add new columns
3. New DNs will automatically populate snapshot fields
4. Old DNs will continue using master references via fallback logic
5. Optional: Run backfill queries to populate snapshot data for existing DNs

## Testing

**To verify the implementation works:**

1. **Create a new DN:**
   ```bash
   POST /api/delivery-note
   {
     "customerId": 123,
     "driverId": 456,
     "transporterId": 789,
     "dnNumber": "DN-TEST-001",
     "outboundNumber": "OUT-001",
     ...
   }
   ```

2. **Check database - verify snapshot fields are populated:**
   ```sql
   SELECT
     dn_number,
     customer_name,
     customer_phone,
     driver_name,
     driver_phone,
     transporter_name,
     transporter_phone
   FROM delivery_note
   WHERE dn_number = 'DN-TEST-001';
   ```

3. **Modify master data (e.g., change customer name):**
   ```bash
   PUT /api/customers/123
   { "name": "MODIFIED CUSTOMER NAME" }
   ```

4. **Print DN and verify it shows ORIGINAL data:**
   ```bash
   GET /api/delivery-note/{id}
   # Response should contain original customer_name, not modified one
   ```

5. **Check PrintDN preview:**
   - Navigate to `/print-dn?id={dnId}`
   - Verify customer name, driver name, transporter name match DN creation time values
   - These should NOT change even if masters were edited

## Database Migration

**For existing databases, run this migration:**
```bash
psql -U godam_user -d godam_db -f backend-java/src/main/resources/db/migration_add_dn_snapshot_fields.sql
```

**To backfill existing DNs (optional):**
```sql
-- Backfill customer snapshot data
UPDATE delivery_note dn
SET
  customer_name = c.name,
  customer_phone = c.receiver1_contact
FROM customers c
WHERE dn.customer_id = c.id AND dn.customer_name IS NULL;

-- Backfill transporter snapshot data
UPDATE delivery_note dn
SET
  transporter_name = t.company_name,
  transporter_phone = t.phone
FROM transporters t
WHERE dn.transporter_id = t.id AND dn.transporter_name IS NULL;

-- Backfill driver snapshot data
UPDATE delivery_note dn
SET
  driver_name = d.driver_name,
  driver_phone = d.driver_number
FROM drivers d
WHERE dn.driver_id = d.id AND dn.driver_name IS NULL;
```

## Benefits

1. **Legal Compliance:** DN is a true legal document that never changes
2. **Data Integrity:** Customer/driver changes don't affect historical DNs
3. **Audit Trail:** Complete snapshot of data at transaction time
4. **Print Consistency:** DN always prints the same way it was created
5. **Independence:** No reliance on master data availability
6. **Performance:** No need for complex joins to reconstruct DN data

## Files Modified Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `backend-java/src/main/java/com/godam/delivery/DeliveryNote.java` | Modified | Added 6 snapshot fields with getters/setters |
| `backend-java/src/main/java/com/godam/delivery/service/DeliveryNoteService.java` | Modified | Added snapshot methods and updated applyRequestToNote() |
| `backend-java/src/main/java/com/godam/delivery/dto/DeliveryNoteResponse.java` | Modified | Added 6 snapshot fields with getters/setters |
| `backend-java/src/main/resources/db/delivery_note_schema.sql` | Modified | Added 6 columns to delivery_note table |
| `backend-java/src/main/resources/db/migration_add_dn_snapshot_fields.sql` | Created | Migration script for existing databases |
| `web-admin/src/pages/PrintDN.tsx` | Modified | Updated types and mapping to use snapshot fields |
| `docs/DN_AUTO_MAPPING_IMPLEMENTATION.md` | Created | This documentation file |

## Deployment Checklist

- [ ] Review all code changes
- [ ] Run migration script on staging database
- [ ] Test DN creation on staging
- [ ] Verify snapshot fields are populated
- [ ] Test DN print/preview on staging
- [ ] Modify master data and verify DN doesn't change
- [ ] Run migration script on production database
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Create test DN on production
- [ ] Verify production DN integrity
