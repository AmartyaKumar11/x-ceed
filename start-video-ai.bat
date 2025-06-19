@echo off
echo 🚀 Starting Video AI Service with LangChain...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv-video-ai" (
    echo 📦 Creating virtual environment...
    python -m venv venv-video-ai
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv-video-ai\Scripts\activate.bat

REM Install requirements
echo 📥 Installing requirements...
pip install -r requirements-video-ai.txt

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found. Please create it with your API keys.
    echo Required environment variables:
    echo - GEMINI_API_KEY
    echo - YOUTUBE_API_KEY (optional)
    echo - OPENAI_API_KEY (optional)
    pause
    exit /b 1
)

REM Start the service
echo 🎬 Starting Video AI Service on http://localhost:8001
echo Available endpoints:
echo - POST /chat - Main chat interface
echo - GET /video-context/{video_id} - Get video analysis
echo - POST /generate-notes - Generate video notes
echo - POST /suggest-clips - Get video clips
echo - GET /health - Health check
echo.
echo Press Ctrl+C to stop the service

python video_ai_service.py
