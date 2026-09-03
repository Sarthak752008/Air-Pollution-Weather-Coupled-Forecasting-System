#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==================================================="
echo "    Stopping AeroSense Services"
echo "==================================================="

if [ -f .backend.pid ]; then
    PID=$(cat .backend.pid)
    kill -9 "$PID" 2>/dev/null || true
    rm -f .backend.pid
    echo "Stopped backend process ($PID)."
fi

if [ -f .frontend.pid ]; then
    PID=$(cat .frontend.pid)
    kill -9 "$PID" 2>/dev/null || true
    rm -f .frontend.pid
    echo "Stopped frontend process ($PID)."
fi

# Fallback: kill by port
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

echo "AeroSense services stopped successfully."
