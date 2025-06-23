# AI Candidate Shortlisting Setup Guide

## 🎯 What This Feature Does

The AI Candidate Shortlisting feature uses Google Gemini AI to:
1. **Analyze candidate resumes** against job requirements
2. **Score candidates** on skills, experience, and projects (0-100%)
3. **Rank candidates** from best to worst match
4. **Provide detailed feedback** on strengths and weaknesses
5. **Allow status updates** via dropdown menus (pending → shortlisted → interviewed, etc.)

## 🚀 Setup Instructions

### 1. Prerequisites
- ✅ MongoDB running with job and application data
- ✅ Gemini API key configured in `.env.local`
- ✅ Next.js application running
- ✅ Sample applications with uploaded resumes

### 2. Required Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/x-ceed-db
```

### 3. File Structure Created
```
src/
├── app/api/
│   ├── ai/shortlist-candidates/route.js    # Main AI analysis endpoint
│   └── applications/[id]/status/route.js   # Status update endpoint
├── components/
│   └── AIShortlistButton.jsx               # UI component
└── test_ai_shortlisting.js                 # Test script
```

### 4. How to Test

#### Option A: Via UI (Recommended)
1. Navigate to recruiter dashboard → jobs page
2. Find a job with applications
3. Click the "AI Shortlist" button
4. View ranked candidates with scores
5. Use dropdown menus to update application status

#### Option B: Via Test Script
```bash
# Update test_ai_shortlisting.js with real job ID and token
node test_ai_shortlisting.js
```

### 5. Features

#### 🎯 AI Analysis
- **Skills Matching**: Compares resume skills to job requirements
- **Experience Scoring**: Evaluates relevant work experience
- **Project Assessment**: Reviews project quality and relevance
- **Overall Recommendation**: HIGHLY_RECOMMENDED, RECOMMENDED, CONSIDER, NOT_RECOMMENDED

#### 📊 Candidate Ranking
- Candidates sorted by overall score (highest first)
- Visual score breakdown for skills, experience, projects
- Progress bars and color-coded scores
- Detailed strengths and weaknesses

#### 🔄 Status Management
- Dropdown menus for each candidate
- Status options: pending, under_review, shortlisted, interviewed, rejected
- Real-time status updates
- Visual status indicators

#### 📈 Analytics Dashboard
- Total candidates analyzed
- Strong matches (70%+ score)
- Potential matches (50-69% score)
- Analysis criteria used

## 🔧 API Endpoints

### POST /api/ai/shortlist-candidates
Analyzes all candidates for a job using Gemini AI
```json
{
  "jobId": "job_object_id"
}
```

### PATCH /api/applications/[id]/status
Updates application status
```json
{
  "status": "shortlisted"
}
```

## 🎨 UI Components

### AIShortlistButton
- Gradient blue-purple button
- Loading states with spinner
- Modal dialog with results
- Responsive design

### Candidate Cards
- Ranked display (#1, #2, #3...)
- Score visualization
- Status dropdown
- Contact information
- AI recommendations

## 🛠 Troubleshooting

### Common Issues:
1. **Button appears white**: Fixed - removed conflicting variant
2. **"Cannot read properties of undefined"**: Fixed - added null checks
3. **MongoDB ObjectId errors**: Fixed - proper ObjectId imports
4. **Gemini API errors**: Check API key and rate limits

### Debug Steps:
1. Check browser console for errors
2. Verify MongoDB has sample data
3. Test Gemini API key separately
4. Check server logs for API responses

## 📝 Sample Data Structure

### Job Document
```json
{
  "_id": "job_id",
  "title": "iOS Developer",
  "description": "We're looking for...",
  "requirements": ["Swift", "iOS", "Xcode"]
}
```

### Application Document
```json
{
  "_id": "app_id",
  "jobId": "job_id",
  "name": "John Doe",
  "email": "john@example.com",
  "resumeFilename": "resume.pdf",
  "status": "pending"
}
```

## 🎯 Next Steps

1. **Test with real data**: Add sample jobs and applications
2. **Customize scoring**: Adjust Gemini prompts for specific needs
3. **Add notifications**: Email candidates about status changes
4. **Export results**: Add CSV/PDF export functionality
5. **Interview scheduling**: Integrate calendar booking

The AI shortlisting feature is now ready to use! 🚀
