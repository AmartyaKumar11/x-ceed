# 📋 Post-Factory Reset Checklist

## ✅ Software Installation Status
- [ ] Node.js installed (v18 or higher recommended)
- [ ] Python installed (v3.8 or higher)
- [ ] Git installed
- [ ] VS Code or preferred editor installed

## ✅ Project Dependencies
- [ ] Run: `npm install` ✅
- [ ] Run: `pip install -r requirements.txt` ✅

## ✅ MongoDB Atlas Setup
- [ ] Created MongoDB Atlas account
- [ ] Created free cluster
- [ ] Added database user with read/write permissions
- [ ] Configured network access (0.0.0.0/0 for development)
- [ ] Copied connection string
- [ ] Updated MONGODB_URI in .env.local

## ✅ API Keys Required

### 🤖 Gemini AI (Google)
- [ ] Go to: https://makersuite.google.com/app/apikey
- [ ] Create API key
- [ ] Add to .env.local as GEMINI_API_KEY

### 🎭 OpenRouter (Mock Interview)
- [ ] Go to: https://openrouter.ai/keys
- [ ] Create account and API key
- [ ] Add to .env.local as OPENROUTER_API_KEY

### 🧠 Groq (LLM Operations)
- [ ] Go to: https://console.groq.com/keys
- [ ] Create account and API key (starts with gsk_)
- [ ] Add to .env.local as GROQ_API_KEY

### 💼 Adzuna (Job Search)
- [ ] Go to: https://developer.adzuna.com/overview
- [ ] Get App ID and App Key
- [ ] Add to .env.local as ADZUNA_APP_ID and ADZUNA_APP_KEY

### 📧 Gmail (Email functionality)
- [ ] Enable 2FA on Gmail
- [ ] Generate App Password in Google Account Security
- [ ] Add to .env.local as EMAIL_USER and EMAIL_PASS

## ✅ Environment Configuration
- [ ] .env.local file created from template
- [ ] All API keys added
- [ ] MongoDB Atlas URI configured
- [ ] JWT_SECRET set to a strong random value

## ✅ Application Testing

### 🚀 Start Services
```bash
npm run dev:full
```

### 🌐 Verify URLs
- [ ] Frontend: http://localhost:3002
- [ ] RAG Service: http://localhost:8000/docs
- [ ] Video AI: http://localhost:8002/docs
- [ ] AI Service: http://localhost:8004/docs
- [ ] Gemini Chat: http://localhost:8003/docs
- [ ] Job Description: http://localhost:8008/docs

### 🧪 Test Core Features
- [ ] User registration/login works
- [ ] Resume upload and analysis
- [ ] Job search functionality
- [ ] Mock interview feature
- [ ] Email notifications
- [ ] File uploads to MongoDB Atlas

## ✅ Development Setup
- [ ] Install VS Code extensions (optional):
  - Python
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Auto Rename Tag
  - Prettier

## 🔧 Quick Commands Reference

### Start Everything
```bash
npm run dev:full
```

### Individual Services
```bash
# Python services only
npm run python-all-ps

# Frontend only
npm run dev

# Individual Python services
npm run python      # RAG service
npm run video-ai    # Video AI service
npm run ai-service  # AI service
npm run gemini-chat # Gemini chat service
```

### Troubleshooting
```bash
# Kill all ports if stuck
npx kill-port 3002 8000 8002 8003 8004 8008

# Reinstall dependencies
npm ci
pip install -r requirements.txt --force-reinstall
```

## 🎯 Success Indicators

When everything is working correctly, you should see:
1. ✅ All 6 services starting without errors
2. ✅ MongoDB Atlas connection successful logs
3. ✅ Frontend loads at localhost:3002
4. ✅ API documentation accessible at all /docs endpoints
5. ✅ No CORS or authentication errors in browser console

## 📞 Need Help?

If you encounter issues:
1. Check the detailed guide in `FACTORY_RESET_SETUP.md`
2. Verify all environment variables are set correctly
3. Ensure all services start without errors
4. Check browser console for frontend errors
5. Verify MongoDB Atlas network access and user permissions

## 🔄 Database Migration from Local to Atlas

Your application is already configured for this transition:
- No code changes needed
- Simply update MONGODB_URI in .env.local
- All existing functionality will work with Atlas
- Atlas provides better reliability and scaling
