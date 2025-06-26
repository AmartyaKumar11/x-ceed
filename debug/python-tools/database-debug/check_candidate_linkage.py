"""
Check why candidate information is missing from applications
"""
from pymongo import MongoClient
from bson import ObjectId

def check_candidate_linkage():
    # Connect to MongoDB with correct database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x-ceed-db']
    
    print("🔍 CHECKING CANDIDATE LINKAGE ISSUE")
    print("=" * 60)
    
    # Get the interview applications
    interview_apps = list(db.applications.find({'status': 'interview'}))
    
    print(f"📋 Found {len(interview_apps)} interview applications")
    
    for i, app in enumerate(interview_apps, 1):
        print(f"\n{i}️⃣ Application {app['_id']}:")
        print(f"   Job ID: {app.get('jobId')}")
        print(f"   Status: {app.get('status')}")
        
        # Check all possible candidate/applicant fields
        candidate_fields = ['candidateId', 'applicantId', 'userId', 'applicant', 'candidate']
        for field in candidate_fields:
            if field in app:
                print(f"   {field}: {app[field]} (type: {type(app[field])})")
        
        # Show all fields in the application
        print(f"   All fields: {list(app.keys())}")
        
        # Try to find related users
        print(f"   🔍 Looking for related users...")
        
        # Check if there are any users that might be related
        all_users = list(db.users.find().limit(5))
        print(f"   📊 Sample users in database:")
        for user in all_users:
            print(f"     - ID: {user['_id']} (type: {type(user['_id'])})")
            print(f"       Name: {user.get('name', 'N/A')}")
            print(f"       Email: {user.get('email', 'N/A')}")
            print(f"       Role: {user.get('role', 'N/A')}")
        
        # Check if the application has any field that might match a user ID
        potential_matches = []
        for field_name, field_value in app.items():
            if field_name.endswith('Id') or field_name in ['applicant', 'candidate', 'user']:
                # Try to find a user with this ID
                try:
                    user = None
                    if ObjectId.is_valid(str(field_value)):
                        user = db.users.find_one({'_id': ObjectId(field_value)})
                    if not user:
                        user = db.users.find_one({'_id': field_value})
                    if not user:
                        user = db.users.find_one({'_id': str(field_value)})
                    
                    if user:
                        potential_matches.append((field_name, field_value, user))
                        print(f"   ✅ Found user for {field_name}: {user.get('name', 'N/A')} ({user.get('email', 'N/A')})")
                except Exception as e:
                    print(f"   ❌ Error checking {field_name}: {e}")
        
        if not potential_matches:
            print(f"   ❌ No matching users found for any field")
            # Let's check if there's a pattern in the application structure
            print(f"   📝 Application structure analysis:")
            for key, value in app.items():
                print(f"     {key}: {value} ({type(value)})")
    
    client.close()

if __name__ == "__main__":
    check_candidate_linkage()
