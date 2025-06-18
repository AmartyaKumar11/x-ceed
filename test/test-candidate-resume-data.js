import { getDatabase } from './src/lib/mongodb.js';

async function testCandidateResumeData() {
  console.log('🧪 Testing candidate resume data...');
  
  try {
    const db = await getDatabase();
    
    // First, let's check all applications and see what resume fields they have
    const applications = await db.collection('applications').find({}).limit(10).toArray();
    console.log('\n📋 Sample applications with resume data:');
    applications.forEach((app, index) => {
      console.log(`\nApplication ${index + 1}:`);
      console.log(`  ID: ${app._id}`);
      console.log(`  JobID: ${app.jobId}`);
      console.log(`  UserID: ${app.userId}`);
      console.log(`  ResumeUsed: ${app.resumeUsed}`);
      console.log(`  ResumePath: ${app.resumePath}`);
      console.log(`  ResumeUrl: ${app.resumeUrl}`);
    });
    
    // Test the actual API endpoint for a specific job
    const sampleJobId = applications[0]?.jobId;
    if (sampleJobId) {
      console.log(`\n🎯 Testing API endpoint for jobId: ${sampleJobId}`);
      
      const apiApplications = await db.collection('applications')
        .aggregate([
          { 
            $match: { 
              jobId: sampleJobId
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
            $project: {
              _id: 1,
              jobId: 1,
              userId: 1,
              status: 1,
              appliedAt: 1,
              resumeUsed: 1,
              resumePath: 1,
              resumeUrl: 1,
              coverLetter: 1,
              notes: 1,
              'applicantDetails.name': 1,
              'applicantDetails.email': 1,
              'applicantDetails.phone': 1,
              'applicantDetails._id': 1
            }
          }
        ])
        .toArray();
      
      console.log('\n📊 API response structure:');
      apiApplications.forEach((app, index) => {
        console.log(`\nCandidate ${index + 1}:`);
        console.log(`  Name: ${app.applicantDetails?.name}`);
        console.log(`  Email: ${app.applicantDetails?.email}`);
        console.log(`  ResumeUsed: ${app.resumeUsed}`);
        console.log(`  ResumePath: ${app.resumePath}`);
        console.log(`  ResumeUrl: ${app.resumeUrl}`);
        console.log(`  Has Resume?: ${!!(app.resumeUsed || app.resumePath || app.resumeUrl)}`);
      });
    }
    
    console.log('\n✅ Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing candidate resume data:', error);
    process.exit(1);
  }
}

testCandidateResumeData();
