#!/usr/bin/env python3
"""
Get recruiter ID from the database to test the API
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def get_recruiter_info():
    print("🔍 FINDING RECRUITER INFO")
    print("=" * 40)
    
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI')
        client = MongoClient(mongodb_uri)
        db = client.get_database()
        
        # Get recruiters from users collection
        users = db.users
        recruiters = list(users.find({"userType": "recruiter"}))
        print(f"👥 Found {len(recruiters)} recruiters:")
        
        for i, recruiter in enumerate(recruiters, 1):
            print(f"\n{i}. Recruiter ID: {recruiter['_id']}")
            print(f"   Name: {recruiter.get('name', 'Unknown')}")
            print(f"   Email: {recruiter.get('email', 'Unknown')}")
            
            # Check jobs for this recruiter
            jobs = list(db.jobs.find({"recruiterId": str(recruiter['_id'])}))
            print(f"   Jobs posted: {len(jobs)}")
            
            if jobs:
                for job in jobs[:2]:  # Show first 2 jobs
                    print(f"     - {job.get('title', 'Unknown')} (ID: {job['_id']})")
                    
                    # Check applications for this job
                    apps = list(db.applications.find({"jobId": str(job['_id'])}))
                    interview_apps = [app for app in apps if app.get('status') == 'interview']
                    print(f"       Applications: {len(apps)}, Interviews: {len(interview_apps)}")
        
        if recruiters:
            print(f"\n💡 Use this recruiter ID to test: {recruiters[0]['_id']}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    get_recruiter_info()
