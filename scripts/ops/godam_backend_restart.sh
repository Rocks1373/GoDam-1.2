#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOGIN_SCRIPT="$SCRIPT_DIR/login_ssh.sh"

if [ ! -x "$LOGIN_SCRIPT" ]; then
  chmod +x "$LOGIN_SCRIPT"
fi

cat <<'EOF' | "$LOGIN_SCRIPT"
set -euo pipefail
cd ~/godam-app/backend
if pgrep -f godam-backend.jar >/dev/null 2>&1; then
  echo "Stopping existing backend process..."
  pkill -f godam-backend.jar
  sleep 2
fi
echo "Starting backend..."
nohup java -jar godam-backend.jar > ~/godam-app/logs/backend.log 2>&1 &
echo "Backend restarted (logs -> ~/godam-app/logs/backend.log)."
exit
EOF
