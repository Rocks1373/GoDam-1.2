# Delivery Note Data Mapping Analysis

## Overview
This document analyzes the data flow from the Delivery Note Creation Panel (web-admin) to the DN Preview component, including backend mapping and database storage.

---

## 1. FORM INPUT FIELDS (Creation Panel)

### Location: `web-admin/src/pages/DeliveryNotes.tsx` - `DeliveryNoteFormState`

| Form Field | Type | Source | Notes |
|------------|------|--------|-------|
| `dnNumber` | string | Auto-generated or manual | Format: `DN-YYYYMMDD-XXXX` |
| `dnDate` | string (ISO) | Current date or manual | ISO format |
| `invoiceNumber` | string | Manual input | **Required** |
| `customerPo` | string | From outbound or manual | Can be from order |
| `gappPo` | string | From outbound or manual | Can be from order |
| `outboundNumber` | string | From selected order | Auto-filled, can override |
| `customerId` | string | From customer selection | Internal ID |
| `customerName` | string | From customer lookup | Auto-filled when customer selected |
| `customerLocationType` | LocationType | Manual selection | Options: Warehouse, Site, House, Office |
| `customerLocationText` | string | From customer or manual | Location name/details |
| `address` | string | From customer or manual | Delivery address |
| `googleMapLink` | string | From customer or manual | Google Maps URL |
| `customerEmail` | string | From customer or manual | Email address |
| `phone1` | string | From customer or manual | Primary contact (receiver1Contact) |
| `phone2` | string | From customer or manual | Secondary contact (receiver2Contact) |
| `receiver1Name` | string | From customer or manual | Primary receiver name |
| `receiver2Name` | string | From customer or manual | Secondary receiver name |
| `requirements` | string | From customer or manual | Additional instructions/remarks |
| `transporterId` | string | From dropdown selection | **Required** |
| `truckType` | string | Manual selection | Options: Flatbed, Covered, Refrigerated, Container, Open Deck |
| `driverId` | string | From dropdown selection | **Required** |
| `driverName` | string | Auto-filled from driver | When driver selected |
| `driverNumber` | string | Auto-filled from driver | When driver selected |
| `driverIdNumber` | string | Auto-filled from driver | Iqama number |
| `allowOutboundEdit` | boolean | Toggle button | Admin override flag |

### Quantity Rows (`qtyRows`)
- Array of `{ description: string, quantity: string }`
- Populated from order items when order is selected
- Can have up to 9 rows (MAX_ROWS = 9)

---

## 2. PREVIEW PROPS MAPPING

### Location: `web-admin/src/pages/DeliveryNotes.tsx` - Lines 273-293

| Preview Prop | Form State Field | Status | Notes |
|--------------|------------------|--------|-------|
| `dnNumber` | `formState.dnNumber` | ✅ Mapped | Direct mapping |
| `outboundNumber` | `formState.outboundNumber` | ✅ Mapped | Direct mapping |
| `customerName` | `formState.customerName` | ✅ Mapped | Direct mapping |
| `address` | `formState.address` | ✅ Mapped | Direct mapping |
| `requirements` | `formState.requirements` | ✅ Mapped | Direct mapping |
| `googleMapLink` | `formState.googleMapLink` | ✅ Mapped | Direct mapping |
| `phone1` | `formState.phone1` | ✅ Mapped | Direct mapping |
| `phone2` | `formState.phone2` | ✅ Mapped | Direct mapping |
| `receiver1Name` | `formState.receiver1Name` | ✅ Mapped | Direct mapping |
| `receiver2Name` | `formState.receiver2Name` | ✅ Mapped | Direct mapping |
| `customerEmail` | `formState.customerEmail` | ✅ Mapped | Direct mapping |
| `customerLocationType` | `formState.customerLocationType` | ✅ Mapped | Direct mapping |
| `customerLocationDetail` | `formState.customerLocationText` | ✅ Mapped | Direct mapping |
| `transporterName` | `selectedTransporter?.companyName` | ✅ Mapped | From selected transporter object |
| `transporterContact` | `selectedTransporter?.contactName` | ✅ Mapped | From selected transporter object |
| `driverName` | `formState.driverName` | ✅ Mapped | Direct mapping |
| `driverNumber` | `formState.driverNumber` | ✅ Mapped | Direct mapping |
| `truckType` | `formState.truckType` | ✅ Mapped | Direct mapping |
| `quantities` | `previewQuantities` (computed) | ✅ Mapped | Filtered and converted from qtyRows |

