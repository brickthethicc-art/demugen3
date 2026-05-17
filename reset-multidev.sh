#!/bin/bash

echo "=== MultiDev Reset Script (Port 5174) ==="
echo "Stopping existing server/client processes..."
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
lsof -ti:5174,5173 | xargs kill -9 2>/dev/null || true

sleep 1

echo "Starting multiplayer server on port 5174..."
pnpm --filter @mugen/server dev &
SERVER_PID=$!

echo "Waiting for port 5174 to become available..."
for _ in {1..40}; do
  if lsof -iTCP:5174 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Port 5174 is listening."
    break
  fi
  sleep 1
done

echo "Starting client in beta mode..."
pnpm --filter @mugen/client dev:beta &
CLIENT_PID=$!

echo ""
echo "=== MultiDev Ready ==="
echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo "Host Dev URL:      http://localhost:5173"
echo "LAN Player URL:    http://<your-local-ip>:5174"
echo "Public Player URL: http://<your-public-ip>:5174"
echo "Health Check: http://<your-public-ip>:5174/health"
echo ""
echo "Note: External players should use the port-5174 URL only after port forwarding 5174/TCP to this machine."
