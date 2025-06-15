# X-ceed Python RAG Service Startup Script
Write-Host "🚀 Starting X-ceed Python RAG Service..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv_rag")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv_rag
}

Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& "venv_rag\Scripts\Activate.ps1"

Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements-fastapi-rag.txt

Write-Host "🐍 Starting FastAPI service..." -ForegroundColor Green
Write-Host "📊 API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API docs will be available at: http://localhost:8000/docs" -ForegroundColor Cyan

python fastapi_rag_service.py
