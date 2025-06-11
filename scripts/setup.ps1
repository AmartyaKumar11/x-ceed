# Resume Analyzer Setup Script for Windows
# This script sets up the Python environment for AI-powered resume analysis

Write-Host "🎯 Setting up Resume Analyzer AI Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Python is installed
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} else {
    Write-Host "❌ Python is not installed. Please install Python 3.8+ and try again." -ForegroundColor Red
    exit 1
}

$pythonVersion = & $pythonCmd --version
Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green

# Create virtual environment
Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
& $pythonCmd -m venv venv

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "⬆️ Upgrading pip..." -ForegroundColor Yellow
pip install --upgrade pip

# Install requirements
Write-Host "📚 Installing Python packages..." -ForegroundColor Yellow
pip install -r scripts\requirements.txt

# Download spaCy model
Write-Host "🧠 Downloading spaCy English model..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up environment variables (optional):" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY: For enhanced AI analysis" -ForegroundColor Gray
Write-Host "2. Test the analyzer:" -ForegroundColor White
Write-Host '   cd scripts; python resume_analyzer.py "{\"job_description\":\"test\",\"job_title\":\"test\",\"job_requirements\":[],\"resume_path\":\"\",\"user_skills\":[],\"user_id\":\"test\"}"' -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Your resume analyzer is ready to use!" -ForegroundColor Green
