-- PostgreSQL schema for GoDam Inventory Platform 1.2
-- This script mirrors the SQL Server definitions while using PostgreSQL-native data types,
-- constraints, and idiomatic naming (quoted identifiers keep compatibility with the existing JPA entities).

CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(512) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  refresh_token_hash TEXT,
  permissions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_active ON users(is_active);

CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id SERIAL PRIMARY KEY,
  warehouse_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  gps_lat DOUBLE PRECISION,
  gps_long DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS warehouse_addresses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  manager_name VARCHAR(150),
  manager_email VARCHAR(150),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  warehouse_no VARCHAR(50) NOT NULL,
  storage_location VARCHAR(100) NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  sap_pn VARCHAR(50),
  description TEXT,
  vendor_number VARCHAR(100),
  vendor_name VARCHAR(100),
  category VARCHAR(100),
  sub_category VARCHAR(100),
  batch_no VARCHAR(100),
  parent_pn VARCHAR(100),
  base_qty DOUBLE PRECISION NOT NULL DEFAULT 1,
  pn_indicator CHAR(1),
  is_schneider BOOLEAN NOT NULL DEFAULT FALSE,
  drum_no INTEGER,
  drum_qty DOUBLE PRECISION,
  display_text VARCHAR(200),
  unit_length DOUBLE PRECISION,
  weight DOUBLE PRECISION,
  size VARCHAR(50),
  qty_status VARCHAR(20),
  qty_override_by INTEGER,
  qty_override_reason TEXT,
  remark TEXT,
  qty INTEGER NOT NULL DEFAULT 0,
  uom VARCHAR(20) NOT NULL DEFAULT 'EA',
  rack VARCHAR(50),
  bin VARCHAR(50),
  combine_rack VARCHAR(100),
  serial_required BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ,
  warehouse_id INTEGER,
  updated_by INTEGER,
  deleted_by INTEGER,
  deleted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_stock_warehouse FOREIGN KEY (warehouse_no) REFERENCES warehouses(warehouse_no),
  CONSTRAINT fk_stock_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
  CONSTRAINT fk_stock_user FOREIGN KEY (updated_by) REFERENCES users(user_id),
  CONSTRAINT fk_stock_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id),
  CONSTRAINT fk_stock_override_by FOREIGN KEY (qty_override_by) REFERENCES users(user_id),
  CONSTRAINT uq_stock UNIQUE (warehouse_no, storage_location, part_number, rack, drum_no),
  CONSTRAINT uq_stock_part_warehouse UNIQUE (part_number, warehouse_no)
);
CREATE INDEX IF NOT EXISTS ix_stock_partnumber ON stock(part_number);
CREATE INDEX IF NOT EXISTS ix_stock_parentpn ON stock(parent_pn);
CREATE INDEX IF NOT EXISTS ix_stock_warehouse ON stock(warehouse_no);
CREATE INDEX IF NOT EXISTS ix_stock_deletedat ON stock(deleted_at);
CREATE UNIQUE INDEX IF NOT EXISTS ux_stock_sap_pn ON stock(sap_pn) WHERE sap_pn IS NOT NULL;

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  movement_type VARCHAR(20) NOT NULL,
  warehouse_no VARCHAR(50) NOT NULL,
  storage_location VARCHAR(100) NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  qty_change INTEGER NOT NULL,
  dn_number VARCHAR(100),
  invoice_number VARCHAR(100),
  po_number VARCHAR(100),
  sales_order VARCHAR(100),
  rack VARCHAR(50),
  bin VARCHAR(50),
  suggested_rack VARCHAR(50),
  actual_rack VARCHAR(50),
  picked_qty INTEGER,
  requested_qty INTEGER,
  override_flag VARCHAR(3),
  override_reason TEXT,
  picker_id INTEGER,
  checker_id INTEGER,
  admin_id INTEGER,
  pick_time TIMESTAMPTZ,
  confirm_time TIMESTAMPTZ,
  post_time TIMESTAMPTZ,
  status VARCHAR(20),
  reference VARCHAR(200),
  remark TEXT,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_movement_warehouse FOREIGN KEY (warehouse_no) REFERENCES warehouses(warehouse_no),
  CONSTRAINT fk_movement_user FOREIGN KEY (created_by) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS ix_stock_movements_partnumber ON stock_movements(part_number);
