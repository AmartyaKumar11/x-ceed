@echo off
echo 🚀 Starting Complete X-ceed Application Stack...
echo.

REM Start Python RAG service in background
echo 🐍 Starting Python RAG Analysis Service (Port 8000)...
start "Python RAG Service" cmd /c "python simplified_rag_service.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Enhanced Video AI service in background  
echo 🎬 Starting Enhanced Video AI Service (Port 8005)...
start "Video AI Service" cmd /c "python video_ai_service_enhanced.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Next.js development server
echo 🌐 Starting Next.js Development Server (Port 3002)...
start "Next.js Server" cmd /c "npm run dev"

REM Wait for services to start
echo ⏳ Waiting for services to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 🎉 Complete X-ceed Application Stack Started!
echo ===========================================
echo 🌐 Main Website: http://localhost:3002
echo 📝 Resume Analysis: http://localhost:3002/resume-analyzer
echo 🎬 Video AI Assistant: http://localhost:3002/video-ai-assistant
echo.
echo 🔧 API Services:
echo 🐍 Python RAG API: http://localhost:8000
echo 📚 RAG API Docs: http://localhost:8000/docs
echo 🎬 Video AI API: http://localhost:8005
echo 📖 Video AI Health: http://localhost:8005/health
echo.
echo 💡 All services are running in separate windows
echo 🎯 Features available:
echo    - Resume analysis with AI-powered insights
echo    - Video AI assistant with transcript-based notes
echo    - Job application tracking and management
echo.
echo 🌐 Opening main website in browser...
timeout /t 2 /nobreak >nul
start http://localhost:3002
echo.
echo ✅ Setup complete! Close this window when done.
pause
