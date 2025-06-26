"""
Check the correct database (x-ceed-db) for interview data
"""
from pymongo import MongoClient
import json

def check_correct_database():
    # Connect to MongoDB with the correct database name
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x-ceed-db']  # Use the correct database name
    
    print("📊 CHECKING CORRECT DATABASE: x-ceed-db")
    print("=" * 60)
    
    # Check all collections
    collections = db.list_collection_names()
    print(f"Collections: {collections}")
    print()
    
    # Check applications with interview status
    print("1️⃣ APPLICATIONS WITH INTERVIEW STATUS:")
    interview_apps = list(db.applications.find({'status': 'interview'}))
    print(f"   Total count: {len(interview_apps)}")
    if interview_apps:
        print("   Interview applications:")
        for app in interview_apps:
            print(f"   - ID: {app['_id']}")
            print(f"     Status: {app.get('status', 'N/A')}")
            print(f"     Job ID: {app.get('jobId', 'N/A')}")
            print(f"     Candidate ID: {app.get('candidateId', 'N/A')}")
            print(f"     Interview Date: {app.get('interviewDate', 'N/A')}")
            print(f"     Interview Location: {app.get('interviewLocation', 'N/A')}")
            print()
    else:
        print("   No interview applications found")
    
    # Check all applications to see what statuses exist
    print("2️⃣ ALL APPLICATION STATUSES:")
    statuses = db.applications.distinct('status')
    print(f"   All status values: {statuses}")
    
    # Count applications by status
    for status in statuses:
        count = db.applications.count_documents({'status': status})
        print(f"   - {status}: {count}")
    print()
    
    # Check jobs
    print("3️⃣ JOBS:")
    jobs = list(db.jobs.find().limit(3))
    print(f"   Total count: {db.jobs.count_documents({})}")
    if jobs:
        print("   Sample jobs:")
        for job in jobs:
            print(f"   - ID: {job['_id']}")
            print(f"     Title: {job.get('title', 'N/A')}")
            print(f"     Recruiter ID: {job.get('recruiterId', 'N/A')}")
            print()
    
    # Check users (recruiters)
    print("4️⃣ RECRUITERS:")
    recruiters = list(db.users.find({'role': 'recruiter'}))
    print(f"   Recruiter count: {len(recruiters)}")
    for recruiter in recruiters:
        print(f"   - Recruiter ID: {recruiter['_id']}")
        print(f"     Name: {recruiter.get('name', 'N/A')}")
        print(f"     Email: {recruiter.get('email', 'N/A')}")
        
        # Find jobs for this recruiter
        recruiter_jobs = list(db.jobs.find({'recruiterId': str(recruiter['_id'])}))
        print(f"     Jobs: {len(recruiter_jobs)}")
        for job in recruiter_jobs:
            print(f"       - {job.get('title', 'N/A')} (ID: {job['_id']})")
        print()
    
    client.close()

if __name__ == "__main__":
    check_correct_database()
