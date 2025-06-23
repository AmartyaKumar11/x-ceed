@echo off
echo 🚀 Starting Gemini Resume Chat Service...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found
    echo Please create .env.local with your GEMINI_API_KEY
    pause
    exit /b 1
)

REM Install requirements
echo 📦 Installing Python dependencies...
pip install -r requirements-gemini-chat.txt

echo.
echo 🔑 Checking environment variables...
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
if os.getenv('GEMINI_API_KEY'):
    print('✅ GEMINI_API_KEY found')
else:
    print('❌ GEMINI_API_KEY not found in .env.local')
    exit(1)
"

if errorlevel 1 (
    echo.
    echo Please add GEMINI_API_KEY to your .env.local file
    pause
    exit /b 1
)

echo.
echo 🚀 Starting Gemini Resume Chat Service on port 8001...
echo Press Ctrl+C to stop the service
echo.
python gemini_resume_chat_service.py
