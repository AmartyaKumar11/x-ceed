"""
MongoDB Atlas Connection Test Script
This script will:
1. Test your MongoDB Atlas connection
2. Create the x-ceed-db database 
3. Create a test collection to make the database visible in Atlas
4. Verify the connection is working
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv('.env.local')

def test_mongodb_connection():
    print("🔗 Testing MongoDB Atlas Connection...")
    print("=" * 50)
    
    # Get MongoDB URI from environment
    mongodb_uri = os.getenv('MONGODB_URI')
    
    if not mongodb_uri:
        print("❌ MONGODB_URI not found in .env.local")
        print("📝 Please update your .env.local file with your Atlas connection string")
        return False
    
    # Hide password in output for security
    clean_uri = mongodb_uri.replace(mongodb_uri.split(':')[2].split('@')[0], '***')
    print(f"📍 Connecting to: {clean_uri}")
    
    try:
        # Connect to MongoDB Atlas
        client = MongoClient(mongodb_uri)
        
        # Test the connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
        
        # Get or create the x-ceed-db database
        db = client['x-ceed-db']
        print(f"📊 Working with database: x-ceed-db")
        
        # Create a test collection to make the database visible
        test_collection = db['connection_test']
        
        # Insert a test document
        test_doc = {
            "test": True,
            "message": "Database successfully created",
            "timestamp": "2025-01-08",
            "purpose": "Make database visible in Atlas"
        }
        
        result = test_collection.insert_one(test_doc)
        print(f"✅ Test document inserted with ID: {result.inserted_id}")
        
        # List all collections in the database
        collections = db.list_collection_names()
        print(f"📁 Collections in x-ceed-db: {collections}")
        
        # List all databases to confirm x-ceed-db exists
        databases = client.list_database_names()
        print(f"🗄️  All databases: {databases}")
        
        if 'x-ceed-db' in databases:
            print("🎉 SUCCESS! x-ceed-db database is now visible in Atlas!")
            print("\n📋 Next steps:")
            print("1. Refresh your MongoDB Atlas dashboard")
            print("2. Click on 'Browse Collections' in your cluster")
            print("3. You should now see 'x-ceed-db' database")
            print("4. Inside it, you'll see 'connection_test' collection")
        
        # Clean up test collection (optional)
        print("\n🧹 Cleaning up test collection...")
        test_collection.delete_one({"test": True})
        print("✅ Test document removed")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Check your MongoDB Atlas connection string")
        print("2. Verify network access settings (0.0.0.0/0)")
        print("3. Ensure database user has read/write permissions")
        print("4. Check if your IP is whitelisted")
        return False

def check_env_file():
    print("📄 Checking .env.local file...")
    
    if not os.path.exists('.env.local'):
        print("❌ .env.local file not found!")
        print("📝 Please create .env.local from the template")
        return False
    
    # Check for required variables
    required_vars = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value or 'your-' in value or 'YOUR_' in value:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing or incomplete variables: {missing_vars}")
        print("📝 Please update these in your .env.local file")
        return False
    
    print("✅ .env.local file looks good!")
    return True

if __name__ == "__main__":
    print("🚀 X-ceed MongoDB Atlas Setup Verification")
    print("=" * 50)
    
    # Check environment file first
    if not check_env_file():
        print("\n❌ Please fix .env.local file first")
        sys.exit(1)
    
    # Test MongoDB connection
    if test_mongodb_connection():
        print("\n🎉 All tests passed! Your MongoDB Atlas is ready!")
    else:
        print("\n❌ Connection test failed. Please check your configuration.")
        sys.exit(1)
