#!/bin/bash

echo "=== Stopping Project ==="
echo "Stopping server and client processes..."
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

echo "Clearing ports..."
lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null || true

echo "=== Stopped ==="
