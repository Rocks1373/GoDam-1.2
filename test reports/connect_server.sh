#!/bin/bash
set -e
PASSWORD="9804409636Aa@themaninthemooN"
echo "Connecting to server..."
echo "Password check: ${#PASSWORD} characters"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@72.61.245.23 "whoami && echo 'Connected!' && docker ps --format 'table {{.Names}}\t{{.Status}}'"

