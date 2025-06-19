#!/bin/bash

echo "🚀 Starting Video AI Service with LangChain..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv-video-ai" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv-video-ai
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv-video-ai/bin/activate

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements-video-ai.txt

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it with your API keys."
    echo "Required environment variables:"
    echo "- GEMINI_API_KEY"
    echo "- YOUTUBE_API_KEY (optional)"
    echo "- OPENAI_API_KEY (optional)"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Start the service
echo "🎬 Starting Video AI Service on http://localhost:8001"
echo "Available endpoints:"
echo "- POST /chat - Main chat interface"
echo "- GET /video-context/{video_id} - Get video analysis"
echo "- POST /generate-notes - Generate video notes"
echo "- POST /suggest-clips - Get video clips"
echo "- GET /health - Health check"
echo ""
echo "Press Ctrl+C to stop the service"

python3 video_ai_service.py
