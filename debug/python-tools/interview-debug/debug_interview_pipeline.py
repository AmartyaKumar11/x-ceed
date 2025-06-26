#!/usr/bin/env python3

from pymongo import MongoClient
from bson import ObjectId
import json

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['x-ceed']

print("=== DETAILED DEBUG: Upcoming Interviews Data Matching ===\n")

# 1. Find a recruiter
print("1. Finding recruiters...")
recruiters = list(db.users.find({"role": "recruiter"}))
print(f"   Total recruiters: {len(recruiters)}")

if not recruiters:
    print("❌ No recruiters found!")
    exit(1)

recruiter = recruiters[0]
recruiter_id = str(recruiter['_id'])
print(f"   Using recruiter: {recruiter.get('name', 'Unknown')} (ID: {recruiter_id})")

# 2. Find jobs for this recruiter
print(f"\n2. Finding jobs for recruiter {recruiter_id}...")
jobs = list(db.jobs.find({"recruiterId": recruiter_id}))
print(f"   Jobs found: {len(jobs)}")

if not jobs:
    print("❌ No jobs found for this recruiter!")
    print("   Let's check what recruiter IDs exist in jobs...")
    sample_jobs = list(db.jobs.find({}).limit(5))
    for i, job in enumerate(sample_jobs):
        print(f"   Job {i+1}: recruiterId = {job.get('recruiterId')} (type: {type(job.get('recruiterId'))})")
    exit(1)

job_ids = [job['_id'] for job in jobs]
print(f"   Job IDs: {[str(job_id) for job_id in job_ids[:3]]}...")

# 3. Find all interview applications
print(f"\n3. Finding interview applications...")
interview_apps = list(db.applications.find({"status": "interview"}))
print(f"   Total interview applications: {len(interview_apps)}")

if not interview_apps:
    print("❌ No interview applications found!")
    # Check what statuses exist
    statuses = db.applications.distinct("status")
    print(f"   Available statuses: {statuses}")
    exit(1)

# 4. Check application-job matching
print(f"\n4. Checking application-job matching...")
matching_apps = []

for i, app in enumerate(interview_apps):
    app_job_id = app.get('jobId')
    print(f"   App {i+1}: jobId = {app_job_id} (type: {type(app_job_id)})")
    
    # Try different matching methods
    matches = False
    
    # Method 1: Direct ObjectId comparison
    if app_job_id in job_ids:
        matches = True
        print(f"     ✓ Direct ObjectId match")
    
    # Method 2: String comparison
    elif str(app_job_id) in [str(job_id) for job_id in job_ids]:
        matches = True
        print(f"     ✓ String comparison match")
    
    # Method 3: Convert app_job_id to ObjectId and compare
    elif isinstance(app_job_id, str):
        try:
            app_job_id_obj = ObjectId(app_job_id)
            if app_job_id_obj in job_ids:
                matches = True
                print(f"     ✓ String->ObjectId conversion match")
        except:
            pass
    
    if matches:
        matching_apps.append(app)
        print(f"     📋 Application details:")
        print(f"         - ID: {app['_id']}")
        print(f"         - Applicant: {app.get('applicantDetails', {}).get('name', 'Unknown')}")
        print(f"         - Updated: {app.get('updatedAt', 'Unknown')}")
    else:
        print(f"     ❌ No match found")

print(f"\n   Matching applications: {len(matching_apps)}")

# 5. Check applicant details in matching applications
print(f"\n5. Checking applicant details...")
for i, app in enumerate(matching_apps):
    print(f"   App {i+1}:")
    print(f"     - applicantId: {app.get('applicantId')} (type: {type(app.get('applicantId'))})")
    
    # Check if applicant exists in users collection
    applicant_id = app.get('applicantId')
    if applicant_id:
        try:
            if isinstance(applicant_id, str):
                applicant_id = ObjectId(applicant_id)
            applicant = db.users.find_one({"_id": applicant_id})
            if applicant:
                print(f"     ✓ Applicant found: {applicant.get('name', 'Unknown')}")
            else:
                print(f"     ❌ Applicant not found in users collection")
        except Exception as e:
            print(f"     ❌ Error finding applicant: {e}")
    
    # Check applicantDetails field
    applicant_details = app.get('applicantDetails', {})
    if applicant_details:
        print(f"     ✓ applicantDetails: {applicant_details.get('name', 'No name')}")
    else:
        print(f"     ❌ No applicantDetails field")

# 6. Simulate the aggregation pipeline manually
print(f"\n6. Simulating aggregation pipeline...")
print("   Step 1: Match applications with status 'interview' ✓")
print(f"   Step 2: Found {len(interview_apps)} interview applications")
print(f"   Step 3: Job lookup would find {len(matching_apps)} matches")
print(f"   Step 4: Applicant lookup...")

final_results = []
for app in matching_apps:
    # Find the matching job
    app_job_id = app.get('jobId')
    matching_job = None
    
    for job in jobs:
        if (job['_id'] == app_job_id or 
            str(job['_id']) == str(app_job_id) or 
            (isinstance(app_job_id, str) and job['_id'] == ObjectId(app_job_id))):
            matching_job = job
            break
    
    if matching_job:
        # Find the applicant
        applicant_id = app.get('applicantId')
        applicant = None
        if applicant_id:
            try:
                if isinstance(applicant_id, str):
                    applicant_id = ObjectId(applicant_id)
                applicant = db.users.find_one({"_id": applicant_id})
            except:
                pass
        
        result = {
            "application_id": str(app['_id']),
            "job_title": matching_job.get('title', 'Unknown'),
            "applicant_name": (app.get('applicantDetails', {}).get('name') or 
                              (applicant.get('name') if applicant else 'Unknown')),
            "has_interview_date": bool(app.get('interviewDate')),
            "updated_at": app.get('updatedAt')
        }
        final_results.append(result)

print(f"   Final pipeline results: {len(final_results)}")
for i, result in enumerate(final_results):
    print(f"     Result {i+1}: {result}")

print(f"\n=== DEBUG COMPLETE ===")
print(f"Expected API response: {len(final_results)} interviews")
