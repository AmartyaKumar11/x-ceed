#!/usr/bin/env python3
"""
Direct MongoDB debug script to check interview data
"""
import os
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def debug_interview_data():
    print("🔍 DIRECT DATABASE DEBUG - INTERVIEW DATA")
    print("=" * 60)
    
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            print("❌ MONGODB_URI not found in environment variables")
            return
            
        client = MongoClient(mongodb_uri)
        db = client.get_database()  # Uses default database from URI
        
        print(f"✅ Connected to MongoDB")
        print(f"📊 Database: {db.name}")
        
        # Check applications collection
        applications = db.applications
        total_apps = applications.count_documents({})
        print(f"📋 Total applications: {total_apps}")        # Check applications with 'interview' status (correct field name)
        interview_apps = list(applications.find({"status": "interview"}))
        print(f"🎯 Applications with 'interview' status: {len(interview_apps)}")
        
        # Let's also check the actual structure of applications
        sample_app = applications.find_one()
        if sample_app:
            print("\n📋 Sample application structure:")
            for key, value in sample_app.items():
                print(f"   {key}: {type(value).__name__} = {str(value)[:100]}")
        
        if interview_apps:
            print("\n📅 Interview Applications Found:")
            for i, app in enumerate(interview_apps, 1):
                print(f"\n{i}. Application ID: {app.get('_id')}")
                print(f"   Applicant: {app.get('applicantName', 'Unknown')}")
                print(f"   Email: {app.get('applicantEmail', 'Unknown')}")
                print(f"   Job ID: {app.get('jobId', 'Unknown')}")
                print(f"   Status: {app.get('applicationStatus', 'Unknown')}")
                print(f"   Interview Date: {app.get('interviewDate', 'Not set')}")
                print(f"   Interview Time: {app.get('interviewTime', 'Not set')}")
                print(f"   Updated: {app.get('updatedAt', 'Unknown')}")
                
                # Get job details
                if app.get('jobId'):
                    job = db.jobs.find_one({"_id": app['jobId']})
                    if job:
                        print(f"   Job Title: {job.get('title', 'Unknown')}")
                        print(f"   Posted By: {job.get('postedBy', 'Unknown')}")
                    else:
                        print(f"   ❌ Job not found for ID: {app['jobId']}")
        else:
            print("\n❌ No applications with 'interview' status found")
              # Check all possible statuses (correct field name)
        print("\n📊 Application Status Distribution:")
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        status_counts = list(applications.aggregate(pipeline))
        for status in status_counts:
            print(f"   {status['_id']}: {status['count']}")
              # Check recent applications (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_apps = list(applications.find({
            "updatedAt": {"$gte": week_ago},
            "status": "interview"
        }))
        print(f"\n🕒 Recent interview applications (last 7 days): {len(recent_apps)}")
          # Check jobs collection
        jobs = db.jobs
        total_jobs = jobs.count_documents({})
        print(f"\n💼 Total jobs: {total_jobs}")
        
        # Sample job to see structure
        sample_job = jobs.find_one()
        if sample_job:
            print("\n💼 Sample job structure:")
            for key, value in sample_job.items():
                if key == 'postedBy':
                    print(f"   {key}: {type(value).__name__} = {str(value)}")
                else:
                    print(f"   {key}: {type(value).__name__} = {str(value)[:50]}")
        
        # Check recruiter IDs
        recruiters = list(jobs.distinct("postedBy"))
        print(f"\n👥 Unique recruiter IDs: {len(recruiters)}")
        print("📝 Sample recruiter IDs:")
        for rid in recruiters[:5]:
            print(f"   {rid}")
            
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    debug_interview_data()
