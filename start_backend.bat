@echo off
echo Starting AeroSense Backend...
cd /d "%~dp0backend"
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
cd /d "%~dp0"
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
