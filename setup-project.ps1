# X-ceed Project Setup Script
# Run this after installing Node.js and Python

Write-Host "🚀 Setting up X-ceed project..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Python is installed
Write-Host "🐍 Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install from https://python.org/" -ForegroundColor Red
    exit 1
}

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local file not found. Please update it with your API keys!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Update .env.local with your API keys" -ForegroundColor Cyan
Write-Host "2. Set up MongoDB Atlas (see FACTORY_RESET_SETUP.md)" -ForegroundColor Cyan
Write-Host "3. Run 'npm run dev:full' to start the application" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed instructions, see FACTORY_RESET_SETUP.md" -ForegroundColor Yellow
