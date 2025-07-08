"""
Test API Connectivity Issues
Check if the Next.js API routes are accessible
"""

import requests
import json

def test_api_routes():
    print("🔍 Testing API Route Connectivity...")
    print("=" * 50)
    
    base_url = "http://localhost:3002"
    
    # Test 1: Check if Next.js server is responding
    try:
        response = requests.get(f"{base_url}", timeout=5)
        print(f"✅ Next.js server responding: {response.status_code}")
    except Exception as e:
        print(f"❌ Next.js server not responding: {e}")
        return
    
    # Test 2: Check API routes directly
    api_routes = [
        "/api/auth/login",
        "/api/auth/register", 
        "/api/health"
    ]
    
    for route in api_routes:
        try:
            # Test GET request first
            response = requests.get(f"{base_url}{route}", timeout=5)
            print(f"📍 {route} (GET): {response.status_code}")
            
            if route in ["/api/auth/login", "/api/auth/register"]:
                # Test POST request with minimal data
                test_data = {
                    "email": "test@example.com",
                    "password": "testpass"
                }
                
                response = requests.post(
                    f"{base_url}{route}",
                    headers={"Content-Type": "application/json"},
                    json=test_data,
                    timeout=5
                )
                print(f"📍 {route} (POST): {response.status_code}")
                
                if response.status_code != 200:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data.get('message', 'Unknown error')}")
                    except:
                        print(f"   Raw response: {response.text[:100]}...")
                        
        except requests.exceptions.ConnectionError:
            print(f"❌ {route}: Connection refused")
        except requests.exceptions.Timeout:
            print(f"❌ {route}: Request timeout")
        except Exception as e:
            print(f"❌ {route}: {str(e)}")
    
    # Test 3: Check if MongoDB connection works through API
    print("\n🗄️  Testing Database Connection through API...")
    try:
        # Try a simple database test
        test_data = {
            "email": "connectivity-test@test.com",
            "password": "testpass123",
            "userType": "applicant",
            "personal": {
                "name": "Test User"
            }
        }
        
        response = requests.post(
            f"{base_url}/api/auth/register",
            headers={"Content-Type": "application/json"},
            json=test_data,
            timeout=10
        )
        
        print(f"Database test registration: {response.status_code}")
        if response.status_code == 201:
            print("✅ Database connection through API is working!")
            
            # Clean up test user
            print("🧹 Cleaning up test user...")
            # Note: We'd need a delete API for this, but it's not critical
        else:
            try:
                error_data = response.json()
                print(f"❌ Database test failed: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"❌ Raw error: {response.text[:200]}...")
                
    except Exception as e:
        print(f"❌ Database test failed: {e}")

if __name__ == "__main__":
    test_api_routes()
