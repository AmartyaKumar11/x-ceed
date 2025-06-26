#!/usr/bin/env python3
"""
Get recruiter IDs and test the updated API
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import json
import requests

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["x-ceed-db"]

def get_recruiter_info():
    print("=== Getting Recruiter Information ===")
    
    # Get applications with status 'interview'
    interview_apps = list(db.applications.find({"status": "interview"}))
    
    recruiter_jobs = {}
    
    for app in interview_apps:
        job_id = app.get('jobId')
        if job_id:
            # Find the job
            job = None
            if isinstance(job_id, str) and ObjectId.is_valid(job_id):
                job = db.jobs.find_one({"_id": ObjectId(job_id)})
            elif isinstance(job_id, ObjectId):
                job = db.jobs.find_one({"_id": job_id})
            
            if job:
                recruiter_id = job.get('recruiterId')
                if recruiter_id:
                    if recruiter_id not in recruiter_jobs:
                        recruiter_jobs[recruiter_id] = {
                            'jobs': [],
                            'interview_applications': []
                        }
                    recruiter_jobs[recruiter_id]['jobs'].append({
                        'job_id': str(job['_id']),
                        'title': job.get('title', 'No Title')
                    })
                    recruiter_jobs[recruiter_id]['interview_applications'].append({
                        'app_id': str(app['_id']),
                        'job_title': job.get('title', 'No Title')
                    })
    
    print(f"Found {len(recruiter_jobs)} recruiters with interview applications:")
    
    for recruiter_id, data in recruiter_jobs.items():
        print(f"\nRecruiter ID: {recruiter_id}")
        print(f"  Jobs: {len(set(job['job_id'] for job in data['jobs']))}")
        print(f"  Interview Applications: {len(data['interview_applications'])}")
        
        # Show sample job titles
        unique_jobs = list({job['job_id']: job for job in data['jobs']}.values())
        print(f"  Sample jobs:")
        for job in unique_jobs[:3]:
            print(f"    - {job['title']} (ID: {job['job_id']})")
    
    return list(recruiter_jobs.keys())

def test_api_endpoint(recruiter_id):
    print(f"\n=== Testing API Endpoint for Recruiter {recruiter_id} ===")
    
    try:
        # Test the API endpoint
        url = f"http://localhost:3002/api/interviews/upcoming?recruiterId={recruiter_id}"
        response = requests.get(url, timeout=10)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success', False)}")
            print(f"Interview count: {data.get('count', 0)}")
            
            interviews = data.get('interviews', [])
            if interviews:
                print(f"Interviews found:")
                for i, interview in enumerate(interviews):
                    print(f"  {i+1}. {interview.get('applicantName', 'Unknown')} - {interview.get('jobTitle', 'Unknown Job')}")
                    print(f"      Date: {interview.get('interviewDate', 'No Date')}")
                    print(f"      Time: {interview.get('interviewTime', 'No Time')}")
            else:
                print("No interviews returned")
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    recruiter_ids = get_recruiter_info()
    
    if recruiter_ids:
        # Test with the first recruiter
        test_api_endpoint(recruiter_ids[0])
    else:
        print("No recruiters found with interview applications")
