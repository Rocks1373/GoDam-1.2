-- Schema to support delivery notes and related quantities.
-- This script creates tables that link to the existing masters (customers, drivers, transporters).

CREATE TABLE IF NOT EXISTS delivery_note (
  id BIGSERIAL PRIMARY KEY,
  dn_number VARCHAR(64) NOT NULL UNIQUE,
  outbound_number VARCHAR(64) NOT NULL,
  customer_id BIGINT NOT NULL,
  address TEXT,
  google_map_link TEXT,
  requirements TEXT,
  transporter_id BIGINT NOT NULL,
  driver_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_delivery_note_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT fk_delivery_note_transporter FOREIGN KEY (transporter_id) REFERENCES transporters (id),
  CONSTRAINT fk_delivery_note_driver FOREIGN KEY (driver_id) REFERENCES drivers (id)
);

CREATE TABLE IF NOT EXISTS delivery_note_qty (
  id BIGSERIAL PRIMARY KEY,
  dn_id BIGINT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_delivery_note_qty_delivery_note FOREIGN KEY (dn_id) REFERENCES delivery_note (id) ON DELETE CASCADE
);
