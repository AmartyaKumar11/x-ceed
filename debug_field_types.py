#!/usr/bin/env python3
"""
Debug script to check the actual field types in applications and jobs collections
to understand why the aggregation join is not working.
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import json

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["x-ceed-db"]

def debug_field_types():
    print("=== DEBUG: Field Types Analysis ===")
    
    # Check applications collection
    print("\n1. Applications with status 'interview':")
    interview_apps = list(db.applications.find({"status": "interview"}))
    print(f"   Found {len(interview_apps)} interview applications")
    
    for i, app in enumerate(interview_apps[:3]):  # Show first 3
        print(f"\n   Application {i+1}:")
        print(f"     _id: {app['_id']} (type: {type(app['_id'])})")
        print(f"     jobId: {app.get('jobId', 'NOT_SET')} (type: {type(app.get('jobId', 'NOT_SET'))})")
        print(f"     applicantId: {app.get('applicantId', 'NOT_SET')} (type: {type(app.get('applicantId', 'NOT_SET'))})")
        
        # Try to find the corresponding job
        job_id = app.get('jobId')
        if job_id:
            # Try as ObjectId first
            job_by_objectid = None
            job_by_string = None
            
            try:
                if isinstance(job_id, str) and ObjectId.is_valid(job_id):
                    job_by_objectid = db.jobs.find_one({"_id": ObjectId(job_id)})
                elif isinstance(job_id, ObjectId):
                    job_by_objectid = db.jobs.find_one({"_id": job_id})
            except:
                pass
                
            # Try as string
            try:
                job_by_string = db.jobs.find_one({"_id": job_id})
            except:
                pass
            
            print(f"     Job found by ObjectId: {'YES' if job_by_objectid else 'NO'}")
            print(f"     Job found by string: {'YES' if job_by_string else 'NO'}")
            
            if job_by_objectid:
                print(f"     Job._id: {job_by_objectid['_id']} (type: {type(job_by_objectid['_id'])})")
                print(f"     Job.recruiterId: {job_by_objectid.get('recruiterId', 'NOT_SET')} (type: {type(job_by_objectid.get('recruiterId', 'NOT_SET'))})")
    
    # Check jobs collection
    print("\n2. Jobs collection sample:")
    jobs = list(db.jobs.find().limit(3))
    
    for i, job in enumerate(jobs):
        print(f"\n   Job {i+1}:")
        print(f"     _id: {job['_id']} (type: {type(job['_id'])})")
        print(f"     recruiterId: {job.get('recruiterId', 'NOT_SET')} (type: {type(job.get('recruiterId', 'NOT_SET'))})")
        print(f"     title: {job.get('title', 'NOT_SET')}")
    
    # Test the aggregation stages separately
    print("\n3. Testing aggregation stages separately:")
    
    # Stage 1: Just get interview applications
    stage1_result = list(db.applications.aggregate([
        {"$match": {"status": "interview"}}
    ]))
    print(f"   Stage 1 (match interview): {len(stage1_result)} results")
    
    # Stage 2: Add lookup
    stage2_result = list(db.applications.aggregate([
        {"$match": {"status": "interview"}},
        {
            "$lookup": {
                "from": "jobs",
                "localField": "jobId", 
                "foreignField": "_id",
                "as": "job"
            }
        }
    ]))
    print(f"   Stage 2 (with lookup): {len(stage2_result)} results")
    
    # Check if any lookups worked
    successful_lookups = 0
    for result in stage2_result:
        if result.get('job') and len(result['job']) > 0:
            successful_lookups += 1
    
    print(f"   Successful lookups: {successful_lookups}")
    
    # Try alternative lookup approaches
    print("\n4. Testing alternative lookup approaches:")
    
    # Try converting jobId to ObjectId in the pipeline
    try:
        stage2_alt_result = list(db.applications.aggregate([
            {"$match": {"status": "interview"}},
            {
                "$addFields": {
                    "jobIdAsObjectId": {
                        "$cond": {
                            "if": {"$type": "$jobId"},
                            "then": {"$toObjectId": "$jobId"},
                            "else": "$jobId"
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "jobIdAsObjectId", 
                    "foreignField": "_id",
                    "as": "job"
                }
            }
        ]))
        
        alt_successful_lookups = 0
        for result in stage2_alt_result:
            if result.get('job') and len(result['job']) > 0:
                alt_successful_lookups += 1
        
        print(f"   Alternative lookup (with $toObjectId): {alt_successful_lookups} successful")
        
    except Exception as e:
        print(f"   Alternative lookup failed: {e}")

if __name__ == "__main__":
    debug_field_types()
