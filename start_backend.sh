#!/bin/bash
echo "Starting AeroSense Backend..."
cd "$(dirname "$0")/backend"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
cd "$(dirname "$0")"
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
