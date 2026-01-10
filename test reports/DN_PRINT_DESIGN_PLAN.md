# DN Print Layout Design Plan - Saudi Government Compliant

## Current State
- Basic DN template with company info, order details, items table, transport info
- Uses Thymeleaf template with print.css

## Requirements for Saudi Government Compliance
1. **Arabic Language Support** - Bilingual (English/Arabic) or Arabic primary
2. **VAT/Tax Information** - VAT registration number, tax invoice fields
3. **ZATCA Compliance** - Commercial registration, VAT number display
4. **Professional Layout** - Clean, modern, print-optimized design
5. **Complete Fields** - All required commercial document fields

## Design Enhancements Planned

### 1. Header Section
- Company logo area with company details
- Commercial Registration (CR) number
- VAT Registration Number
- Document title (Delivery Note - شهادة تسليم)
- QR code for digital verification

### 2. Document Info Panel
- DN Number, Date, Time
- Outbound Reference
- GAPP PO, Customer PO
- Invoice Number
- Project Name (if applicable)
- Payment Terms

### 3. Customer/Ship To Section
- Customer name and address (bilingual)
- Google location link
- Receiver contacts (2 receivers)
- Delivery date/time

### 4. Transport Details
- Carrier/Transporter
- Driver name and mobile
- Vehicle number and type
- Delivery method

### 5. Items Table
- Professional table with better spacing
- Item #, Part Number, Description, Qty, UOM, Condition
- Running totals
- Weight and volume calculations

### 6. Footer Section
- Total cases, gross weight, volume
- Signature areas (sender, receiver, driver)
- Checked by field
- Receiver mandatory fields (name, mobile, sign, date, stamp)
- Terms and conditions
- Company stamp area

## Technical Implementation

### Files to Create/Modify:
1. `backend-java/src/main/resources/templates/dn/dn-print.html` - New professional template
2. `backend-java/src/main/resources/static/css/print.css` - Enhanced print styles
3. Update DnService to include Arabic translations
4. Update DnViewResponse if additional fields needed

### Design Features:
- Print-optimized A4 layout
- Professional typography (Arabic + English fonts)
- Clean borders and spacing
- QR code integration
- Barcode support for DN number
- Watermark protection
- Multi-page support for long orders

## Estimated Timeline
- Phase 1: Template & CSS (2-3 hours)
- Phase 2: Backend data enrichment (1-2 hours)
- Phase 3: Testing & refinement (1-2 hours)
- Total: 4-7 hours

## Next Steps
Awaiting user approval to proceed with implementation.

