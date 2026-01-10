#!/bin/bash
set -e
PASSWORD="9804409636Aa@themaninthemooN"
echo "=== GoDam Server Cleanup ==="
echo ""

echo "Step 1: Checking backend status..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@72.61.245.23 "docker logs godam-backend --tail 30"
echo ""

echo "Step 2: Stopping godam-sql container (not needed - using SQLite)..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@72.61.245.23 "docker stop godam-sql && docker rm godam-sql"
echo ""

echo "Step 3: Current containers after cleanup:"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@72.61.245.23 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""

echo "Step 4: Checking if godam.db exists..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@72.61.245.23 "ls -la /root/*.db 2>/dev/null || echo 'No db files found'"
echo ""

echo "=== Cleanup Complete! ==="

