Write-Host "🚀 Starting Video AI Service with LangChain..." -ForegroundColor Green

# Check if Python is installed
try {
    python --version | Out-Null
    Write-Host "✅ Python is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed. Please install Python 3.8 or higher." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv-video-ai")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv-video-ai
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& "venv-video-ai\Scripts\Activate.ps1"

# Install requirements
Write-Host "📥 Installing requirements..." -ForegroundColor Yellow
pip install -r requirements-video-ai.txt

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found. Please create it with your API keys." -ForegroundColor Red
    Write-Host "Required environment variables:" -ForegroundColor Yellow
    Write-Host "- GEMINI_API_KEY" -ForegroundColor Yellow
    Write-Host "- YOUTUBE_API_KEY (optional)" -ForegroundColor Yellow
    Write-Host "- OPENAI_API_KEY (optional)" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the service
Write-Host "🎬 Starting Video AI Service on http://localhost:8001" -ForegroundColor Green
Write-Host "Available endpoints:" -ForegroundColor Cyan
Write-Host "- POST /chat - Main chat interface" -ForegroundColor Cyan
Write-Host "- GET /video-context/{video_id} - Get video analysis" -ForegroundColor Cyan
Write-Host "- POST /generate-notes - Generate video notes" -ForegroundColor Cyan
Write-Host "- POST /suggest-clips - Get video clips" -ForegroundColor Cyan
Write-Host "- GET /health - Health check" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow

python video_ai_service.py
