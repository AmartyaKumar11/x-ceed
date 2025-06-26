#!/usr/bin/env python3
"""
Check which jobs have interview applications
"""
import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def check_interview_job_links():
    print("🔍 CHECKING INTERVIEW-JOB LINKS")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI')
        client = MongoClient(mongodb_uri)
        db = client.get_database()
        
        # Get applications with interview status
        interview_apps = list(db.applications.find({"status": "interview"}))
        print(f"📋 Found {len(interview_apps)} interview applications")
        
        for i, app in enumerate(interview_apps, 1):
            print(f"\n{i}. Application ID: {app['_id']}")
            print(f"   Job ID: {app.get('jobId', 'Unknown')}")
            
            # Find the job
            job_id = app.get('jobId')
            if job_id:
                try:
                    # Try as string first
                    job = db.jobs.find_one({"_id": ObjectId(job_id)})
                    if not job:
                        # Try as string ID
                        job = db.jobs.find_one({"_id": job_id})
                    
                    if job:
                        print(f"   ✅ Job found: {job.get('title', 'Unknown')}")
                        print(f"   Recruiter ID: {job.get('recruiterId', 'Unknown')}")
                        print(f"   Posted By: {job.get('postedBy', 'Unknown')}")
                        
                        # Find recruiter
                        recruiter_id = job.get('recruiterId')
                        if recruiter_id:
                            recruiter = db.users.find_one({"_id": ObjectId(recruiter_id)})
                            if recruiter:
                                print(f"   👤 Recruiter: {recruiter.get('name', 'Unknown')} ({recruiter.get('email', 'Unknown')})")
                            else:
                                print(f"   ❌ Recruiter not found for ID: {recruiter_id}")
                    else:
                        print(f"   ❌ Job not found for ID: {job_id}")
                        
                except Exception as e:
                    print(f"   ❌ Error finding job: {str(e)}")
            
            # Show applicant details
            applicant_details = app.get('applicantDetails', {})
            print(f"   👤 Applicant: {applicant_details.get('name', 'Unknown')} ({applicant_details.get('email', 'Unknown')})")
            print(f"   📅 Updated: {app.get('updatedAt', 'Unknown')}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    check_interview_job_links()
