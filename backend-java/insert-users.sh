#!/bin/bash

# Script to manually insert test users into the database

SERVER_IP="72.61.245.23"
SERVER_USER="root"
SERVER_PASSWORD="9804409636Aa@themaninthemooN"
DB_PATH="/root/godam-data/godam.db"

cat > /tmp/insert_users.sql <<'SQL'
-- Delete existing users
DELETE FROM Users;

-- Insert Owner
INSERT INTO Users (username, password, role, email, active, created_at, updated_at) VALUES
('godam_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OWNER', 'admin@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000));

-- Insert Admins, Pickers and Drivers
INSERT INTO Users (username, password, role, email, active, created_at, updated_at) VALUES
('admin1', '$2a$10$dXJ3SW6G7P2lh8RBuXkjNOgJvFkk3rdJWllSAwyOgt2ngduZBdN4e', 'ADMIN', 'admin1@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('admin2', '$2a$10$dXJ3SW6G7P2lh8RBuXkjNOgJvFkk3rdJWllSAwyOgt2ngduZBdN4e', 'ADMIN', 'admin2@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('admin3', '$2a$10$dXJ3SW6G7P2lh8RBuXkjNOgJvFkk3rdJWllSAwyOgt2ngduZBdN4e', 'ADMIN', 'admin3@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('admin4', '$2a$10$dXJ3SW6G7P2lh8RBuXkjNOgJvFkk3rdJWllSAwyOgt2ngduZBdN4e', 'ADMIN', 'admin4@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker1@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker2@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker3@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker4', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker4@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker5', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker5@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker6', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker6@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker7', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker7@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker8', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker8@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker9', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker9@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('picker10', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PICKER', 'picker10@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('driver1', '$2a$10$8cjz47bjbR4Mn8GMg9IZx.vyjhLUDHaoxQ5CyVpMzjMt6NoHZMXq6', 'DRIVER', 'driver1@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('driver2', '$2a$10$8cjz47bjbR4Mn8GMg9IZx.vyjhLUDHaoxQ5CyVpMzjMt6NoHZMXq6', 'DRIVER', 'driver2@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('driver3', '$2a$10$8cjz47bjbR4Mn8GMg9IZx.vyjhLUDHaoxQ5CyVpMzjMt6NoHZMXq6', 'DRIVER', 'driver3@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('driver4', '$2a$10$8cjz47bjbR4Mn8GMg9IZx.vyjhLUDHaoxQ5CyVpMzjMt6NoHZMXq6', 'DRIVER', 'driver4@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000)),
('driver5', '$2a$10$8cjz47bjbR4Mn8GMg9IZx.vyjhLUDHaoxQ5CyVpMzjMt6NoHZMXq6', 'DRIVER', 'driver5@godam.com', 1, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000));

-- Verify insertion
SELECT 'Users created successfully!' as message;
SELECT role, COUNT(*) as count FROM Users GROUP BY role;
SQL

sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no /tmp/insert_users.sql ${SERVER_USER}@${SERVER_IP}:/tmp/

sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "sqlite3 ${DB_PATH} < /tmp/insert_users.sql"

cat <<'OUT'
==========================================
Users Inserted Successfully!
==========================================

Test Users:
  Owner:   godam_admin / 123456789
  Admins:  admin1-4 / admin123
  Pickers: picker1-10 / picker123
  Drivers: driver1-5 / driver123
OUT
