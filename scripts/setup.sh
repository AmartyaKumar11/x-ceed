#!/bin/bash

# Resume Analyzer Setup Script
# This script sets up the Python environment for AI-powered resume analysis

echo "🎯 Setting up Resume Analyzer AI Service"
echo "========================================"

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "✅ Found Python: $($PYTHON_CMD --version)"

# Create virtual environment
echo "📦 Creating virtual environment..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
echo "🔄 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing Python packages..."
pip install -r scripts/requirements.txt

# Download spaCy model
echo "🧠 Downloading spaCy English model..."
python -m spacy download en_core_web_sm

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set up environment variables (optional):"
echo "   - OPENAI_API_KEY: For enhanced AI analysis"
echo "2. Test the analyzer:"
echo "   cd scripts && python resume_analyzer.py '{\"job_description\":\"test\",\"job_title\":\"test\",\"job_requirements\":[],\"resume_path\":\"\",\"user_skills\":[],\"user_id\":\"test\"}'"
echo ""
echo "🚀 Your resume analyzer is ready to use!"
