const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function testApplicationsAPI() {
  const client = new MongoClient(uri);
    try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('� Testing Applications API Data Flow...\n');
      // 1. Find a job that has applications
    const applicationWithJob = await db.collection('applications').findOne({});
    if (!applicationWithJob) {
      console.log('❌ No applications found in database');
      return;
    }
    
    const sampleJob = await db.collection('jobs').findOne({ _id: new ObjectId(applicationWithJob.jobId) });
    if (!sampleJob) {
      console.log('❌ Job not found for application');
      return;
    }
    
    console.log('📋 Sample Job:', {
      id: sampleJob._id,
      title: sampleJob.title,
      company: sampleJob.company
    });
      // 2. Check applications for this job
    const applications = await db.collection('applications')
      .find({ jobId: sampleJob._id.toString() })
      .toArray();
    
    console.log(`\n📊 Found ${applications.length} applications for this job`);
    
    if (applications.length === 0) {
      console.log('❌ No applications found for this job');
      return;
    }
    
    // 3. Test the new aggregation pipeline that the API will use
    console.log('\n🔄 Testing Recruiter View Aggregation Pipeline...');
    
    const recruiterViewData = await db.collection('applications')      .aggregate([
        { 
          $match: { 
            jobId: sampleJob._id.toString()
          } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'userId',
            as: 'applicantDetails'
          }
        },
        {
          $unwind: {
            path: '$applicantDetails',
            preserveNullAndEmptyArrays: true
          }
        },        {
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
            'applicantDetails.userId': 1,
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
    
    console.log(`\n✅ Aggregation returned ${recruiterViewData.length} applications with details`);
    
    // 4. Show sample data
    if (recruiterViewData.length > 0) {
      const sample = recruiterViewData[0];
      console.log('\n📝 Sample Application Data:');
      console.log('- Application ID:', sample._id);
      console.log('- Job Title:', sample.jobDetails?.title || 'N/A');
      console.log('- Applicant Name:', sample.applicantDetails?.name || 'N/A');
      console.log('- Applicant Email:', sample.applicantDetails?.email || 'N/A');
      console.log('- Applicant Phone:', sample.applicantDetails?.phone || 'N/A');
      console.log('- Status:', sample.status);
      console.log('- Applied At:', sample.appliedAt);
      
      // Check if we have missing data
      const missingData = [];
      if (!sample.applicantDetails?.name) missingData.push('name');
      if (!sample.applicantDetails?.email) missingData.push('email');
      if (!sample.applicantDetails?.phone) missingData.push('phone');
      
      if (missingData.length > 0) {
        console.log('⚠️  Missing applicant data:', missingData.join(', '));
      } else {
        console.log('✅ All required applicant data is present');
      }
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing applications API:', error);
  } finally {
    await client.close();
  }
}

testApplicationsAPI();
