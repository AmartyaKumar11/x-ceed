// Script to check and fix job ownership
const { MongoClient } = require('mongodb');

async function checkJobOwnership() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🔍 Checking job ownership...');
    
    // 1. Find all jobs
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`\n📊 Total jobs in database: ${allJobs.length}`);
    
    // 2. Check which jobs have recruiterId
    const jobsWithRecruiter = allJobs.filter(job => job.recruiterId);
    const jobsWithoutRecruiter = allJobs.filter(job => !job.recruiterId);
    
    console.log(`✅ Jobs with recruiterId: ${jobsWithRecruiter.length}`);
    console.log(`❌ Jobs without recruiterId: ${jobsWithoutRecruiter.length}`);
    
    if (jobsWithoutRecruiter.length > 0) {
      console.log('\n🚨 Jobs missing recruiterId:');
      jobsWithoutRecruiter.forEach(job => {
        console.log(`   - "${job.title}" (ID: ${job._id})`);
      });
      
      // Find the first recruiter to assign orphan jobs to
      const firstRecruiter = await db.collection('users').findOne({ userType: 'recruiter' });
      
      if (firstRecruiter) {
        console.log(`\n🔧 Assigning orphan jobs to recruiter: ${firstRecruiter.email}`);
        
        const updateResult = await db.collection('jobs').updateMany(
          { recruiterId: { $exists: false } },
          { $set: { recruiterId: firstRecruiter._id.toString() } }
        );
        
        console.log(`✅ Updated ${updateResult.modifiedCount} jobs with recruiterId`);
      }
    }
    
    // 3. Show jobs per recruiter
    const recruiters = await db.collection('users').find({ userType: 'recruiter' }).toArray();
    console.log(`\n👥 Recruiters in database: ${recruiters.length}`);
    
    for (const recruiter of recruiters) {
      const recruiterJobs = await db.collection('jobs').find({
        recruiterId: recruiter._id.toString()
      }).toArray();
      
      console.log(`\n📋 ${recruiter.email}:`);
      console.log(`   Total jobs: ${recruiterJobs.length}`);
      
      recruiterJobs.forEach(job => {
        console.log(`   - "${job.title}" (${job.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkJobOwnership();
