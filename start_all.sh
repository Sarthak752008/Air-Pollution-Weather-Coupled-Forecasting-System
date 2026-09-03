#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==================================================="
echo "    AeroSense: Physics-Guided Air Quality System"
echo "==================================================="
echo ""

if [ ! -d "backend/venv" ]; then
    echo "[1/3] Setting up Python virtual environment..."
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    pip install -r backend/requirements.txt -q
else
    source backend/venv/bin/activate
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "[2/3] Installing frontend dependencies..."
    cd frontend && npm install && cd "$ROOT_DIR"
fi

echo "[3/3] Launching AeroSense services in background..."

# Launch backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Launch frontend
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$ROOT_DIR"

echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "==================================================="
echo "  AeroSense is running!"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://127.0.0.1:8000/docs"
echo ""
echo "  To stop services cleanly, run: ./stop_all.sh"
echo "==================================================="
