# Order Upload Excel Template

## Required Headers

When uploading orders via Excel, use these **exact header names** (case-insensitive):

| Header Name | Description | Required | Example |
|------------|-------------|----------|---------|
| **SO** | Sales Order / GAPP PO | Optional | SO123456 |
| **Outbound** | Outbound Number (unique identifier for the order) | **Required** | OB001 |
| **PO** | Customer Purchase Order | Optional | PO789 |
| **Customer** | **SAP Customer ID** (must match `sap_customer_id` in Customers table) | Optional | 110011 |
| **Part Number** | Part/Item Number | **Required** | PART001 |
| **Quantity** | Order Quantity | **Required** | 10 |
| **Invoice** | Invoice Number | Optional | INV001 |

## Template Format

### CSV Format (Recommended)
```csv
so,outbound,po,customer,part number,quantity,invoice
SO123456,OB001,PO789,110011,PART001,10,INV001
SO123456,OB001,PO789,110011,PART002,5,INV001
SO123457,OB002,PO790,110012,PART003,20,INV002
```

### Excel Format
Create an Excel file with these columns in the first row (headers are case-insensitive):

| so | outbound | po | customer | part number | quantity | invoice |
|----|----------|----|----------|-------------|----------|---------|
| SO123456 | OB001 | PO789 | 110011 | PART001 | 10 | INV001 |
| SO123456 | OB001 | PO789 | 110011 | PART002 | 5 | INV001 |
| SO123457 | OB002 | PO790 | 110012 | PART003 | 20 | INV002 |

**Note**: You can also use uppercase headers (`SO`, `Outbound`, `PO`, etc.) - the system normalizes them to lowercase automatically.

## Important Notes

1. **Header Matching**: Headers are case-insensitive and whitespace-trimmed. You can use:
   - `SO` or `so` or `So`
   - `Outbound` or `outbound` or `OUTBOUND`
   - `Part Number` or `part number` or `PART NUMBER`
   - etc.

2. **Multiple Items per Order**: 
   - Use the same `Outbound` number for all items in one order
   - Header-level fields (SO, PO, Customer, Invoice) are taken from the **first row** of each outbound group
   - Each row represents one item/part number

3. **Required Fields**:
   - **Outbound**: Must be present in every row
   - **Part Number**: Must be present in every row
   - **Quantity**: Must be a positive number

4. **Optional Fields**:
   - **Customer (SAP Customer ID)**: If provided, the system will:
     - Look up the customer in the Customers table by `sap_customer_id`
     - Auto-resolve and display `Customer Name` from the Customers table
     - Show customer name in the order card header
   - If `SO` is provided, it will be stored as `gappPo` in the order

5. **Auto-Validated Fields** (from Stock Table):
   - **Description**: Automatically fetched from Stock table based on `Part Number`
   - **Available Quantity**: Automatically calculated from Stock table based on `Part Number`
   - These fields are displayed in the Order Items table when you expand an order
   - Stock validation ensures sufficient quantity is available before order processing

6. **Data Flow**:
   - `SO` → `OrderWorkflow.gappPo` → `OrderSummaryDto.gappPo`
   - `Outbound` → `OrderWorkflow.outboundNumber` → `OrderSummaryDto.outboundNumber`
   - `PO` → `OrderWorkflow.customerPo` → `OrderSummaryDto.customerPo`
   - `Customer` → `OrderWorkflow.customerId` → `OrderSummaryDto.customerId`
   - `Part Number` → `OrderItem.partNumber` (in items array)
   - `Quantity` → `OrderItem.qty` (in items array)
   - `Invoice` → `OrderWorkflow.invoiceNumber` → `OrderSummaryDto.invoiceNumber`

## Example File

See `ORDER_UPLOAD_TEMPLATE.csv` for a ready-to-use template with sample data.

## Validation & Auto-Population

The system will:

### Validation:
- Required fields are present (`outbound`, `part number`)
- Quantity is a positive number
- Stock availability: Checks Stock table for sufficient quantity
- Customer ID exists in Customers table (if provided) - matches by `sap_customer_id`

### Auto-Population from Database:
- **Description**: Fetched from Stock table using `Part Number` as key
- **Available Quantity**: Calculated from Stock table using `Part Number` as key
- **Customer Name**: Resolved from Customers table using `Customer` (SAP Customer ID) as key

### Display in Order Table:
When you view an order, the following fields are automatically shown:
- **Order Card Header**: Customer Name (resolved from Customers table)
- **Order Items Table** (when expanded):
  - Part Number
  - **Description** (from Stock table)
  - Qty (ordered quantity)
  - **Available** (from Stock table)
  - Suggested Rack
  - Picked status
  - Status

## Upload Process

1. Prepare your Excel file with the headers above
2. Go to Orders page in web-admin
3. Click "Upload" button
4. Select your Excel file
5. Review the parsed rows
6. Click "Submit" to upload