### ⚠️ MISSING IN PREVIEW PROPS
| Form Field | Should Map To | Issue |
|------------|---------------|-------|
| `dnDate` | `dnDate` prop | ❌ **NOT PASSED** - Preview uses current date as fallback |
| `invoiceNumber` | Not in preview | ⚠️ Not displayed in preview (but saved to backend) |
| `customerPo` | Not in preview | ⚠️ Not displayed in preview (but saved to backend) |
| `gappPo` | Not in preview | ⚠️ Not displayed in preview (but saved to backend) |
| `driverIdNumber` | Not in preview | ⚠️ Not displayed in preview |

---

## 3. DN PREVIEW COMPONENT DISPLAY

### Location: `web-admin/src/components/DNPreview.tsx`

| Display Field | Preview Prop | Display Location | Status |
|---------------|--------------|------------------|--------|
| **Header Section** |
| DN Number | `dnNumber` | Top header | ✅ Displayed |
| Date | `dnDate` | Top header (right) | ⚠️ Uses fallback if not provided |
| Outbound Number | `outboundNumber` | Top header (right) | ✅ Displayed |
| **Delivery To Section** |
| Customer Name | `customerName` | Left box | ✅ Displayed |
| Address | `address` | Left box | ✅ Displayed |
| Phone | `phone1` | Left box | ✅ Displayed (if exists) |
| Receiver Name | `receiver1Name` | Left box | ✅ Displayed (if exists) |
| **Dispatched From Section** |
| Warehouse Name | `warehouseName` | Right box | ✅ Displayed (default: "Main Warehouse") |
| Warehouse Address | `warehouseAddress` | Right box | ✅ Displayed (default: "Warehouse Address") |
| Warehouse Contact | `warehouseContact` | Right box | ⚠️ **NOT SET** - Always empty |
| **Items Table** |
| Item Number | Auto-generated | Table column | ✅ Displayed |
| Part Number | `items[].partNumber` | Table column | ⚠️ Uses "N/A" for quantities |
| Description | `items[].description` or `quantities[].description` | Table column | ✅ Displayed |
| UOM | `items[].uom` or "PCS" | Table column | ✅ Displayed |
| Quantity | `items[].quantity` or `quantities[].quantity` | Table column | ✅ Displayed |
| **Delivery Information** |
| Driver Name | `driverName` | Footer section | ✅ Displayed |
| Driver Mobile | `driverNumber` | Footer section | ✅ Displayed |
| Carrier | `transporterName` | Footer section | ✅ Displayed |
| Vehicle Type | `truckType` | Footer section | ✅ Displayed |
| Vehicle Plate | `vehiclePlate` | Footer section | ⚠️ **NOT SET** - Always empty |

### ⚠️ FIELDS NOT DISPLAYED IN PREVIEW
- `phone2` - Second phone number
- `receiver2Name` - Second receiver
- `customerEmail` - Customer email
- `customerLocationType` - Location type
- `customerLocationDetail` - Location details
- `googleMapLink` - Google Maps link
- `requirements` - Additional requirements/remarks
- `transporterContact` - Transporter contact name
- `invoiceNumber` - Invoice number
- `customerPo` - Customer PO
- `gappPo` - GAPP PO

---

## 4. BACKEND REQUEST MAPPING

### Location: `web-admin/src/pages/DeliveryNotes.tsx` - `executeSave()` function (Lines 645-685)

| Backend Request Field | Form State Field | Status | Notes |
|----------------------|------------------|--------|-------|
| `orderId` | `selectedOrderId` | ✅ Mapped | From selected order |
| `dnNumber` | `formState.dnNumber` | ✅ Mapped | Direct mapping |
| `dnDate` | `formState.dnDate` | ✅ Mapped | ISO string or current date |
| `invoiceNumber` | `formState.invoiceNumber` | ✅ Mapped | **Required** |
| `customerPo` | `formState.customerPo` or `outboundInfo?.customerPo` | ✅ Mapped | Fallback to outbound |
| `gappPo` | `formState.gappPo` or `outboundInfo?.gappPo` | ✅ Mapped | Fallback to outbound |
| `preparedBy` | `resolvePreparedByName()` | ✅ Mapped | From localStorage user |
| `outboundNumber` | `formState.outboundNumber` | ✅ Mapped | Direct mapping |
| `customerId` | `selectedCustomer?.id` | ✅ Mapped | **Required** |
| `address` | `formState.address` | ✅ Mapped | Direct mapping |
| `googleMapLink` | `formState.googleMapLink` | ✅ Mapped | Direct mapping |
| `requirements` | `formState.requirements` | ✅ Mapped | Direct mapping |
| `transporterId` | `Number(formState.transporterId)` | ✅ Mapped | **Required**, converted to number |
| `driverId` | `Number(formState.driverId)` | ✅ Mapped | **Required**, converted to number |
| `truckType` | `formState.truckType` | ✅ Mapped | Direct mapping |
| `status` | "COMPLETE" or "INCOMPLETE" | ✅ Mapped | Based on validation |
| `quantities` | `qtyRows` (filtered & converted) | ✅ Mapped | Array of `{description, quantity}` |

