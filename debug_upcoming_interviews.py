#!/usr/bin/env python3
"""
Debug script to check upcoming interviews data
"""
import requests
import json
from datetime import datetime, timedelta

def debug_upcoming_interviews():
    print("🔍 DEBUGGING UPCOMING INTERVIEWS")
    print("=" * 50)
      # Test with the actual recruiter ID that has interview applications
    test_recruiter_ids = [
        "683b42ead5ddd166187f15cf",  # This recruiter has 3 interview applications
        "683b0279ec13c9a203e81bed",  # Another recruiter
    ]
    
    base_url = "http://localhost:3002/api/interviews/upcoming"  # Using port 3002
    
    for recruiter_id in test_recruiter_ids:
        print(f"\n📋 Testing for recruiter ID: {recruiter_id}")
        
        try:
            url = f"{base_url}?recruiterId={recruiter_id}"
            print(f"🌐 Calling: {url}")
            
            response = requests.get(url, timeout=10)
            
            print(f"📡 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response received!")
                print(f"📊 Interview count: {data.get('count', 0)}")
                
                if data.get('interviews'):
                    print("\n📅 Found interviews:")
                    for i, interview in enumerate(data['interviews'], 1):
                        print(f"  {i}. {interview.get('applicantName', 'Unknown')} - {interview.get('jobTitle', 'Unknown Job')}")
                        print(f"     Date: {interview.get('interviewDate', 'Not set')}")
                        print(f"     Time: {interview.get('interviewTime', 'Not set')}")
                        print(f"     Status: {interview.get('status', 'Unknown')}")
                        print()
                else:
                    print("❌ No interviews found")
                    
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to the API. Make sure Next.js server is running.")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("💡 If no interviews are found, check:")
    print("1. Are there applications with status 'interview'?")
    print("2. Are the job IDs correctly linked?")
    print("3. Is the recruiter ID correct?")
    print("4. Are the dates within the next 7 days?")

if __name__ == "__main__":
    debug_upcoming_interviews()
