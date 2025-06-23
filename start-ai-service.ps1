# Install AI service dependencies
Write-Host "🔧 Installing AI service dependencies..." -ForegroundColor Cyan
pip install -r requirements-ai-service.txt

# Check if Gemini API key is set
if (-not $env:GEMINI_API_KEY) {
    Write-Host "⚠️ GEMINI_API_KEY not found in environment variables" -ForegroundColor Yellow
    Write-Host "Please set your Gemini API key in .env.local file" -ForegroundColor Yellow
    Write-Host "Add this line: GEMINI_API_KEY=your_api_key_here" -ForegroundColor Yellow
    Write-Host "Get your free API key at: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "🚀 Starting AI Resume Analysis Service..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:8003" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

python ai_service.py