### ⚠️ FIELDS NOT SENT TO BACKEND
| Form Field | Should Be Sent? | Issue |
|------------|-----------------|-------|
| `phone1` | ❌ No | Customer phone stored via snapshot, not from form |
| `phone2` | ❌ No | Not stored in DN entity |
| `receiver1Name` | ❌ No | Not stored in DN entity |
| `receiver2Name` | ❌ No | Not stored in DN entity |
| `customerEmail` | ❌ No | Not stored in DN entity |
| `customerLocationType` | ❌ No | Not stored in DN entity |
| `customerLocationText` | ❌ No | Not stored in DN entity (only in customer master) |
| `driverIdNumber` | ❌ No | Not stored in DN entity |

---

## 5. BACKEND ENTITY MAPPING

### Location: `backend-java/src/main/java/com/godam/delivery/DeliveryNote.java`

| Database Column | Entity Field | Request Field | Snapshot Source | Status |
|----------------|--------------|---------------|-----------------|--------|
| `id` | `id` | Auto-generated | - | ✅ |
| `dn_number` | `dnNumber` | `request.dnNumber` | - | ✅ |
| `customer_po` | `customerPo` | `request.customerPo` | - | ✅ |
| `gapp_po` | `gappPo` | `request.gappPo` | - | ✅ |
| `invoice_number` | `invoiceNumber` | `request.invoiceNumber` | - | ✅ |
| `prepared_by` | `preparedBy` | `request.preparedBy` | - | ✅ |
| `truck_type` | `truckType` | `request.truckType` | Fallback: `driver.truckNo` | ✅ |
| `dn_date` | `dnDate` | `request.dnDate` | - | ✅ |
| `outbound_number` | `outboundNumber` | `request.outboundNumber` | - | ✅ |
| `customer_id` | `customer` (FK) | `request.customerId` | - | ✅ |
| `customer_name` | `customerName` | - | `customer.name` | ✅ Snapshot |
| `customer_phone` | `customerPhone` | - | `customer.receiver1Contact` | ✅ Snapshot |
| `address` | `address` | `request.address` | Fallback: `customer.locationText` or `customer.city` | ✅ |
| `google_map_link` | `googleMapLink` | `request.googleMapLink` | Fallback: `customer.googleLocation` | ✅ |
| `requirements` | `requirements` | `request.requirements` | - | ✅ |
| `transporter_id` | `transporter` (FK) | `request.transporterId` | - | ✅ |
| `transporter_name` | `transporterName` | - | `transporter.companyName` | ✅ Snapshot |
| `transporter_phone` | `transporterPhone` | - | `transporter.phone` | ✅ Snapshot |
| `driver_id` | `driver` (FK) | `request.driverId` | - | ✅ |
| `driver_name` | `driverName` | - | `driver.driverName` | ✅ Snapshot |
| `driver_phone` | `driverPhone` | - | `driver.driverNumber` | ✅ Snapshot |
| `status` | `status` | `request.status` | Default: "draft" | ✅ |
| `created_at` | `createdAt` | Auto-generated | - | ✅ |
| `updated_at` | `updatedAt` | Auto-generated | - | ✅ |

### ⚠️ DATA LOSS ISSUES

1. **Customer Contact Details Not Persisted**
   - `phone1` (form) → Not stored (only snapshot from `customer.receiver1Contact`)
   - `phone2` (form) → **NOT STORED** at all
   - `receiver1Name` (form) → **NOT STORED** at all
   - `receiver2Name` (form) → **NOT STORED** at all
   - `customerEmail` (form) → **NOT STORED** at all

