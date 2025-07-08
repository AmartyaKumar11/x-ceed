@echo off
echo 🚀 X-ceed Quick Start Script
echo.

echo 📦 Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo 🐍 Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies
    echo.
    echo 💡 Tip: Make sure Python is installed and added to PATH
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.
echo 📋 Next steps:
echo 1. Update .env.local with your API keys
echo 2. Set up MongoDB Atlas (see FACTORY_RESET_SETUP.md)
echo 3. Run: npm run dev:full
echo.
echo 📖 For detailed instructions, see RECOVERY_CHECKLIST.md
echo.
pause
