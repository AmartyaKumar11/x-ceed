"""
Test the MongoDB aggregation directly to see what's happening
"""
from pymongo import MongoClient
from bson import ObjectId

def test_aggregation_directly():
    # Connect to MongoDB with correct database
    client = MongoClient('mongodb://localhost:27017/')
    db = client['x-ceed-db']
    
    recruiter_id = "683b42ead5ddd166187f15cf"
    
    print("🔍 TESTING AGGREGATION DIRECTLY")
    print("=" * 60)
    
    # Test the simplified aggregation to see what happens at each step
    pipeline = [
        {
            '$match': {
                'status': 'interview'
            }
        },
        {
            '$addFields': {
                'jobIdAsObjectId': {
                    '$cond': {
                        'if': { '$eq': [{ '$type': "$jobId" }, "string"] },
                        'then': { '$toObjectId': "$jobId" },
                        'else': "$jobId"
                    }
                }
            }
        },
        {
            '$lookup': {
                'from': 'jobs',
                'localField': 'jobIdAsObjectId',
                'foreignField': '_id',
                'as': 'job'
            }
        },
        {
            '$unwind': '$job'
        },
        {
            '$match': {
                'job.recruiterId': recruiter_id
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'let': { 
                    'applicantId': '$applicantId', 
                    'candidateId': '$candidateId',
                    'userId': '$userId'
                },
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$or': [
                                    { '$eq': [{ '$toString': '$_id' }, '$$applicantId'] },
                                    { '$eq': [{ '$toString': '$_id' }, '$$candidateId'] },
                                    { '$eq': [{ '$toString': '$_id' }, '$$userId'] }
                                ]
                            }
                        }
                    }
                ],
                'as': 'applicant'
            }
        },
        {
            '$unwind': {
                'path': '$applicant',
                'preserveNullAndEmptyArrays': True
            }
        },
        {
            '$project': {
                '_id': 1,
                'rawApplicantName': '$applicant.name',
                'rawApplicantEmail': '$applicant.email',
                'applicantName': { 
                    '$cond': {
                        'if': { '$and': [{ '$ne': ['$applicant.name', None] }, { '$ne': ['$applicant.name', 'N/A'] }, { '$ne': ['$applicant.name', ''] }] },
                        'then': '$applicant.name',
                        'else': { 
                            '$cond': {
                                'if': { '$ne': ['$applicant.email', None] },
                                'then': { '$arrayElemAt': [{ '$split': ['$applicant.email', '@'] }, 0] },
                                'else': 'Unknown Candidate'
                            }
                        }
                    }
                },
                'applicantEmail': { '$ifNull': ['$applicant.email', 'No Email'] },
                'jobTitle': '$job.title',
                'interviewDate': '$interviewDate',
                'status': '$status'
            }
        }
    ]
    
    try:
        result = list(db.applications.aggregate(pipeline))
        print(f"✅ Aggregation successful! Found {len(result)} results")
        
        for i, interview in enumerate(result, 1):
            print(f"\n{i}️⃣ Interview:")
            print(f"   Raw Name: {interview.get('rawApplicantName')}")
            print(f"   Raw Email: {interview.get('rawApplicantEmail')}")
            print(f"   Final Name: {interview.get('applicantName')}")
            print(f"   Final Email: {interview.get('applicantEmail')}")
            print(f"   Job: {interview.get('jobTitle')}")
            print(f"   Date: {interview.get('interviewDate')}")
        
    except Exception as e:
        print(f"❌ Aggregation failed: {e}")
        import traceback
        traceback.print_exc()
    
    client.close()

if __name__ == "__main__":
    test_aggregation_directly()
