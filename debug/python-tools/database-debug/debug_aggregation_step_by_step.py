"""
Test the aggregation pipeline step by step with the correct database
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
import json

def debug_aggregation_step_by_step():
    # Connect to MongoDB with correct database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x-ceed-db']
    
    recruiter_id = "recruiter1"
    
    print("🔍 DEBUGGING AGGREGATION PIPELINE STEP BY STEP")
    print("=" * 60)
    
    # Step 1: Applications with interview status
    print("1️⃣ Applications with interview status:")
    interview_apps = list(db.applications.find({'status': 'interview'}))
    print(f"   Found {len(interview_apps)} applications")
    
    # Step 2: Check which have interview dates
    print("2️⃣ Applications with interview dates:")
    apps_with_dates = []
    for app in interview_apps:
        if app.get('interviewDate'):
            apps_with_dates.append(app)
            print(f"   ✅ App {app['_id']}: {app.get('interviewDate')}")
        else:
            print(f"   ❌ App {app['_id']}: No interview date")
    
    print(f"   {len(apps_with_dates)} have interview dates")
    
    # Step 3: Check job lookup
    print("3️⃣ Job lookup for interview applications:")
    apps_with_jobs = []
    for app in apps_with_dates:
        job_id = app.get('jobId')
        if job_id:
            try:
                # Try both string and ObjectId
                job = None
                if ObjectId.is_valid(job_id):
                    job = db.jobs.find_one({'_id': ObjectId(job_id)})
                if not job:
                    job = db.jobs.find_one({'_id': job_id})
                
                if job:
                    print(f"   ✅ App {app['_id']} -> Job {job['_id']} (Recruiter: {job.get('recruiterId')})")
                    if job.get('recruiterId') == recruiter_id:
                        apps_with_jobs.append((app, job))
                        print(f"      ✅ Matches recruiter!")
                    else:
                        print(f"      ❌ Wrong recruiter: {job.get('recruiterId')} vs {recruiter_id}")
                else:
                    print(f"   ❌ App {app['_id']}: Job {job_id} not found")
            except Exception as e:
                print(f"   ❌ App {app['_id']}: Error looking up job: {e}")
    
    print(f"   {len(apps_with_jobs)} match recruiter's jobs")
    
    # Step 4: Date filtering
    print("4️⃣ Date filtering:")
    current_date = datetime.now()
    future_date = current_date + timedelta(days=30)
    print(f"   Current: {current_date}")
    print(f"   Future:  {future_date}")
    
    date_filtered = []
    for app, job in apps_with_jobs:
        interview_date = app.get('interviewDate')
        if interview_date:
            # Convert to datetime if it's a string
            if isinstance(interview_date, str):
                try:
                    interview_dt = datetime.fromisoformat(interview_date.replace('Z', '+00:00'))
                except:
                    try:
                        interview_dt = datetime.strptime(interview_date, '%Y-%m-%d %H:%M:%S')
                    except:
                        print(f"   ❌ Can't parse date: {interview_date}")
                        continue
            else:
                interview_dt = interview_date
            
            print(f"   App {app['_id']}: Interview at {interview_dt}")
            if current_date <= interview_dt <= future_date:
                date_filtered.append((app, job))
                print(f"      ✅ Within date range")
            else:
                print(f"      ❌ Outside date range")
    
    print(f"   {len(date_filtered)} pass date filter")
    
    # Step 5: Check candidate lookup
    print("5️⃣ Candidate lookup:")
    final_results = []
    for app, job in date_filtered:
        candidate_id = app.get('candidateId') or app.get('applicantId')
        if candidate_id:
            try:
                candidate = None
                if ObjectId.is_valid(candidate_id):
                    candidate = db.users.find_one({'_id': ObjectId(candidate_id)})
                if not candidate:
                    candidate = db.users.find_one({'_id': candidate_id})
                
                if candidate:
                    print(f"   ✅ App {app['_id']}: Found candidate {candidate.get('name', 'N/A')}")
                    final_results.append({
                        'jobTitle': job.get('title'),
                        'candidateName': candidate.get('name'),
                        'candidateEmail': candidate.get('email'),
                        'interviewDate': app.get('interviewDate'),
                        'status': app.get('status')
                    })
                else:
                    print(f"   ❌ App {app['_id']}: Candidate {candidate_id} not found")
            except Exception as e:
                print(f"   ❌ App {app['_id']}: Error looking up candidate: {e}")
        else:
            print(f"   ❌ App {app['_id']}: No candidate ID field")
    
    print(f"   Final results: {len(final_results)}")
    for result in final_results:
        print(f"   - {result}")
    
    client.close()
    return final_results

if __name__ == "__main__":
    debug_aggregation_step_by_step()
