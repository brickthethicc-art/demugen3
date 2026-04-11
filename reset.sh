#!/bin/bash

echo "=== Project Reset Script ==="
echo "Stopping all processes..."
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

echo "Clearing ports 3000, 3001, 5173..."
lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null || true

echo "Cleaning cache files..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf packages/*/dist 2>/dev/null || true
rm -rf packages/*/node_modules/.vite 2>/dev/null || true

echo "Waiting for processes to fully stop..."
sleep 2

echo "Starting server..."
cd packages/server
pnpm run dev &
SERVER_PID=$!
cd ../..

echo "Waiting for server to start..."
sleep 3

echo "Starting client..."
cd packages/client
pnpm run dev &
CLIENT_PID=$!
cd ../..

echo "=== Reset Complete ==="
echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo "Server: http://localhost:3001"
echo "Client: http://localhost:5173"
echo ""
echo "To stop: ./stop.sh"
echo "To reset again: ./reset.sh"
