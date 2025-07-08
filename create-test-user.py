#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

async def create_test_user():
    try:
        # MongoDB connection - using environment variable
        MONGODB_URI = os.getenv('MONGODB_URI')
        
        if not MONGODB_URI:
            print("❌ MONGODB_URI not found in environment variables")
            print("Please set MONGODB_URI in your .env.local file")
            return False
        
        print(f"🔗 Connecting to MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URI)
        
        db_name = "x-ceed-db"
        db = client[db_name]
        
        # Create a test user with known password
        email = "test@example.com"
        password = "password123"
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user document
        user_doc = {
            "email": email,
            "password": hashed_password,
            "userType": "applicant",
            "personal": {
                "name": "Test User",
                "phone": "1234567890",
                "location": "Test City",
                "dateOfBirth": "1990-01-01"
            },
            "preferences": {
                "jobAlerts": True,
                "emailNotifications": True,
                "theme": "light"
            },
            "createdAt": "2025-01-15T14:30:00.000Z",
            "updatedAt": "2025-01-15T14:30:00.000Z"
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        print(f"✅ Test user created with ID: {result.inserted_id}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Hash: {hashed_password}")
        
        await client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(create_test_user())
