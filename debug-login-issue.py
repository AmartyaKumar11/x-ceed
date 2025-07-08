"""
Direct Login Debug - Test exact login scenario
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv('.env.local')

def test_login_directly():
    print("🔍 Testing Direct Login Scenario")
    print("=" * 40)
    
    mongodb_uri = os.getenv('MONGODB_URI')
    
    try:
        client = MongoClient(mongodb_uri)
        db = client['x-ceed-db']
        users_collection = db['users']
        
        # Test with exact credentials from logs
        test_email = "amartya-applicant@gmail.com"
        test_password = "applicant"
        
        print(f"Testing login with:")
        print(f"Email: {test_email}")
        print(f"Password: {test_password}")
        
        # Step 1: Find user (exactly like login API does)
        print("\n1. Finding user in database...")
        user = users_collection.find_one({"email": test_email})
        
        if not user:
            print("❌ User not found with exact email")
            
            # Try variations
            print("\n🔍 Trying email variations...")
            variations = [
                test_email.lower(),
                test_email.upper(),
                test_email.strip()
            ]
            
            for variation in variations:
                user_test = users_collection.find_one({"email": variation})
                if user_test:
                    print(f"✅ Found user with variation: {variation}")
                    user = user_test
                    break
            
            if not user:
                print("❌ No user found with any email variation")
                
                # Show all users
                print("\n📋 All users in database:")
                all_users = users_collection.find({})
                for u in all_users:
                    print(f"  - Email: '{u.get('email')}'")
                    print(f"  - Type: {u.get('userType')}")
                return False
        else:
            print("✅ User found in database")
        
        # Step 2: Check password
        print("\n2. Checking password...")
        stored_password = user.get('password')
        
        if not stored_password:
            print("❌ No password stored for user")
            return False
        
        print(f"Stored password hash: {stored_password[:30]}...")
        
        # Test password verification
        try:
            is_valid = bcrypt.checkpw(test_password.encode('utf-8'), stored_password.encode('utf-8'))
            if is_valid:
                print("✅ Password is correct!")
                return True
            else:
                print("❌ Password is incorrect")
                
                # Try common variations
                print("\n🔍 Trying password variations...")
                variations = [
                    "applicant",
                    "Applicant", 
                    "APPLICANT",
                    "applicant123",
                    "password",
                    "123456"
                ]
                
                for variation in variations:
                    try:
                        if bcrypt.checkpw(variation.encode('utf-8'), stored_password.encode('utf-8')):
                            print(f"✅ Correct password is: '{variation}'")
                            return True
                    except:
                        continue
                
                print("❌ No matching password found")
                return False
                
        except Exception as e:
            print(f"❌ Password verification error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False
    finally:
        client.close()

def check_api_consistency():
    print("\n🔧 Checking API Consistency...")
    print("=" * 40)
    
    # Check if login API is using the same database connection
    import json
    
    # Test API endpoint directly
    try:
        import requests
        
        print("Testing login API endpoint...")
        login_data = {
            "email": "amartya-applicant@gmail.com",
            "password": "applicant"
        }
        
        response = requests.post(
            "http://localhost:3002/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"API Response Status: {response.status_code}")
        print(f"API Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login API is working correctly")
        else:
            print("❌ Login API is failing")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")

if __name__ == "__main__":
    success = test_login_directly()
    
    if success:
        print("\n🎉 Direct database login test PASSED")
        print("The issue might be with the API endpoint, not the database")
        check_api_consistency()
    else:
        print("\n❌ Direct database login test FAILED")
        print("The issue is with the stored user data")
