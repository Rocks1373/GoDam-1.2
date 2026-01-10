#!/bin/bash
# Initialize AI service database schema

set -e

# Get environment variables or use defaults
DB_HOST="${DB_HOST:-godam-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-godam}"
DB_USER="${AI_DB_USER:-ai_readonly}"
DB_PASSWORD="${AI_DB_PASSWORD:-ai_readonly_secure_2024}"

echo "Initializing AI database schema..."
echo "Host: $DB_HOST, Database: $DB_NAME, User: $DB_USER"

# Wait for database to be ready using Python
echo "Waiting for database to be ready..."
python3 << EOF
import socket
import sys

host = "$DB_HOST"
port = int("$DB_PORT")

for i in range(60):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex((host, port))
    sock.close()
    if result == 0:
        print(f"Database is ready on port {port}")
        sys.exit(0)
    print(f"Waiting for database... ({i+1}/60)")
    import time
    time.sleep(2)

print("ERROR: Database did not become ready in time")
sys.exit(1)
EOF

echo "Database is ready. Running schema..."

# Run the schema using Python
python3 << EOF
import psycopg2

conn = psycopg2.connect(
    host="$DB_HOST",
    port="$DB_PORT",
    dbname="$DB_NAME",
    user="$DB_USER",
    password="$DB_PASSWORD"
)
conn.autocommit = True
cur = conn.cursor()

with open('/app/ai_schema.sql', 'r') as f:
    sql = f.read()
    cur.execute(sql)

cur.close()
conn.close()
print("Database schema initialized successfully!")
EOF

