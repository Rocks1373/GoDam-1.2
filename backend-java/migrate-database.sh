#!/bin/bash

# Database Migration Script for Authentication System
# This script updates the Users table to add authentication fields

SERVER_IP="72.61.245.23"
SERVER_USER="root"
SERVER_PASSWORD="9804409636Aa@themaninthemooN"
DB_PATH="/root/godam-data/godam.db"

echo "=========================================="
echo "GoDam Database Migration"
echo "=========================================="
echo ""

# Create migration SQL script
cat > /tmp/migrate.sql << 'EOF'
-- Backup existing Users table
CREATE TABLE IF NOT EXISTS Users_backup AS SELECT * FROM Users;

-- Drop existing Users table
DROP TABLE IF EXISTS Users;

-- Create new Users table with all fields
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT '$2a$10$dummypasswordhash',
    role TEXT NOT NULL DEFAULT 'PICKER',
    email TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER,
    updated_at INTEGER
);

-- Migrate existing data (if any)
INSERT INTO Users (user_id, username, password, role, email, active, created_at, updated_at)
SELECT 
    user_id, 
    username, 
    '$2a$10$dummypasswordhash' as password,
    'PICKER' as role,
    NULL as email,
    1 as active,
    (CAST(strftime('%s','now') AS INTEGER) * 1000) as created_at,
    (CAST(strftime('%s','now') AS INTEGER) * 1000) as updated_at
FROM Users_backup
WHERE EXISTS (SELECT 1 FROM Users_backup);

-- Drop backup table
DROP TABLE IF EXISTS Users_backup;

-- Verify migration
SELECT 'Migration complete. Users table structure:' as message;
PRAGMA table_info(Users);
EOF

echo "Step 1: Uploading migration script to server..."
sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no /tmp/migrate.sql ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "Step 2: Backing up database..."
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
    "cp ${DB_PATH} ${DB_PATH}.backup-\$(date +%Y%m%d-%H%M%S)"

echo "Step 3: Running migration..."
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
    "sqlite3 ${DB_PATH} < /tmp/migrate.sql"

echo "Step 4: Verifying migration..."
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} \
    "sqlite3 ${DB_PATH} 'PRAGMA table_info(Users);'"

echo ""
echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "The Users table has been updated with authentication fields."
echo "All existing users have been migrated with default values."
echo ""
echo "Next step: Restart the backend to initialize test users"
echo "  docker restart godam-backend"
echo ""
