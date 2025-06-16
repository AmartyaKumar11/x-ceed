#!/bin/bash
# Startup script to run both Python service and Next.js app

echo "🚀 Starting X-ceed Application Stack..."
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    # Kill all background processes
    jobs -p | xargs -r kill
    exit
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Start Python RAG service in background
echo "🐍 Starting Python RAG Analysis Service..."
python simplified_rag_service.py &
PYTHON_PID=$!

# Wait a moment for Python service to start
sleep 3

# Check if Python service is running
if kill -0 $PYTHON_PID 2>/dev/null; then
    echo "✅ Python service started successfully (PID: $PYTHON_PID)"
else
    echo "❌ Failed to start Python service"
    exit 1
fi

# Start Next.js development server
echo "🌐 Starting Next.js Development Server..."
npm run dev &
NEXTJS_PID=$!

# Wait a moment for Next.js to start
sleep 5

if kill -0 $NEXTJS_PID 2>/dev/null; then
    echo "✅ Next.js server started successfully (PID: $NEXTJS_PID)"
else
    echo "❌ Failed to start Next.js server"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Both services are running!"
echo "🌐 Website: http://localhost:3002"
echo "🐍 Python API: http://localhost:8000"
echo "📚 Python API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for services to finish
wait
