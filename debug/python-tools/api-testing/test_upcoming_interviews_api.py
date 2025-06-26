"""
Test script to verify the /api/interviews/upcoming endpoint is working correctly
"""
import requests
import json

def test_upcoming_interviews_api():
    # Test with the recruiter ID that actually has jobs
    recruiter_id = "683b42ead5ddd166187f15cf"
    url = f"http://localhost:3002/api/interviews/upcoming?recruiterId={recruiter_id}"
    
    try:
        print("🧪 Testing Upcoming Interviews API...")
        print(f"📡 Sending request to: {url}")
        
        response = requests.get(url, timeout=30)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API responded successfully!")
            print(f"📋 Full response: {json.dumps(result, indent=2)}")
            
            if 'interviews' in result:
                interviews = result['interviews']
                print(f"📝 Found {len(interviews)} upcoming interviews")
                
                if interviews:
                    print("\n🎯 Interview details:")
                    for i, interview in enumerate(interviews, 1):
                        print(f"  {i}. Job: {interview.get('jobTitle', 'N/A')}")
                        print(f"     Candidate: {interview.get('candidateName', 'N/A')} ({interview.get('candidateEmail', 'N/A')})")
                        print(f"     Date: {interview.get('interviewDate', 'N/A')}")
                        print(f"     Status: {interview.get('status', 'N/A')}")
                        print()
                else:
                    print("⚠️  No interviews found for this recruiter")
                
                return len(interviews) > 0
            else:
                print("❌ No 'interviews' field in response")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Next.js server on port 3002")
        print("Make sure the server is running: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False

def test_frontend_dashboard():
    """Test if the frontend dashboard page loads"""
    url = "http://localhost:3002/dashboard/recruiter"
    
    try:
        print("\n🌐 Testing Frontend Dashboard...")
        print(f"📡 Sending request to: {url}")
        
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            print("✅ Dashboard page loads successfully!")
            # Check if it contains interview-related content
            content = response.text.lower()
            if 'interview' in content:
                print("📝 Page contains interview-related content")
                return True
            else:
                print("⚠️  Page loads but might not have interview content")
                return False
        else:
            print(f"❌ Dashboard error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing dashboard: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 TESTING UPCOMING INTERVIEWS FEATURE")
    print("=" * 60)
    
    # Test API endpoint
    api_success = test_upcoming_interviews_api()
    
    # Test frontend dashboard
    frontend_success = test_frontend_dashboard()
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"API Endpoint: {'✅ PASS' if api_success else '❌ FAIL'}")
    print(f"Frontend Dashboard: {'✅ PASS' if frontend_success else '❌ FAIL'}")
    
    if api_success and frontend_success:
        print("\n🎉 All tests passed! The upcoming interviews feature should be working.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
