#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
echo "=== Saman Neon Rug War Next ==="
if [ ! -d node_modules ]; then
  npm install
fi
IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
echo "Local: http://localhost:3000"
if [ -n "$IP" ]; then echo "Network: http://$IP:3000"; fi
npm run dev
