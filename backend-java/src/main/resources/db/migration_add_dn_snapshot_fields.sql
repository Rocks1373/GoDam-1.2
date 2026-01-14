-- Migration script to add snapshot fields to delivery_note table
-- This allows DN to be fully self-contained and independent of master data changes
-- Run this script on existing databases to add the new columns

ALTER TABLE delivery_note
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(64),
  ADD COLUMN IF NOT EXISTS transporter_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS transporter_phone VARCHAR(64),
  ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(64);

-- Optionally, backfill existing DNs with snapshot data from master tables
-- Uncomment the following statements if you want to populate existing DNs:

-- UPDATE delivery_note dn
-- SET
--   customer_name = c.name,
--   customer_phone = c.receiver1_contact
-- FROM customers c
-- WHERE dn.customer_id = c.id AND dn.customer_name IS NULL;

-- UPDATE delivery_note dn
-- SET
--   transporter_name = t.company_name,
--   transporter_phone = t.phone
-- FROM transporters t
-- WHERE dn.transporter_id = t.id AND dn.transporter_name IS NULL;

-- UPDATE delivery_note dn
-- SET
--   driver_name = d.driver_name,
--   driver_phone = d.driver_number
-- FROM drivers d
-- WHERE dn.driver_id = d.id AND dn.driver_name IS NULL;
