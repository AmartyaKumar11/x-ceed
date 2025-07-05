# Development Environment Setup Guide

## Quick Start 🚀

### Option 1: Start Everything at Once (Recommended)
```bash
npm run dev:full
```
This will start all Python services + Next.js frontend in one command!

### Option 2: Safe Start with Pre-flight Check
```bash
npm run dev:safe
```
This runs a pre-flight check first, then starts everything if all dependencies are ready.

### Option 3: Check System Before Starting
```bash
npm run dev:check
```
Run this to verify all dependencies and files are ready before starting services.

## What `dev:full` Starts 📋

When you run `npm run dev:full`, the following services will start:

| Service | Port | Purpose | Command |
|---------|------|---------|---------|
| **RAG Service** | 8000 | Resume analysis & chat | `npm run python` |
| **Video AI Service** | 8002 | Video learning analysis | `npm run video-ai` |
| **Gemini Chat Service** | 8003 | AI chat functionality | `npm run gemini-chat` |
| **AI Resume Service** | 8004 | Resume processing | `npm run ai-service` |
| **Job Description Service** | 8008 | Mock interview & job parsing | `npm run job-desc-service` |
| **Next.js Frontend** | 3002 | Web application | `npm run dev` |

## Prerequisites ✅

### Required Software
- **Python 3.8+** - [Download here](https://python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Uvicorn** - Install with: `pip install uvicorn[standard]`

### Required Python Packages
```bash
pip install fastapi uvicorn pdfplumber pymongo requests python-dotenv google-generativeai youtube-transcript-api
```

### Required Node.js Packages
```bash
npm install
```

## Environment Setup 🔐

1. **Copy Environment Template:**
   ```bash
   cp env.local.template .env.local
   ```

2. **Add Your API Keys to `.env.local`:**
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here
   MONGODB_URI=mongodb://localhost:27017/
   ```

## Testing Your Setup 🧪

### Complete System Test
```bash
node test-mock-interview-setup.js
```
This will test all services and report what's working.

### Pre-flight Check Only
```bash
npm run dev:check
```
This checks dependencies without starting services.

## Troubleshooting 🛠️

### Common Issues & Solutions

#### "Python not found"
- Install Python from https://python.org/downloads/
- Make sure Python is in your PATH
- Try `python --version` in terminal

#### "Uvicorn not found"
```bash
pip install uvicorn[standard] fastapi
```

#### "node_modules not found"
```bash
npm install
```

#### "Port already in use"
- Check what's running on the port: `netstat -ano | findstr :8000`
- Kill the process or change the port in the service file

#### Services won't start
1. Run pre-flight check: `npm run dev:check`
2. Check individual service: `npm run job-desc-service`
3. Check Python service files exist in `services/python/`

### Individual Service Commands

If `dev:full` has issues, start services individually:

```bash
# Start Python services individually
npm run python          # RAG Service (port 8000)
npm run video-ai         # Video AI (port 8002) 
npm run gemini-chat      # Gemini Chat (port 8003)
npm run ai-service       # AI Resume (port 8004)
npm run job-desc-service # Job Description (port 8008)

# Start frontend
npm run dev              # Next.js (port 3002)
```

## Development Workflow 📋

### 1. Daily Development
```bash
npm run dev:full
```
Starts everything you need for development.

### 2. Testing Changes
```bash
node test-mock-interview-setup.js
```
Verify everything still works after changes.

### 3. Production Build
```bash
npm run build
```
Build the Next.js application for production.

## Service Architecture 🏗️

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Python APIs   │
│   (Next.js)     │◄──►│   (FastAPI)     │
│   Port 3002     │    │   Ports 8000+   │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   External APIs │
│   (Public)      │    │   (OpenRouter)  │
└─────────────────┘    └─────────────────┘
```

## Feature Coverage 🎯

### Mock Interview
- **Job Description Upload** (PDF/TXT) ✅
- **Question Generation** ✅  
- **Speech Recognition** ✅
- **Interview Analysis** ✅
- **Status Monitoring** ✅

### Resume Analysis
- **PDF Resume Upload** ✅
- **AI Analysis** ✅
- **Skills Extraction** ✅
- **Improvement Suggestions** ✅

### Video Learning
- **YouTube Integration** ✅
- **Transcript Analysis** ✅
- **Learning Plans** ✅

## Support 🆘

If you encounter issues:

1. **Run the test script:** `node test-mock-interview-setup.js`
2. **Check pre-flight:** `npm run dev:check`  
3. **Start services individually** to isolate problems
4. **Check logs** in the terminal for specific error messages
5. **Verify environment files** have correct API keys

## Performance Tips 💡

- **Use `dev:safe`** for the first run of the day
- **Keep services running** between development sessions
- **Use `Ctrl+C`** to stop all services at once
- **Monitor console output** for any service errors

---

**Happy coding! 🎉**
