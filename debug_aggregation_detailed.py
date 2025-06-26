"""
Debug script to check the aggregation pipeline step by step
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId
import json

def debug_aggregation_pipeline():
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x_ceed']
    
    recruiter_id = "683b42ead5ddd166187f15cf"
    
    print("🔍 DEBUGGING AGGREGATION PIPELINE")
    print("=" * 60)
    
    # Step 1: Check applications with interview status
    print("1️⃣ Applications with status 'interview':")
    interview_apps = list(db.applications.find({'status': 'interview'}))
    print(f"   Found {len(interview_apps)} applications")
    for app in interview_apps:
        print(f"   - App ID: {app['_id']}")
        print(f"     Job ID: {app.get('jobId')} (type: {type(app.get('jobId'))})")
        print(f"     Interview Date: {app.get('interviewDate')}")
        print(f"     Candidate ID: {app.get('candidateId')}")
        print()
    
    # Step 2: Check jobs for this recruiter
    print("2️⃣ Jobs for recruiter:")
    recruiter_jobs = list(db.jobs.find({'recruiterId': recruiter_id}))
    print(f"   Found {len(recruiter_jobs)} jobs")
    for job in recruiter_jobs:
        print(f"   - Job ID: {job['_id']}")
        print(f"     Title: {job.get('title')}")
        print(f"     Recruiter ID: {job.get('recruiterId')}")
        print()
    
    # Step 3: Manual join - find applications that match recruiter's jobs
    print("3️⃣ Manual join - Applications for recruiter's jobs:")
    recruiter_job_ids = [job['_id'] for job in recruiter_jobs]
    recruiter_job_ids_str = [str(job_id) for job_id in recruiter_job_ids]
    
    matching_apps = []
    for app in interview_apps:
        job_id = app.get('jobId')
        if job_id in recruiter_job_ids or job_id in recruiter_job_ids_str or str(job_id) in recruiter_job_ids_str:
            matching_apps.append(app)
            print(f"   ✅ Match found: App {app['_id']} -> Job {job_id}")
    
    print(f"   Found {len(matching_apps)} matching applications")
    
    # Step 4: Check date filter
    print("4️⃣ Date filtering:")
    current_date = datetime.now()
    future_date = current_date + timedelta(days=30)
    print(f"   Current date: {current_date}")
    print(f"   Filter date (30 days): {future_date}")
    
    date_filtered_apps = []
    for app in matching_apps:
        interview_date_str = app.get('interviewDate')
        if interview_date_str:
            try:
                # Parse the date string
                interview_date = datetime.fromisoformat(interview_date_str.replace('Z', '+00:00'))
                print(f"   App {app['_id']}: Interview date {interview_date}")
                if current_date <= interview_date <= future_date:
                    date_filtered_apps.append(app)
                    print(f"     ✅ Within date range")
                else:
                    print(f"     ❌ Outside date range")
            except Exception as e:
                print(f"     ❌ Error parsing date: {e}")
        else:
            print(f"   App {app['_id']}: No interview date")
    
    print(f"   {len(date_filtered_apps)} applications pass date filter")
    
    # Step 5: Test the actual aggregation pipeline
    print("5️⃣ Testing actual aggregation pipeline:")
    
    pipeline = [
        {
            '$match': {
                'status': 'interview',
                'interviewDate': {'$exists': True}
            }
        },
        {
            '$addFields': {
                'jobIdObj': {
                    '$cond': {
                        'if': {'$type': '$jobId'},
                        'then': {'$toObjectId': '$jobId'},
                        'else': '$jobId'
                    }
                }
            }
        },
        {
            '$lookup': {
                'from': 'jobs',
                'localField': 'jobIdObj',
                'foreignField': '_id',
                'as': 'job'
            }
        },
        {
            '$unwind': '$job'
        },
        {
            '$match': {
                'job.recruiterId': recruiter_id,
                'interviewDate': {
                    '$gte': current_date.isoformat(),
                    '$lte': future_date.isoformat()
                }
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'candidateId',
                'foreignField': '_id',
                'as': 'candidate'
            }
        },
        {
            '$unwind': '$candidate'
        },
        {
            '$project': {
                'jobTitle': '$job.title',
                'candidateName': '$candidate.name',
                'candidateEmail': '$candidate.email',
                'interviewDate': 1,
                'status': 1
            }
        }
    ]
    
    try:
        result = list(db.applications.aggregate(pipeline))
        print(f"   Aggregation result: {len(result)} interviews")
        for interview in result:
            print(f"   - {interview}")
    except Exception as e:
        print(f"   ❌ Aggregation error: {e}")
    
    client.close()

if __name__ == "__main__":
    debug_aggregation_pipeline()
