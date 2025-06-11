# Debugging "Application Not Found" Issue

## Problem
When clicking "Schedule Interview" button, getting "Application not found" error.

## Debugging Steps Taken

### 1. Added Debugging Logs
- ✅ Added logs to InterviewSchedulingDialog to show candidate data
- ✅ Added logs to handleScheduleInterview to show request data  
- ✅ Added logs to schedule-interview API to show received data
- ✅ Added logs to database queries

### 2. Fixed Database Connection
- ✅ Changed `db.client.db()` to `db.client.db('x-ceed-db')` for consistency
- ✅ Ensured same database name across all APIs

### 3. Data Flow Analysis
```
Recruiter Jobs Page → candidateForInterview (has candidate._id)
                   ↓
InterviewSchedulingDialog → uses candidate._id as applicationId  
                         ↓
handleScheduleInterview → sends applicationId to API
                       ↓
schedule-interview API → searches for application with _id: applicationId
```

### 4. Current Debugging Output Expected
When testing, we should see:
1. **Frontend logs** (browser console):
   - "Found candidate for interview: [candidate object]"
   - "Interview data being sent: [interview data]"
   - "Application ID: [ID value]"

2. **Backend logs** (terminal/server):
   - "Schedule interview request body: [request body]"
   - "Application ID received: [ID]"
   - "ObjectId is valid: true/false"
   - "Application found: YES/NO"

### 5. Potential Issues to Check
- ❓ **ID Mismatch**: candidate._id might not be application ID
- ❓ **Data Type**: ID might be string vs ObjectId
- ❓ **Database**: Wrong collection or database name
- ❓ **Auth**: Recruiter permissions for the job

### 6. Test Steps
1. Login as recruiter
2. Go to Jobs dashboard  
3. Click "View Candidates" on a job
4. Change application status to "Interview"
5. Fill interview dialog and submit
6. Check browser console + server logs

### 7. Next Actions if Still Failing
- [ ] Check applications collection directly in MongoDB
- [ ] Verify candidate data structure from API response
- [ ] Test with a known good application ID
- [ ] Check if recruiter owns the job being scheduled

## Expected Behavior
- Interview dialog opens correctly ✅  
- Dropdowns work properly ✅
- Form validation works ✅
- API call succeeds and finds application ❌ (currently failing)
- Email notification sent ❌ (depends on above)
- Application status updated ❌ (depends on above)

## Current Status: DEBUGGING
Ready to test with comprehensive logging to identify root cause.
