# 🔄 Fresh Database Setup Guide - Post Factory Reset

## 🎯 **What You Need to Do After Factory Reset**

Since your MongoDB Atlas database is completely fresh, you need to recreate all your data:

### **Step 1: User Registration & Authentication**

1. **Open your application**: http://localhost:3002
2. **Register a new account**:
   - Click "Sign Up" or "Register"
   - Use your email and create a strong password
   - Complete any profile setup forms

3. **Verify registration works**:
   - Check if you can log in successfully
   - This will create the `users` collection in MongoDB Atlas

### **Step 2: Resume Upload & Analysis**

1. **Upload your resume**:
   - Go to the resume upload section
   - Upload a PDF resume file
   - This will create the `resumes` collection

2. **Test AI analysis**:
   - Wait for the Groq API to process your resume
   - Verify the analysis results appear
   - This tests your core AI functionality

### **Step 3: Job Search & Applications**

1. **Browse jobs** (if Adzuna API is configured):
   - Search for jobs in your field
   - This will create the `jobs` collection

2. **Apply to jobs**:
   - Apply to some test jobs
   - This will create the `applications` collection

### **Step 4: Test AI Features**

1. **Gemini Chat**:
   - Try the AI chat feature
   - Ask questions about your resume
   - This tests Gemini API integration

2. **Mock Interview** (if OpenRouter is working):
   - Start a mock interview session
   - This will create the `interviews` collection

### **Step 5: Verify Database Collections**

After completing the above steps, check your MongoDB Atlas:

1. **Go to**: https://cloud.mongodb.com/
2. **Browse Collections** on your cluster
3. **You should see**:
   - `users` (from registration)
   - `resumes` (from uploads)
   - `jobs` (from job searches)
   - `applications` (from job applications)
   - `interviews` (from mock interviews)

## 🔧 **Testing Each Feature Systematically**

### **Test 1: Authentication System**
```
✅ Register new account
✅ Log in successfully  
✅ Access protected routes
✅ Log out functionality
```

### **Test 2: Resume Processing**
```
✅ Upload PDF resume
✅ View resume analysis
✅ See AI-generated insights
✅ Resume stored in database
```

### **Test 3: Job Features**
```
✅ Search for jobs
✅ View job details
✅ Apply to jobs
✅ Track applications
```

### **Test 4: AI Interactions**
```
✅ Chat with Gemini AI
✅ Get resume feedback
✅ Mock interview questions
✅ AI-powered suggestions
```

## 🚨 **What to Watch For**

### **Expected Errors During First Setup:**
- **Empty job list**: Normal until you search/apply
- **No previous data**: Expected with fresh database
- **Slow initial responses**: First API calls may be slower

### **Signs Everything is Working:**
- **Successful user registration**
- **Resume upload without errors**
- **AI responses appear correctly**
- **Data persists after page refresh**

## 📊 **Verify in MongoDB Atlas**

After each major action, you can check Atlas to see:

1. **Users Collection**: Should have your user document
2. **Resumes Collection**: Should have your uploaded resume
3. **Applications Collection**: Should track your job applications
4. **Jobs Collection**: Should cache job search results

## 🎯 **Priority Order for Testing**

1. **🔐 User Registration** (Most Important)
2. **📄 Resume Upload** (Core Feature)
3. **🤖 AI Analysis** (Core Feature) 
4. **💼 Job Search** (If Adzuna configured)
5. **📧 Email Features** (If Gmail configured)
6. **🎭 Mock Interview** (If OpenRouter working)

## 🔍 **Troubleshooting Common Issues**

### **If Registration Fails:**
- Check browser console for errors
- Verify MongoDB connection
- Check JWT_SECRET configuration

### **If Resume Upload Fails:**
- Ensure file is PDF format
- Check file size limits
- Verify upload directory exists

### **If AI Analysis Doesn't Work:**
- Check Groq API key is working
- Look at Python service logs
- Verify API quotas aren't exceeded

## 📱 **Quick Start Commands**

If you need to restart your services:
```bash
npm run dev:full
```

If you need to check service status:
```bash
# Check if all services are running
curl http://localhost:3002      # Frontend
curl http://localhost:8000/docs # RAG Service
curl http://localhost:8003/docs # Gemini Service
```

## 🎉 **Success Indicators**

You'll know everything is working when:
- ✅ You can register and login
- ✅ Resume analysis shows detailed results
- ✅ MongoDB Atlas shows your collections
- ✅ AI features respond correctly
- ✅ Data persists between sessions

Start with user registration first, then work through each feature systematically!
