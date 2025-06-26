#!/usr/bin/env python3
"""
Simple test to call the interviews API
"""
import requests
import json

def test_interviews_api():
    print("🔍 TESTING INTERVIEWS API")
    print("=" * 40)
    
    # Use the recruiter ID we found that has interview applications
    recruiter_id = "683b42ead5ddd166187f15cf"
    
    # Test different ports since we're not sure which one is running
    ports = [3000, 3002, 3003]
    
    for port in ports:
        try:
            url = f"http://localhost:{port}/api/interviews/upcoming?recruiterId={recruiter_id}"
            print(f"\n📡 Testing port {port}: {url}")
            
            response = requests.get(url, timeout=5)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ SUCCESS!")
                print(f"Response: {json.dumps(data, indent=2)}")
                return True
            else:
                print(f"❌ Error: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to port {port}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n💡 Next.js server might not be running. Try: npm run dev")
    return False

if __name__ == "__main__":
    test_interviews_api()
