-- GoDam Connector LAN-first schema (SQL Server syntax; SQLite compatible types)

SET ANSI_NULLS ON
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
  CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    is_active BIT NOT NULL DEFAULT 1,
    refresh_token_hash NVARCHAR(255) NULL,
    permissions NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO
CREATE INDEX IX_Users_Active ON Users(is_active);


IF OBJECT_ID('Warehouses', 'U') IS NULL
BEGIN
  CREATE TABLE Warehouses (
    warehouse_id INTEGER PRIMARY KEY IDENTITY(1,1),
    warehouse_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    address NVARCHAR(500) NULL,
    gps_lat FLOAT NULL,
    gps_long FLOAT NULL,
    is_active BIT NOT NULL DEFAULT 1
  );
END
GO


IF OBJECT_ID('warehouse_addresses', 'U') IS NULL
BEGIN
  CREATE TABLE warehouse_addresses (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(200) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    manager_name VARCHAR(150) NULL,
    manager_email VARCHAR(150) NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO


IF OBJECT_ID('Stock', 'U') IS NULL
BEGIN
  CREATE TABLE Stock (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    warehouse_no VARCHAR(50) NOT NULL,
    storage_location VARCHAR(100) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    sap_pn VARCHAR(50) NULL,
    description NVARCHAR(400) NULL,
    vendor_number VARCHAR(100) NULL,
    vendor_name NVARCHAR(255) NULL,
    category NVARCHAR(100) NULL,
    sub_category NVARCHAR(100) NULL,
    batch_no NVARCHAR(100) NULL,
    parent_pn NVARCHAR(100) NULL,
    base_qty FLOAT NOT NULL DEFAULT 1,
    pn_indicator CHAR(1) NULL,
    is_schneider BIT NOT NULL DEFAULT 0,
    drum_no INT NULL,
    drum_qty FLOAT NULL,
    display_text NVARCHAR(200) NULL,
    unit_length FLOAT NULL,
    weight FLOAT NULL,
    size VARCHAR(50) NULL,
    qty_status VARCHAR(20) NULL,
    qty_override_by INT NULL,
    qty_override_reason NVARCHAR(500) NULL,
    remark NVARCHAR(500) NULL,
    qty INT NOT NULL DEFAULT 0,
    uom VARCHAR(20) NOT NULL DEFAULT 'EA',
    rack VARCHAR(50) NULL,
    bin VARCHAR(50) NULL,
    combine_rack NVARCHAR(100) NULL,
    serial_required BIT NOT NULL DEFAULT 0,
    received_at DATETIME2 NULL,
    warehouse_id INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL,
    deleted_at DATETIME2 NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Stock_Warehouse FOREIGN KEY (warehouse_no) REFERENCES Warehouses(warehouse_no),
    CONSTRAINT FK_Stock_WarehouseId FOREIGN KEY (warehouse_id) REFERENCES Warehouses(warehouse_id),
    CONSTRAINT FK_Stock_User FOREIGN KEY (updated_by) REFERENCES Users(user_id),
    CONSTRAINT FK_Stock_DeletedBy FOREIGN KEY (deleted_by) REFERENCES Users(user_id),
    CONSTRAINT FK_Stock_OverrideBy FOREIGN KEY (qty_override_by) REFERENCES Users(user_id),
    CONSTRAINT UQ_Stock UNIQUE (warehouse_no, storage_location, part_number, rack, drum_no)
  );
END
GO
CREATE INDEX IX_Stock_PartNumber ON Stock(part_number);
CREATE INDEX IX_Stock_ParentPn ON Stock(parent_pn);
CREATE INDEX IX_Stock_Warehouse ON Stock(warehouse_no);
CREATE INDEX IX_Stock_DeletedAt ON Stock(deleted_at);
CREATE UNIQUE INDEX UX_Stock_SAP_PN ON Stock(sap_pn) WHERE sap_pn IS NOT NULL;


IF OBJECT_ID('StockMovements', 'U') IS NULL
BEGIN
  CREATE TABLE StockMovements (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    movement_type VARCHAR(20) NOT NULL,
    warehouse_no VARCHAR(50) NOT NULL,
    storage_location VARCHAR(100) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    qty_change INT NOT NULL,
    dn_number VARCHAR(100) NULL,
    invoice_number VARCHAR(100) NULL,
    po_number VARCHAR(100) NULL,
    sales_order VARCHAR(100) NULL,
    rack VARCHAR(50) NULL,
    bin VARCHAR(50) NULL,
    suggested_rack VARCHAR(50) NULL,
    actual_rack VARCHAR(50) NULL,
    picked_qty INT NULL,
    requested_qty INT NULL,
    override_flag VARCHAR(3) NULL,
    override_reason NVARCHAR(400) NULL,
    picker_id INT NULL,
    checker_id INT NULL,
    admin_id INT NULL,
    pick_time DATETIME2 NULL,
    confirm_time DATETIME2 NULL,
    post_time DATETIME2 NULL,
    status VARCHAR(20) NULL,
    reference VARCHAR(200) NULL,
    remark NVARCHAR(400) NULL,
    created_by INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Movement_Warehouse FOREIGN KEY (warehouse_no) REFERENCES Warehouses(warehouse_no),
    CONSTRAINT FK_Movement_User FOREIGN KEY (created_by) REFERENCES Users(user_id)
  );
END
GO
CREATE INDEX IX_Movement_PartNumber ON StockMovements(part_number);
CREATE INDEX IX_Movement_Warehouse ON StockMovements(warehouse_no);


IF OBJECT_ID('notifications', 'U') IS NULL
BEGIN
  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    type VARCHAR(50) NOT NULL,
    order_id INT NULL,
    outbound_number VARCHAR(100) NULL,
    recipient_user_id INT NULL,
    message NVARCHAR(500) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO


IF OBJECT_ID('chat_messages', 'U') IS NULL
BEGIN
  CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    sender_id INT NULL,
    sender_name VARCHAR(120) NOT NULL,
    message NVARCHAR(800) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO


IF OBJECT_ID('stock_action_logs', 'U') IS NULL
BEGIN
  CREATE TABLE stock_action_logs (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    stock_id INT NULL,
    action_type VARCHAR(30) NOT NULL,
    user_id INT NULL,
    username VARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_StockAction_Stock FOREIGN KEY (stock_id) REFERENCES Stock(id) ON DELETE SET NULL,
    CONSTRAINT FK_StockAction_User FOREIGN KEY (user_id) REFERENCES Users(user_id)
  );
END
GO
CREATE INDEX IX_StockAction_StockId ON stock_action_logs(stock_id);
CREATE INDEX IX_StockAction_UserId ON stock_action_logs(user_id);

-- Workflow: one order/outbound -> steps -> DN

IF OBJECT_ID('OrderWorkflows', 'U') IS NULL
BEGIN
  CREATE TABLE OrderWorkflows (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    order_file NVARCHAR(255) NULL,
    invoice_number VARCHAR(100) NULL,
    outbound_number VARCHAR(100) NOT NULL UNIQUE,
    gapp_po NVARCHAR(255) NULL,
    customer_po NVARCHAR(255) NULL,
    customer_name NVARCHAR(255) NULL,
    serial_required BIT NOT NULL DEFAULT 0,
    serial_completed BIT NOT NULL DEFAULT 0,
    picking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    checking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    dn_created BIT NOT NULL DEFAULT 0,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
    loaded_at DATETIME2 NULL,
    on_the_way_at DATETIME2 NULL,
    delivered_at DATETIME2 NULL,
    closed_at DATETIME2 NULL,
    delivery_item_image1 NVARCHAR(500) NULL,
    delivery_item_image2 NVARCHAR(500) NULL,
    delivery_note_image NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO


IF OBJECT_ID('ai_activity_log', 'U') IS NULL
BEGIN
  CREATE TABLE ai_activity_log (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    [user] VARCHAR(100) NULL,
    command VARCHAR(500) NULL,
    ai_intent VARCHAR(50) NULL,
    ai_response NVARCHAR(MAX) NULL,
    executed_actions NVARCHAR(MAX) NULL,
    result VARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO


IF OBJECT_ID('Transporters', 'U') IS NULL
BEGIN
  CREATE TABLE Transporters (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    company_name NVARCHAR(255) NOT NULL,
    contact_name NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO


IF OBJECT_ID('Drivers', 'U') IS NULL
BEGIN
  CREATE TABLE Drivers (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    driver_name NVARCHAR(255) NOT NULL,
    driver_number NVARCHAR(100) NULL,
    id_number NVARCHAR(100) NULL,
    truck_no NVARCHAR(100) NULL,
    iqama_copy_path NVARCHAR(500) NULL,
    estimara_path NVARCHAR(500) NULL,
    driving_license_path NVARCHAR(500) NULL,
    insurance_path NVARCHAR(500) NULL,
    vehicle_images NVARCHAR(MAX) NULL,
    iqama_expiry_date DATE NULL,
    user_id INT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Driver_User FOREIGN KEY (user_id) REFERENCES Users(user_id)
  );
END
GO

-- Matching module (single GoDam DB)

IF OBJECT_ID('Customers', 'U') IS NULL
BEGIN
  CREATE TABLE Customers (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NULL,
    location_text NVARCHAR(255) NULL,
    google_location NVARCHAR(255) NULL,
    sap_customer_id NVARCHAR(255) NULL,
    receiver1_name NVARCHAR(255) NULL,
    receiver1_contact NVARCHAR(50) NULL,
    receiver1_email NVARCHAR(255) NULL,
    receiver1_designation NVARCHAR(255) NULL,
    receiver2_name NVARCHAR(255) NULL,
    receiver2_contact NVARCHAR(50) NULL,
    receiver2_email NVARCHAR(255) NULL,
    receiver2_designation NVARCHAR(255) NULL,
    requirements NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

CREATE UNIQUE INDEX UX_Customers_SAP_ID ON Customers(sap_customer_id);


IF OBJECT_ID('OrderTransport', 'U') IS NULL
BEGIN
  CREATE TABLE OrderTransport (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    transporter_name NVARCHAR(255) NOT NULL,
    driver_name NVARCHAR(255) NULL,
    driver_number NVARCHAR(100) NULL,
    invoice_number VARCHAR(100) NULL,
    outbound_number VARCHAR(100) NOT NULL,
    from_location NVARCHAR(255) NOT NULL DEFAULT 'Riyadh',
    to_location NVARCHAR(255) NULL,
    vehicle_type NVARCHAR(100) NULL,
    quantity INT NULL,
    remarks NVARCHAR(400) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by INT NULL,
    order_id INT NOT NULL,
    transporter_id INT NULL,
    driver_id INT NULL,
    CONSTRAINT FK_Transport_Order FOREIGN KEY (order_id) REFERENCES OrderWorkflows(id) ON DELETE CASCADE,
    CONSTRAINT FK_Transport_User FOREIGN KEY (created_by) REFERENCES Users(user_id),
    CONSTRAINT FK_Transport_Transporter FOREIGN KEY (transporter_id) REFERENCES Transporters(id),
    CONSTRAINT FK_Transport_Driver FOREIGN KEY (driver_id) REFERENCES Drivers(id)
  );
END
GO


IF OBJECT_ID('OrderSerials', 'U') IS NULL
BEGIN
  CREATE TABLE OrderSerials (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    outbound_number VARCHAR(100) NOT NULL,
    serial_number NVARCHAR(200) NOT NULL,
    entered_by INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Serial_Order FOREIGN KEY (order_id) REFERENCES OrderWorkflows(id) ON DELETE CASCADE,
    CONSTRAINT FK_Serial_User FOREIGN KEY (entered_by) REFERENCES Users(user_id)
  );
END
GO
CREATE INDEX IX_Serial_Outbound ON OrderSerials(outbound_number);
CREATE INDEX IX_Serial_Number ON OrderSerials(serial_number);
CREATE UNIQUE INDEX UX_Serial_Order_Serial ON OrderSerials(order_id, serial_number);


IF OBJECT_ID('OrderItems', 'U') IS NULL
BEGIN
  CREATE TABLE OrderItems (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    description NVARCHAR(255) NULL,
    qty INT NOT NULL,
    picked_by VARCHAR(100) NULL,
    picked_at DATETIME2 NULL,
    picked_rack VARCHAR(50) NULL,
    is_picked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (order_id) REFERENCES OrderWorkflows(id) ON DELETE CASCADE
  );
END
GO
CREATE INDEX IX_OrderItems_Order ON OrderItems(order_id);

-- SQL Server-only: enforce serials only after picking is done and serials are required
-- Uncomment when applying to SQL Server
-- IF OBJECT_ID('trg_OrderSerials_PickingGate', 'TR') IS NOT NULL DROP TRIGGER trg_OrderSerials_PickingGate;
-- GO
-- CREATE TRIGGER trg_OrderSerials_PickingGate
-- ON OrderSerials
-- INSTEAD OF INSERT
-- AS
-- BEGIN
--   SET NOCOUNT ON;
--   IF EXISTS (
--     SELECT 1
--     FROM inserted i
--     JOIN OrderWorkflows ow ON ow.id = i.order_id
--     WHERE ow.picking_status <> 'PICKED' OR ow.serial_required <> 1 OR ow.serial_completed = 1
--   )
--   BEGIN
--     RAISERROR('Serial entry allowed only after picking is completed', 16, 1);
--     ROLLBACK TRANSACTION;
--     RETURN;
--   END
--   INSERT INTO OrderSerials(order_id, outbound_number, serial_number, entered_by, created_at)
--   SELECT order_id, outbound_number, serial_number, entered_by, created_at FROM inserted;
-- END;


IF OBJECT_ID('Notifications', 'U') IS NULL
BEGIN
  CREATE TABLE Notifications (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    type VARCHAR(50) NOT NULL,
    order_id INT NULL,
    outbound_number VARCHAR(100) NULL,
    message NVARCHAR(500) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notification_Order FOREIGN KEY (order_id) REFERENCES OrderWorkflows(id) ON DELETE SET NULL
  );
END
GO


IF OBJECT_ID('OrderFiles', 'U') IS NULL
BEGIN
  CREATE TABLE OrderFiles (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    outbound_number VARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by INT NULL,
    CONSTRAINT FK_OrderFiles_User FOREIGN KEY (created_by) REFERENCES Users(user_id)
  );
END
GO


IF OBJECT_ID('matching_dataset_meta', 'U') IS NULL
BEGIN
  CREATE TABLE matching_dataset_meta (
    dataset_key VARCHAR(32) PRIMARY KEY,
    last_uploaded_at BIGINT NULL,
    last_file_name NVARCHAR(255) NULL,
    checksum VARCHAR(64) NULL,
    row_count INT NULL
  );
END
GO


IF OBJECT_ID('matching_masters_input_rows', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_input_rows (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    account NVARCHAR(100) NULL,
    contract_no NVARCHAR(100) NULL,
    contract_name NVARCHAR(255) NULL,
    mr_number NVARCHAR(100) NULL,
    dn_number NVARCHAR(100) NULL,
    cbm NVARCHAR(50) NULL,
    batch_no NVARCHAR(100) NULL,
    distributor NVARCHAR(150) NULL,
    remarks NVARCHAR(255) NULL,
    po NVARCHAR(100) NULL,
    so NVARCHAR(100) NULL
  );
END
GO
CREATE INDEX IX_Matching_Input_DN ON matching_masters_input_rows(dn_number);


IF OBJECT_ID('matching_masters_accessories', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_accessories (
    part VARCHAR(100) PRIMARY KEY
  );
END
GO

IF OBJECT_ID('matching_masters_service_parts', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_service_parts (
    part VARCHAR(100) PRIMARY KEY
  );
END
GO

IF OBJECT_ID('matching_masters_software_parts', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_software_parts (
    part VARCHAR(100) PRIMARY KEY
  );
END
GO


IF OBJECT_ID('matching_masters_vcust', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_vcust (
    customer VARCHAR(50) PRIMARY KEY,
    name1 NVARCHAR(255) NULL
  );
END
GO


IF OBJECT_ID('matching_masters_so', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_so (
    sales_document VARCHAR(50) PRIMARY KEY,
    customer_reference VARCHAR(100) NULL,
    sold_to_party VARCHAR(100) NULL,
    sold_to_name NVARCHAR(255) NULL
  );
END
GO


IF OBJECT_ID('matching_masters_po', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_po (
    po_number VARCHAR(50) NOT NULL,
    po_item VARCHAR(20) NULL,
    material VARCHAR(100) NOT NULL,
    open_qty FLOAT NOT NULL,
    short_text NVARCHAR(255) NULL,
    material_group VARCHAR(100) NULL,
    plant VARCHAR(50) NULL,
    storage_location VARCHAR(50) NULL,
    CONSTRAINT PK_Matching_PO PRIMARY KEY (po_number, material)
  );
END
GO


IF OBJECT_ID('matching_masters_contracts', 'U') IS NULL
BEGIN
  CREATE TABLE matching_masters_contracts (
    contract_no NVARCHAR(100) PRIMARY KEY,
    project_name NVARCHAR(255) NULL,
    customer_po_no NVARCHAR(255) NULL,
    contract_version NVARCHAR(100) NULL,
    reseller_name NVARCHAR(255) NULL,
    end_customer_name NVARCHAR(255) NULL
  );
END
GO


IF OBJECT_ID('matching_dn_files', 'U') IS NULL
BEGIN
  CREATE TABLE matching_dn_files (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    original_file_name NVARCHAR(255) NOT NULL,
    dn_number NVARCHAR(100) NULL,
    contract_no NVARCHAR(100) NULL,
    mr_no NVARCHAR(100) NULL,
    customer_po_raw NVARCHAR(500) NULL,
    po_numbers_json NVARCHAR(1000) NULL,
    so_number NVARCHAR(100) NULL,
    uploaded_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    file_blob VARBINARY(MAX) NOT NULL
  );
END
GO


IF OBJECT_ID('matching_dn_items', 'U') IS NULL
BEGIN
  CREATE TABLE matching_dn_items (
    id INTEGER PRIMARY KEY IDENTITY(1,1),
    dn_file_id INTEGER NOT NULL,
    material VARCHAR(100) NOT NULL,
    qty FLOAT NOT NULL,
    description NVARCHAR(500) NULL,
    CONSTRAINT FK_Matching_DN_File FOREIGN KEY (dn_file_id) REFERENCES matching_dn_files(id) ON DELETE CASCADE
  );
END
GO
