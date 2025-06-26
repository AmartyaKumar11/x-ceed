"""
Find the recruiter ID for amartya2@gmail.com
"""
from pymongo import MongoClient

def find_recruiter_id():
    # Connect to MongoDB with correct database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x-ceed-db']
    
    print("🔍 FINDING RECRUITER ID FOR amartya2@gmail.com")
    print("=" * 60)
    
    # Find user by email
    user = db.users.find_one({'email': 'amartya2@gmail.com'})
    
    if user:
        print(f"✅ Found user:")
        print(f"   ID: {user['_id']}")
        print(f"   Name: {user.get('name', 'N/A')}")
        print(f"   Email: {user.get('email', 'N/A')}")
        print(f"   Role: {user.get('role', 'N/A')}")
        
        # Check jobs for this recruiter
        recruiter_id = str(user['_id'])
        jobs = list(db.jobs.find({'recruiterId': recruiter_id}))
        print(f"\n📋 Jobs for this recruiter: {len(jobs)}")
        for job in jobs:
            print(f"   - {job.get('title', 'N/A')} (ID: {job['_id']})")
        
        # Check applications for these jobs
        if jobs:
            job_ids = [job['_id'] for job in jobs]
            job_ids_str = [str(job_id) for job_id in job_ids]
            
            # Find applications with interview status for these jobs
            interview_apps = list(db.applications.find({
                'status': 'interview',
                '$or': [
                    {'jobId': {'$in': job_ids}},
                    {'jobId': {'$in': job_ids_str}}
                ]
            }))
            
            print(f"\n📅 Interview applications for this recruiter: {len(interview_apps)}")
            for app in interview_apps:
                print(f"   - App ID: {app['_id']}")
                print(f"     Job ID: {app.get('jobId')}")
                print(f"     Interview Date: {app.get('interviewDate', 'N/A')}")
                print(f"     Location: {app.get('interviewLocation', 'N/A')}")
                print()
        
        client.close()
        return str(user['_id'])
    else:
        print("❌ User not found with email amartya2@gmail.com")
        
        # Show all users to see what's available
        print("\n🔍 All users in database:")
        users = list(db.users.find().limit(10))
        for user in users:
            print(f"   - ID: {user['_id']}, Email: {user.get('email', 'N/A')}, Role: {user.get('role', 'N/A')}")
        
        client.close()
        return None

if __name__ == "__main__":
    recruiter_id = find_recruiter_id()
    if recruiter_id:
        print(f"\n🎯 Use this recruiter ID: {recruiter_id}")
    else:
        print("\n❌ Could not find recruiter ID")
