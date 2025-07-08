"""
Quick MongoDB Atlas Connection Test - Database Creation
This will create your x-ceed-db database and make it visible in Atlas
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def create_database():
    print("🔗 Creating x-ceed-db database in MongoDB Atlas...")
    print("=" * 50)
    
    # Get MongoDB URI from environment
    mongodb_uri = os.getenv('MONGODB_URI')
    
    if not mongodb_uri or 'YOUR_USERNAME' in mongodb_uri:
        print("❌ MONGODB_URI not properly configured in .env.local")
        return False
    
    # Hide password in output for security
    clean_uri = mongodb_uri.replace(':dreamisop69@', ':***@')
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
        
        # Create essential collections for your app
        collections_to_create = [
            'users',
            'resumes', 
            'jobs',
            'applications',
            'interviews'
        ]
        
        for collection_name in collections_to_create:
            collection = db[collection_name]
            # Insert a sample document to create the collection
            sample_doc = {
                "created": "2025-01-08",
                "type": f"sample_{collection_name}",
                "status": "initialized"
            }
            result = collection.insert_one(sample_doc)
            print(f"✅ Created collection: {collection_name}")
            
            # Clean up the sample document
            collection.delete_one({"_id": result.inserted_id})
        
        # List all collections in the database
        collections = db.list_collection_names()
        print(f"📁 Collections in x-ceed-db: {collections}")
        
        # List all databases to confirm x-ceed-db exists
        databases = client.list_database_names()
        print(f"🗄️  All databases: {databases}")
        
        if 'x-ceed-db' in databases:
            print("\n🎉 SUCCESS! x-ceed-db database is now visible in Atlas!")
            print("\n📋 What to do next:")
            print("1. ✅ Refresh your MongoDB Atlas dashboard")
            print("2. ✅ Click on 'Browse Collections' in your cluster")
            print("3. ✅ You should now see 'x-ceed-db' database")
            print("4. ✅ Your app is ready to use MongoDB Atlas!")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Check if your cluster is running in Atlas")
        print("2. Verify network access allows your IP")
        print("3. Ensure database user 'amartya' has correct permissions")
        return False

if __name__ == "__main__":
    print("🚀 Creating X-ceed Database in MongoDB Atlas")
    print("=" * 50)
    
    if create_database():
        print("\n🎉 Database setup complete!")
        print("🔄 Go check your MongoDB Atlas dashboard now!")
    else:
        print("\n❌ Database setup failed.")
