@echo off
echo 🚀 Starting X-ceed Application Stack...
echo.

echo 🐍 Starting Python RAG Analysis Service...
start /b python simplified_rag_service.py

echo ⏳ Waiting for Python service to initialize...
timeout /t 3 /nobreak >nul

echo 🌐 Starting Next.js Development Server...
start /b npm run dev

echo ⏳ Waiting for Next.js to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Both services should be starting!
echo 🌐 Website: http://localhost:3002
echo 🐍 Python API: http://localhost:8000
echo 📚 Python API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all services...
pause >nul

echo 🛑 Stopping services...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo ✅ Services stopped
