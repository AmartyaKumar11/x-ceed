@echo off
echo 🚀 Starting All Python Services for X-ceed...
echo.

REM Start Resume Analysis Service (RAG)
echo 🐍 Starting Resume Analysis Service (Port 8000)...
start "Resume RAG Service" cmd /c "python simplified_rag_service.py"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Enhanced Video AI Service with Transcript
echo 🎬 Starting Video AI Service with Transcript (Port 8005)...
start "Video AI Service" cmd /c "python video_ai_service_enhanced.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

echo.
echo ✅ All Python Services Started!
echo ================================
echo 🐍 Resume Analysis API: http://localhost:8000
echo 📚 Resume API Docs: http://localhost:8000/docs
echo 🎬 Video AI API: http://localhost:8005
echo 📖 Video AI Health: http://localhost:8005/health
echo.
echo 💡 Services are running in separate windows
echo 🎯 Features now available:
echo    ✅ Resume analysis with AI-powered insights
echo    ✅ Video AI assistant with transcript-based notes
echo.
echo Press any key to continue...
pause >nul
