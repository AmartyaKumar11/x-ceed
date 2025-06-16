# X-ceed Resume Analysis - Complete Setup Guide

## 🚀 Quick Start (Everything Together)

Instead of starting services separately, use one of these commands to start both the Python analysis service and the Next.js website:

### Option 1: Using npm (Recommended)
```bash
npm run dev:full
```

### Option 2: Using PowerShell
```bash
npm run start-all
```

### Option 3: Using Batch File
```bash
npm run start-all-simple
```

## 📋 What Each Command Does

### `npm run dev:full`
- Starts both Python RAG service and Next.js website simultaneously
- Shows colored output for each service
- Both services run in the same terminal window
- Press Ctrl+C to stop both services

### `npm run start-all`
- Runs the PowerShell script with health checks
- Monitors both services and shows status
- Automatically checks if services are responding
- More advanced monitoring and cleanup

### `npm run start-all-simple`
- Simple batch file approach
- Starts both services in background
- Press any key to stop all services

## 🔧 Manual Setup (If You Want to Run Separately)

If you prefer to run services separately:

### 1. Start Python Service
```bash
npm run python
# OR
python simplified_rag_service.py
```

### 2. Start Next.js Website (in another terminal)
```bash
npm run dev
# OR
next dev -p 3002
```

## 🌐 Service URLs

When everything is running:
- **Website**: http://localhost:3002
- **Python API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## ✅ Verification

To check if everything is working:

1. **Python Service**: Visit http://localhost:8000/status
   - Should return: `{"ready":true,"active_sessions":0,"groq_configured":true}`

2. **Next.js Website**: Visit http://localhost:3002
   - Should load the X-ceed homepage

3. **Resume Analysis**: Go to resume analysis page
   - Should show "Analysis Failed" if Python service isn't running
   - Should show detailed analysis if both services are running

## 🐛 Troubleshooting

### "Analysis Failed" Error
- **Cause**: Python service isn't running
- **Solution**: Use `npm run dev:full` to start both services

### Port Already in Use
- **Cause**: Previous services still running
- **Solution**: Kill previous processes:
  ```bash
  # Kill Python processes
  taskkill /f /im python.exe
  
  # Kill Node processes
  taskkill /f /im node.exe
  ```

### Python Service Won't Start
- **Cause**: Missing dependencies
- **Solution**: Install Python dependencies:
  ```bash
  pip install fastapi uvicorn groq python-dotenv
  ```

## 🎯 Best Practice

For development, always use:
```bash
npm run dev:full
```

This ensures both services start together and you won't forget to start the Python service!
