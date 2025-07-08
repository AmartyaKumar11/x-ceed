"""
Debug User Registration and Login Issues
Check what's actually stored in the database vs what the login is looking for
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv('.env.local')

def debug_user_database():
    print("🔍 Debugging User Database Issues...")
    print("=" * 50)
    
    # Get MongoDB URI from environment
    mongodb_uri = os.getenv('MONGODB_URI')
    
    try:
        # Connect to MongoDB Atlas
        client = MongoClient(mongodb_uri)
        db = client['x-ceed-db']
        
        # Check users collection
        users_collection = db['users']
        
        print("📊 Users Collection Analysis:")
        print("-" * 30)
        
        # Count total users
        total_users = users_collection.count_documents({})
        print(f"Total users in database: {total_users}")
        
        if total_users > 0:
            print("\n📋 All Users in Database:")
            users = users_collection.find({})
            
            for i, user in enumerate(users, 1):
                print(f"\n👤 User {i}:")
                print(f"   ID: {user.get('_id')}")
                print(f"   Email: {user.get('email')}")
                print(f"   User Type: {user.get('userType')}")
                print(f"   Created: {user.get('createdAt')}")
                print(f"   Has Password: {'Yes' if user.get('password') else 'No'}")
                
                # Check password format
                stored_password = user.get('password', '')
                if stored_password:
                    print(f"   Password Hash: {stored_password[:20]}...")
                    # Check if it's a bcrypt hash
                    if stored_password.startswith('$2b$') or stored_password.startswith('$2a$'):
                        print("   ✅ Password is properly hashed with bcrypt")
                    else:
                        print("   ❌ Password is not properly hashed!")
        
        # Test login with the registered user
        print("\n🔐 Testing Login Logic:")
        print("-" * 30)
        
        # Get the first user for testing
        test_user = users_collection.find_one({})
        if test_user:
            test_email = test_user.get('email')
            print(f"Testing with email: {test_email}")
            
            # Test what login query would find
            login_query = {"email": test_email}
            found_user = users_collection.find_one(login_query)
            
            if found_user:
                print("✅ Login query finds the user successfully")
                
                # Test password verification with a known password
                print("🔓 Password verification test:")
                # We know from logs the test password is "applicant"
                test_password = "applicant"
                stored_hash = found_user.get('password')
                
                if stored_hash:
                    try:
                        password_valid = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
                        if password_valid:
                            print("✅ Password verification works correctly")
                        else:
                            print("❌ Password verification failed")
                    except Exception as e:
                        print(f"❌ Password verification error: {e}")
                else:
                    print("❌ No password hash found")
            else:
                print("❌ Login query cannot find the user")
        else:
            print("❌ No test user found in database")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_exact_login_scenario():
    print("\n🎯 Testing Exact Login Scenario")
    print("=" * 50)
    
    # This simulates exactly what the login API does
    mongodb_uri = os.getenv('MONGODB_URI')
    
    try:
        client = MongoClient(mongodb_uri)
        db = client['x-ceed-db']
        
        # Test with the exact email from logs
        test_email = "amartya-applicant@gmail.com"
        test_password = "applicant"
        
        print(f"Testing login with:")
        print(f"Email: {test_email}")
        print(f"Password: {test_password}")
        
        # Find user exactly like the API does
        user = db.collection('users').find_one({"email": test_email})
        
        if user:
            print("✅ User found in database")
            
            # Test password verification
            stored_password = user.get('password')
            if stored_password:
                try:
                    is_valid = bcrypt.checkpw(test_password.encode('utf-8'), stored_password.encode('utf-8'))
                    if is_valid:
                        print("✅ Password is correct - Login should work!")
                    else:
                        print("❌ Password is incorrect")
                        # Try some variations
                        variations = ["Applicant", "APPLICANT", "applicant123"]
                        for variation in variations:
                            if bcrypt.checkpw(variation.encode('utf-8'), stored_password.encode('utf-8')):
                                print(f"✅ Correct password is: {variation}")
                                break
                except Exception as e:
                    print(f"❌ Password check error: {e}")
            else:
                print("❌ No password found in user record")
        else:
            print("❌ User not found with this exact email")
            
            # Try case variations
            variations = [
                test_email.lower(),
                test_email.upper(), 
                test_email.strip()
            ]
            
            for variation in variations:
                user_variant = db.collection('users').find_one({"email": variation})
                if user_variant:
                    print(f"✅ User found with email variation: {variation}")
                    break
        
        client.close()
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    debug_user_database()
    test_exact_login_scenario()