CREATE INDEX IF NOT EXISTS ix_stock_movements_warehouse ON stock_movements(warehouse_no);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  order_id INTEGER,
  outbound_number VARCHAR(100),
  recipient_user_id INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER,
  sender_name VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_action_logs (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER,
  action_type VARCHAR(30) NOT NULL,
  user_id INTEGER,
  username VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_stock_action_stock FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE SET NULL,
  CONSTRAINT fk_stock_action_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS ix_stock_action_stock_id ON stock_action_logs(stock_id);
CREATE INDEX IF NOT EXISTS ix_stock_action_user_id ON stock_action_logs(user_id);

CREATE TABLE IF NOT EXISTS order_workflows (
  id SERIAL PRIMARY KEY,
  order_file VARCHAR(255),
  invoice_number VARCHAR(100),
  outbound_number VARCHAR(100) NOT NULL UNIQUE,
  gapp_po VARCHAR(255),
  customer_po VARCHAR(255),
  customer_name VARCHAR(255),
  serial_required BOOLEAN NOT NULL DEFAULT FALSE,
  serial_completed BOOLEAN NOT NULL DEFAULT FALSE,
  picking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  checking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  dn_created BOOLEAN NOT NULL DEFAULT FALSE,
  upload_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
  delivery_status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
  loaded_at TIMESTAMPTZ,
  on_the_way_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  delivery_item_image1 VARCHAR(500),
  delivery_item_image2 VARCHAR(500),
  delivery_note_image VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_admin_audits (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  outbound_number VARCHAR(100),
  action VARCHAR(20) NOT NULL,
  performed_by VARCHAR(255),
  reason TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_order_admin_audits_order ON order_admin_audits(order_id);

CREATE TABLE IF NOT EXISTS ai_activity_log (
  id SERIAL PRIMARY KEY,
  "user" VARCHAR(100),
  command VARCHAR(500),
  ai_intent VARCHAR(50),
  ai_response TEXT,
  executed_actions TEXT,
  result VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transporters (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  driver_name VARCHAR(255) NOT NULL,
  driver_number VARCHAR(100),
  id_number VARCHAR(100),
  truck_no VARCHAR(100),
  iqama_copy_path VARCHAR(500),
  estimara_path VARCHAR(500),
  driving_license_path VARCHAR(500),
  insurance_path VARCHAR(500),
  vehicle_images TEXT,
  iqama_expiry_date DATE,
  user_id INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  location_text VARCHAR(255),
  google_location VARCHAR(255),
  receiver1_name VARCHAR(255),
  receiver1_contact VARCHAR(50),
  receiver1_email VARCHAR(255),
  receiver1_designation VARCHAR(255),
  receiver2_name VARCHAR(255),
  receiver2_contact VARCHAR(50),
  receiver2_email VARCHAR(255),
  receiver2_designation VARCHAR(255),
  requirements TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_transport (
  id SERIAL PRIMARY KEY,
  transporter_name VARCHAR(255) NOT NULL,
  driver_name VARCHAR(255),
  driver_number VARCHAR(100),
  invoice_number VARCHAR(100),
  outbound_number VARCHAR(100) NOT NULL,
  from_location VARCHAR(255) NOT NULL DEFAULT 'Riyadh',
  to_location VARCHAR(255),
  vehicle_type VARCHAR(100),
  quantity INTEGER,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by INTEGER,
  order_id INTEGER NOT NULL,
  transporter_id INTEGER,
  driver_id INTEGER,
  CONSTRAINT fk_order_transport_order FOREIGN KEY (order_id) REFERENCES order_workflows(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_transport_user FOREIGN KEY (created_by) REFERENCES users(user_id),
  CONSTRAINT fk_order_transport_transporter FOREIGN KEY (transporter_id) REFERENCES transporters(id),
  CONSTRAINT fk_order_transport_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS order_serials (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  outbound_number VARCHAR(100) NOT NULL,
  serial_number VARCHAR(200) NOT NULL,
  entered_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_order_serials_order FOREIGN KEY (order_id) REFERENCES order_workflows(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_serials_user FOREIGN KEY (entered_by) REFERENCES users(user_id)
);
CREATE INDEX IF NOT EXISTS ix_order_serials_outbound ON order_serials(outbound_number);
CREATE INDEX IF NOT EXISTS ix_order_serials_number ON order_serials(serial_number);
CREATE UNIQUE INDEX IF NOT EXISTS ux_order_serials_order_number ON order_serials(order_id, serial_number);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  qty INTEGER NOT NULL,
  picked_by VARCHAR(100),
  picked_at TIMESTAMPTZ,
  picked_rack VARCHAR(50),
  is_picked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES order_workflows(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  outbound_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by INTEGER,
  CONSTRAINT fk_order_files_user FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS matching_dataset_meta (
  dataset_key VARCHAR(32) PRIMARY KEY,
  last_uploaded_at BIGINT,
  last_file_name VARCHAR(255),
  checksum VARCHAR(64),
  row_count INTEGER
);

CREATE TABLE IF NOT EXISTS matching_masters_input_rows (
  id SERIAL PRIMARY KEY,
  account VARCHAR(100),
  contract_no VARCHAR(100),
  contract_name VARCHAR(255),
  mr_number VARCHAR(100),
  dn_number VARCHAR(100),
  cbm VARCHAR(50),
  batch_no VARCHAR(100),
  distributor VARCHAR(150),
  remarks VARCHAR(255),
  po VARCHAR(100),
  so VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "IX_Matching_Input_DN" ON matching_masters_input_rows(dn_number);

CREATE TABLE IF NOT EXISTS matching_masters_accessories (
  part VARCHAR(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS matching_masters_service_parts (
  part VARCHAR(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS matching_masters_software_parts (
  part VARCHAR(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS matching_masters_vcust (
  customer VARCHAR(50) PRIMARY KEY,
  name1 VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS matching_masters_so (
  sales_document VARCHAR(50) PRIMARY KEY,
  customer_reference VARCHAR(100),
  sold_to_party VARCHAR(100),
  sold_to_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS matching_masters_po (
  po_number VARCHAR(50) NOT NULL,
  po_item VARCHAR(20),
  material VARCHAR(100) NOT NULL,
  open_qty DOUBLE PRECISION NOT NULL,
  short_text VARCHAR(255),
  material_group VARCHAR(100),
  plant VARCHAR(50),
  storage_location VARCHAR(50),
  PRIMARY KEY (po_number, material)
);

CREATE TABLE IF NOT EXISTS matching_masters_contracts (
  contract_no VARCHAR(100) PRIMARY KEY,
  project_name VARCHAR(255),
  customer_po_no VARCHAR(255),
  contract_version VARCHAR(100),
  reseller_name VARCHAR(255),
  end_customer_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS matching_dn_files (
  id SERIAL PRIMARY KEY,
  original_file_name VARCHAR(255) NOT NULL,
  dn_number VARCHAR(100),
  contract_no VARCHAR(100),
  mr_no VARCHAR(100),
  customer_po_raw TEXT,
  po_numbers_json TEXT,
  so_number VARCHAR(100),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_blob BYTEA NOT NULL
);

CREATE TABLE IF NOT EXISTS matching_dn_items (
  id SERIAL PRIMARY KEY,
  dn_file_id INTEGER NOT NULL,
  material VARCHAR(100) NOT NULL,
  qty DOUBLE PRECISION NOT NULL,
  description TEXT,
  CONSTRAINT "FK_Matching_DN_File" FOREIGN KEY (dn_file_id) REFERENCES matching_dn_files(id) ON DELETE CASCADE
);
