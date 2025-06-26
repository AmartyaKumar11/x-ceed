#!/usr/bin/env python3
"""
Debug script to check all applications and their statuses
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import json

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["x-ceed-db"]

def debug_all_applications():
    print("=== DEBUG: All Applications Analysis ===")
    
    # Get all applications
    all_apps = list(db.applications.find())
    print(f"Total applications in database: {len(all_apps)}")
    
    if len(all_apps) == 0:
        print("No applications found!")
        return
    
    # Check all unique statuses
    statuses = set()
    for app in all_apps:
        status = app.get('status', 'NO_STATUS')
        statuses.add(status)
    
    print(f"\nUnique statuses found: {list(statuses)}")
    
    # Count applications by status
    status_counts = {}
    for status in statuses:
        count = db.applications.count_documents({"status": status})
        status_counts[status] = count
    
    print(f"\nApplications by status:")
    for status, count in status_counts.items():
        print(f"  {status}: {count}")
    
    # Show sample applications
    print(f"\nSample applications:")
    for i, app in enumerate(all_apps[:5]):
        print(f"\n  Application {i+1}:")
        print(f"    _id: {app['_id']}")
        print(f"    status: {app.get('status', 'NO_STATUS')}")
        print(f"    jobId: {app.get('jobId', 'NO_JOB_ID')}")
        print(f"    applicantId: {app.get('applicantId', 'NO_APPLICANT_ID')}")
        print(f"    interviewDate: {app.get('interviewDate', 'NO_DATE')}")
        print(f"    All fields: {list(app.keys())}")

def debug_database_connection():
    print("\n=== DEBUG: Database Connection ===")
    
    # List all databases
    db_names = client.list_database_names()
    print(f"Available databases: {db_names}")
      # List collections in current database
    collections = db.list_collection_names()
    print(f"Collections in x-ceed-db: {collections}")
    
    # Count documents in each collection
    for collection in collections:
        count = db[collection].count_documents({})
        print(f"  {collection}: {count} documents")

if __name__ == "__main__":
    debug_database_connection()
    debug_all_applications()