2. **Location Details Not Persisted**
   - `customerLocationType` (form) → **NOT STORED** at all
   - `customerLocationText` (form) → **NOT STORED** (only in customer master, not in DN)

3. **Driver Details Not Persisted**
   - `driverIdNumber` (form) → **NOT STORED** in DN entity (only in driver master)

---

## 6. PREVIEW vs BACKEND DATA MISMATCH

### Issues Found:

1. **Date Field**
   - ❌ `dnDate` is NOT passed to preview props
   - Preview uses current date as fallback
   - Backend stores `dnDate` correctly

2. **Invoice Number**
   - ❌ Not displayed in preview
   - ✅ Stored in backend
   - ⚠️ Should be displayed in preview header

3. **Customer PO / GAPP PO**
   - ❌ Not displayed in preview
   - ✅ Stored in backend
   - ⚠️ Should be displayed in preview header

4. **Customer Contact Details**
   - Preview shows: `phone1`, `receiver1Name`
   - Backend stores: Only `customerPhone` (snapshot from customer master)
   - ⚠️ Form input may differ from customer master data

5. **Requirements/Remarks**
   - ❌ Not displayed in preview
   - ✅ Stored in backend
   - ⚠️ Should be displayed in preview

6. **Google Map Link**
   - ❌ Not displayed in preview
   - ✅ Stored in backend
   - ⚠️ Could be displayed as clickable link

7. **Warehouse Information**
   - Preview shows: Hardcoded defaults ("Main Warehouse", "Warehouse Address")
   - Backend: Not stored in DN entity
   - ⚠️ Should come from configuration or be editable

8. **Vehicle Plate**
   - Preview expects: `vehiclePlate` prop
   - Form has: `driverIdNumber` (Iqama) - different field
   - Backend: Driver has `truckNo` but not mapped to preview
   - ⚠️ Mismatch in field names/purpose

---

## 7. SUMMARY OF ISSUES

### Critical Issues (Data Loss)
1. ❌ **Customer contact details from form are not persisted** - Only snapshot from customer master is stored
2. ❌ **Location type and details not stored** - Only address is stored
3. ❌ **Second receiver/phone not stored** - Only primary contact snapshot

### Display Issues
1. ⚠️ **DN Date not passed to preview** - Uses fallback current date
2. ⚠️ **Invoice number not displayed** - Should be in header
3. ⚠️ **Customer PO / GAPP PO not displayed** - Should be in header
4. ⚠️ **Requirements/Remarks not displayed** - Should be visible
5. ⚠️ **Google Map link not displayed** - Should be clickable
6. ⚠️ **Warehouse info is hardcoded** - Should be configurable
7. ⚠️ **Vehicle plate not mapped** - Driver truckNo exists but not used

### Mapping Issues
1. ⚠️ **Form phone1 may differ from customer master** - Form input not used, only snapshot
2. ⚠️ **Location text not stored in DN** - Only address is stored
3. ⚠️ **Driver ID number not stored** - Only in driver master

---

## 8. RECOMMENDATIONS

### High Priority
1. **Add missing fields to preview display:**
   - Invoice number in header
   - Customer PO / GAPP PO in header
   - Requirements/Remarks section
   - Google Map link (clickable)

2. **Fix date mapping:**
   - Pass `dnDate` to preview props
   - Format date properly for display

3. **Store form input data:**
   - Add columns for `receiver1Name`, `receiver2Name`, `customerEmail`
   - Store `phone1` and `phone2` from form (not just snapshot)
   - Store `customerLocationType` and `customerLocationText`

### Medium Priority
4. **Warehouse configuration:**
   - Add warehouse master table or configuration
   - Pass warehouse info to preview from backend

5. **Vehicle plate mapping:**
   - Map `driver.truckNo` to `vehiclePlate` in preview
   - Or add separate `vehiclePlate` field in form

6. **Location details:**
   - Display location type and details in preview
   - Store location text in DN entity

### Low Priority
7. **Additional display fields:**
   - Show second receiver/phone if available
   - Show customer email if available
   - Show transporter contact name

8. **Data validation:**
   - Ensure form data matches preview before save
   - Add validation for required preview fields

---

## 9. DATA FLOW DIAGRAM

