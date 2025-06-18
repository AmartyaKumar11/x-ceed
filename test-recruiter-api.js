const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function testRecruiterAPI() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('🧪 Testing Recruiter API Data...\n');
    
    // Find a job that has applications
    const applicationWithJob = await db.collection('applications').findOne({});
    const jobId = applicationWithJob.jobId;
    
    console.log('Testing with jobId:', jobId);
    
    // Simulate the exact aggregation the API will use
    const applications = await db.collection('applications')
      .aggregate([
        { 
          $match: { 
            jobId: jobId
          } 
        },
        {
          $lookup: {
            from: 'users',
            let: { userIdStr: '$userId' },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $eq: ['$_id', { $toObjectId: '$$userIdStr' }] 
                  } 
                } 
              }
            ],
            as: 'applicantDetails'
          }
        },
        {
          $unwind: {
            path: '$applicantDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            jobIdAsObjectId: { $toObjectId: "$jobId" }
          }
        },
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobIdAsObjectId',
            foreignField: '_id',
            as: 'jobDetails'
          }
        },
        {
          $unwind: {
            path: '$jobDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            jobId: 1,
            userId: 1,
            status: 1,
            appliedAt: 1,
            updatedAt: 1,
            resumeUsed: 1,
            coverLetter: 1,
            notes: 1,
            // Applicant details
            'applicantDetails.name': 1,
            'applicantDetails.email': 1,
            'applicantDetails.phone': 1,
            'applicantDetails._id': 1,
            // Job details
            'jobDetails.title': 1,
            'jobDetails.company': 1,
            'jobDetails.location': 1,
            'jobDetails.jobType': 1,
            'jobDetails.salary': 1
          }
        },
        {
          $sort: { appliedAt: -1 }
        }
      ])
      .toArray();
    
    console.log(`✅ Found ${applications.length} applications`);
    
    if (applications.length > 0) {
      const app = applications[0];
      console.log('\n📋 Sample Application Data:');
      console.log('- Application ID:', app._id);
      console.log('- Job Title:', app.jobDetails?.title);
      console.log('- Applicant Name:', app.applicantDetails?.name || app.applicantDetails?.email?.split('@')[0] || 'Unknown');
      console.log('- Applicant Email:', app.applicantDetails?.email);
      console.log('- Applicant Phone:', app.applicantDetails?.phone);
      console.log('- Status:', app.status);
      console.log('- Cover Letter:', app.coverLetter ? 'Yes' : 'No');
      console.log('- Resume Used:', app.resumeUsed ? 'Yes' : 'No');
      console.log('- Applied At:', app.appliedAt);
      
      console.log('\n🎯 This data will allow the recruiter UI to:');
      console.log('✅ Display candidate names and emails');
      console.log('✅ Show cover letters');
      console.log('✅ Enable resume downloads');
      console.log('✅ Send notifications (accept/reject/interview)');
      console.log('✅ Schedule interviews');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testRecruiterAPI();
