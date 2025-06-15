@echo off
echo 🚀 Starting X-ceed Python RAG Service...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo ✅ Python found

REM Check if virtual environment exists
if not exist "venv_rag" (
    echo 📦 Creating virtual environment...
    python -m venv venv_rag
)

echo 🔄 Activating virtual environment...
call venv_rag\Scripts\activate

echo 📥 Installing dependencies...
pip install -r requirements-fastapi-rag.txt

echo 🐍 Starting FastAPI service...
python fastapi_rag_service.py

pause
