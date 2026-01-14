-- Driver/Transporter master data extensions for GoDAM.
-- Apply manually if your database does not support IF NOT EXISTS.

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(255),
  ADD COLUMN IF NOT EXISTS iqama_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS license_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS license_image VARCHAR(500),
  ADD COLUMN IF NOT EXISTS truck_front_image VARCHAR(500),
  ADD COLUMN IF NOT EXISTS truck_back_image VARCHAR(500);

ALTER TABLE transporters
  ADD COLUMN IF NOT EXISTS phone VARCHAR(100),
  ADD COLUMN IF NOT EXISTS vat_number VARCHAR(120),
  ADD COLUMN IF NOT EXISTS cr_number VARCHAR(120);

CREATE TABLE IF NOT EXISTS courier_master (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(120),
  email VARCHAR(255),
  vat_no VARCHAR(120),
  cr_no VARCHAR(120),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);
