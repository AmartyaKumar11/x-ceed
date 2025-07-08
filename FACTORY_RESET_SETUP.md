# 🔄 Factory Reset Recovery Guide - X-ceed Project

## 📋 Prerequisites Installation

### 1. Install Node.js (if not installed)
- Download from: https://nodejs.org/
- Install the LTS version (recommended)
- Restart terminal after installation

### 2. Install Python
- Download from: https://www.python.org/downloads/
- **Important**: Check "Add Python to PATH" during installation
- Install Python 3.8 or higher
- Restart terminal after installation

### 3. Install Git (if not installed)
- Download from: https://git-scm.com/download/win
- Use default settings during installation

## 🗄️ Database Migration: Local MongoDB → MongoDB Atlas

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for a free account
3. Create a new cluster (use the free M0 tier)
4. Configure network access:
   - Add IP address: `0.0.0.0/0` (allow from anywhere) for development
   - Or add your specific IP address for better security

### Step 2: Create Database User
1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Create username and password (save these!)
4. Grant "Read and write to any database" permissions

### Step 3: Get Connection String
1. In Atlas dashboard, click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (MongoDB URI)
4. It should look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority`

## 🔑 Environment Variables Setup

You need to obtain these API keys and create your `.env.local` file:

### Required API Keys:

1. **Gemini API Key** (Google AI)
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Create new API key

2. **OpenRouter API Key** (for Mock Interview)
   - Go to: https://openrouter.ai/keys
   - Sign up and create API key
   - Starts with `sk-or-`

3. **Adzuna API** (for Job Search)
   - Go to: https://developer.adzuna.com/overview
   - Sign up for free account
   - Get App ID and App Key

4. **Groq API Key** (for LLM Operations)
   - Go to: https://console.groq.com/keys
   - Sign up for free account
   - Create new API key
   - Starts with `gsk_`

5. **Gmail App Password** (for email functionality)
   - Enable 2-factor authentication on Gmail
   - Go to Google Account settings → Security → App passwords
   - Generate app password for "Mail"

## 📁 Project Setup Commands

Run these commands in order:

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Create Environment File
Copy the template and fill in your values:
```bash
copy env.local.template env.local
```

## 🛠️ Configuration Files to Update

### Update `.env.local` with your values:
```env
# MongoDB Atlas Connection (replace with your Atlas URI)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/x-ceed-db?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3002

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# File Upload
UPLOAD_DIR=./public/uploads

# AI Services - Gemini
GEMINI_API_KEY=your-gemini-api-key-here
AI_SERVICE_URL=http://localhost:8003
AI_SERVICE_PORT=8003

# OpenRouter API for Mock Interview
OPENROUTER_API_KEY=sk-or-your-openrouter-key-here

# Groq API for LLM Operations
GROQ_API_KEY=gsk-your-groq-api-key-here

# Adzuna Job Search API
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here
```

## 🚀 Starting the Application

### Method 1: Start Everything at Once (Recommended)
```bash
npm run dev:full
```

### Method 2: Start Services Separately
Terminal 1 - Python Services:
```bash
npm run python-all-ps
```

Terminal 2 - Next.js Frontend:
```bash
npm run dev
```

## ✅ Verification Steps

1. **Check Python Services**: 
   - RAG Service: http://localhost:8000/docs
   - Video AI: http://localhost:8002/docs
   - AI Service: http://localhost:8004/docs
   - Gemini Chat: http://localhost:8003/docs

2. **Check Frontend**: http://localhost:3002

3. **Check Database Connection**: The app should connect to MongoDB Atlas automatically

## 🔧 Troubleshooting

### Common Issues:

1. **Python not found**:
   - Reinstall Python with "Add to PATH" checked
   - Restart terminal/VS Code

2. **Module not found**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Port already in use**:
   - Kill processes: `npx kill-port 3002 8000 8002 8003 8004`

4. **MongoDB connection failed**:
   - Check your Atlas connection string
   - Verify network access settings in Atlas
   - Ensure database user has correct permissions

## 📊 Database Migration Notes

Since you're moving from local MongoDB to Atlas:
- Your existing data will need to be migrated if you want to keep it
- The app will automatically create new collections in Atlas when you start using it
- All your existing features should work the same way

## 🎯 Next Steps After Setup

1. Test all features:
   - Resume upload and analysis
   - Job search functionality
   - Mock interview feature
   - User authentication

2. Consider setting up:
   - Backup strategies for your Atlas database
   - Environment-specific configurations
   - Production deployment settings

Need help with any specific step? Let me know!
