// Test script to check job ownership in recruiter jobs page
import { connectToDatabase } from './src/lib/mongodb.js';

async function testJobOwnership() {
  console.log('🔍 Testing job ownership filtering...');
  
  try {
    const { db } = await connectToDatabase();
    
    // 1. Check all jobs in database
    console.log('\n1. All jobs in database:');
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`   Total jobs: ${allJobs.length}`);
    
    allJobs.forEach((job, index) => {
      console.log(`   Job ${index + 1}: "${job.title}" by recruiter ${job.recruiterId} (status: ${job.status})`);
    });
    
    // 2. Check all recruiters
    console.log('\n2. All recruiters in database:');
    const allRecruiters = await db.collection('users').find({ userType: 'recruiter' }).toArray();
    console.log(`   Total recruiters: ${allRecruiters.length}`);
    
    allRecruiters.forEach((recruiter, index) => {
      console.log(`   Recruiter ${index + 1}: ${recruiter.email} (ID: ${recruiter._id})`);
    });
    
    // 3. Test filtering for each recruiter
    console.log('\n3. Jobs per recruiter:');
    for (const recruiter of allRecruiters) {
      const recruiterJobs = await db.collection('jobs').find({
        recruiterId: recruiter._id.toString(),
        status: { $ne: 'deleted' }
      }).toArray();
      
      console.log(`   ${recruiter.email}: ${recruiterJobs.length} jobs`);
      recruiterJobs.forEach(job => {
        console.log(`     - "${job.title}" (${job.status})`);
      });
    }
    
    console.log('\n✅ Job ownership test completed!');
    
  } catch (error) {
    console.error('❌ Error testing job ownership:', error);
  }
  
  process.exit(0);
}

testJobOwnership();