```
FORM INPUT (DeliveryNotes.tsx)
    ↓
PREVIEW PROPS (previewProps object)
    ↓
DN PREVIEW COMPONENT (Display)
    ↓
SAVE BUTTON → executeSave()
    ↓
BACKEND REQUEST (DeliveryNoteRequest)
    ↓
SERVICE (DeliveryNoteService.applyRequestToNote)
    ↓
ENTITY (DeliveryNote) + SNAPSHOTS
    ↓
DATABASE (delivery_note table)
    ↓
RESPONSE (DeliveryNoteResponse)
```

### Key Points:
- Preview uses form state directly (live preview)
- Backend request only sends subset of form fields
- Backend creates snapshots from master data (customer, driver, transporter)
- Form input for customer details may be lost if not in customer master

---

## 10. FIELD MAPPING TABLE

| Form Field | Preview Prop | Preview Display | Backend Request | Backend Entity | Database Column | Status |
|------------|--------------|-----------------|-----------------|----------------|-----------------|--------|
| dnNumber | ✅ dnNumber | ✅ Header | ✅ dnNumber | ✅ dnNumber | ✅ dn_number | ✅ |
| dnDate | ❌ Missing | ⚠️ Fallback | ✅ dnDate | ✅ dnDate | ✅ dn_date | ⚠️ |
| invoiceNumber | ❌ Missing | ❌ Not shown | ✅ invoiceNumber | ✅ invoiceNumber | ✅ invoice_number | ⚠️ |
| customerPo | ❌ Missing | ❌ Not shown | ✅ customerPo | ✅ customerPo | ✅ customer_po | ⚠️ |
| gappPo | ❌ Missing | ❌ Not shown | ✅ gappPo | ✅ gappPo | ✅ gapp_po | ⚠️ |
| outboundNumber | ✅ outboundNumber | ✅ Header | ✅ outboundNumber | ✅ outboundNumber | ✅ outbound_number | ✅ |
| customerName | ✅ customerName | ✅ Delivery To | ✅ (via customerId) | ✅ customerName (snapshot) | ✅ customer_name | ✅ |
| address | ✅ address | ✅ Delivery To | ✅ address | ✅ address | ✅ address | ✅ |
| phone1 | ✅ phone1 | ✅ Delivery To | ❌ Not sent | ⚠️ customerPhone (snapshot) | ✅ customer_phone | ⚠️ |
| phone2 | ✅ phone2 | ❌ Not shown | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| receiver1Name | ✅ receiver1Name | ✅ Delivery To | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| receiver2Name | ✅ receiver2Name | ❌ Not shown | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| customerEmail | ✅ customerEmail | ❌ Not shown | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| customerLocationType | ✅ customerLocationType | ❌ Not shown | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| customerLocationText | ✅ customerLocationDetail | ❌ Not shown | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| googleMapLink | ✅ googleMapLink | ❌ Not shown | ✅ googleMapLink | ✅ googleMapLink | ✅ google_map_link | ⚠️ |
| requirements | ✅ requirements | ❌ Not shown | ✅ requirements | ✅ requirements | ✅ requirements | ⚠️ |
| transporterName | ✅ transporterName | ✅ Footer | ✅ (via transporterId) | ✅ transporterName (snapshot) | ✅ transporter_name | ✅ |
| transporterContact | ✅ transporterContact | ❌ Not shown | ❌ Not sent | ⚠️ transporterPhone (snapshot) | ✅ transporter_phone | ⚠️ |
| driverName | ✅ driverName | ✅ Footer | ✅ (via driverId) | ✅ driverName (snapshot) | ✅ driver_name | ✅ |
| driverNumber | ✅ driverNumber | ✅ Footer | ✅ (via driverId) | ✅ driverPhone (snapshot) | ✅ driver_phone | ✅ |
| truckType | ✅ truckType | ✅ Footer | ✅ truckType | ✅ truckType | ✅ truck_type | ✅ |
| driverIdNumber | ❌ Missing | ❌ Not shown | ❌ Not sent | ❌ Not stored | ❌ - | ❌ |
| quantities | ✅ quantities | ✅ Items Table | ✅ quantities | ✅ quantities | ✅ delivery_note_qty | ✅ |

**Legend:**
- ✅ = Correctly mapped
- ⚠️ = Mapped but with issues
- ❌ = Not mapped or missing

---

## Conclusion

The delivery note creation panel has **good basic mapping** for core fields, but there are **significant gaps** in:
1. Display of important fields (invoice, PO numbers, requirements)
2. Persistence of customer contact details from form input
3. Date field passing to preview
4. Location details storage and display

**Recommendation:** Address the critical issues first, especially ensuring form input data is properly stored and displayed in the preview.
