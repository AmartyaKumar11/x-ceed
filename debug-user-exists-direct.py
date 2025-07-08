#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_user_exists():
    try:
        # MongoDB connection - using the URI from .env.local
        MONGODB_URI = "mongodb+srv://amartya:dreamisop69@x-ceed.2rfbtj5.mongodb.net/x-ceed-db?retryWrites=true&w=majority"
        
        print(f"🔗 Connecting to MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URI)
        
        # Extract database name from URI
        db_name = "x-ceed-db"
        print(f"📁 Using database: {db_name}")
        
        db = client[db_name]
        
        # Check if user exists
        user = await db.users.find_one({"email": "test@example.com"})
        
        if user:
            print(f"✅ User found: {user['email']}")
            print(f"   User ID: {user['_id']}")
            print(f"   User Type: {user.get('userType', 'N/A')}")
            print(f"   Password Hash: {user.get('password', 'N/A')[:20]}...")
            
            # Check if password field exists
            if 'password' in user:
                print(f"   Password field exists: ✅")
            else:
                print(f"   Password field exists: ❌")
                
        else:
            print(f"❌ User not found with email: test@example.com")
            
            # Check all users
            users = await db.users.find({}).to_list(None)
            print(f"📊 Total users in database: {len(users)}")
            
            for user in users:
                print(f"   - {user.get('email', 'No email')} (ID: {user['_id']})")
                
        await client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(check_user_exists())
