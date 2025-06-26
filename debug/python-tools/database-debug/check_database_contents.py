"""
Check what's actually in the database - all collections
"""
from pymongo import MongoClient
import json

def check_database_contents():
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x_ceed']
    
    print("📊 DATABASE CONTENTS OVERVIEW")
    print("=" * 60)
    
    # Check all collections
    collections = db.list_collection_names()
    print(f"Collections: {collections}")
    print()
    
    # Check applications
    print("1️⃣ APPLICATIONS:")
    apps = list(db.applications.find().limit(5))
    print(f"   Total count: {db.applications.count_documents({})}")
    if apps:
        print("   Sample applications:")
        for app in apps:
            print(f"   - ID: {app['_id']}")
            print(f"     Status: {app.get('status', 'N/A')}")
            print(f"     Job ID: {app.get('jobId', 'N/A')}")
            print(f"     Candidate ID: {app.get('candidateId', 'N/A')}")
            print(f"     Interview Date: {app.get('interviewDate', 'N/A')}")
            print()
        
        # Check all unique statuses
        statuses = db.applications.distinct('status')
        print(f"   All status values: {statuses}")
    else:
        print("   No applications found")
    print()
    
    # Check jobs
    print("2️⃣ JOBS:")
    jobs = list(db.jobs.find().limit(5))
    print(f"   Total count: {db.jobs.count_documents({})}")
    if jobs:
        print("   Sample jobs:")
        for job in jobs:
            print(f"   - ID: {job['_id']}")
            print(f"     Title: {job.get('title', 'N/A')}")
            print(f"     Recruiter ID: {job.get('recruiterId', 'N/A')}")
            print(f"     Posted By: {job.get('postedBy', 'N/A')}")
            print()
    else:
        print("   No jobs found")
    print()
    
    # Check users
    print("3️⃣ USERS:")
    users = list(db.users.find().limit(5))
    print(f"   Total count: {db.users.count_documents({})}")
    if users:
        print("   Sample users:")
        for user in users:
            print(f"   - ID: {user['_id']}")
            print(f"     Name: {user.get('name', 'N/A')}")
            print(f"     Email: {user.get('email', 'N/A')}")
            print(f"     Role: {user.get('role', 'N/A')}")
            print()
        
        # Find recruiters specifically
        recruiters = list(db.users.find({'role': 'recruiter'}))
        print(f"   Recruiters: {len(recruiters)}")
        for recruiter in recruiters:
            print(f"   - Recruiter ID: {recruiter['_id']}")
            print(f"     Name: {recruiter.get('name', 'N/A')}")
            print(f"     Email: {recruiter.get('email', 'N/A')}")
            print()
    else:
        print("   No users found")
    
    client.close()

if __name__ == "__main__":
    check_database_contents()
