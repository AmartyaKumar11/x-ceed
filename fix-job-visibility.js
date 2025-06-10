const { MongoClient } = require('mongodb');

async function checkAndFixJobs() {
  console.log('🔍 Checking and fixing job visibility...');
  
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    // Check current jobs
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`📊 Total jobs in database: ${allJobs.length}`);
    
    if (allJobs.length === 0) {
      console.log('❌ No jobs found in database!');
      return;
    }
    
    // Check job visibility
    const publicJobs = await db.collection('jobs').find({ isPublic: true }).toArray();
    const activeJobs = await db.collection('jobs').find({ status: 'active' }).toArray();
    
    console.log(`📊 Public jobs: ${publicJobs.length}`);
    console.log(`📊 Active jobs: ${activeJobs.length}`);
    
    // Show sample jobs
    console.log('\n📋 Sample jobs:');
    allJobs.slice(0, 3).forEach((job, index) => {
      console.log(`${index + 1}. ${job.title}`);
      console.log(`   ID: ${job._id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Is Public: ${job.isPublic}`);
      console.log(`   Created: ${job.createdAt}`);
      console.log('');
    });
    
    // If no public jobs, make some public
    if (publicJobs.length === 0) {
      console.log('🔧 Making first 3 jobs public and active...');
      
      const jobsToUpdate = allJobs.slice(0, 3);
      
      for (const job of jobsToUpdate) {
        await db.collection('jobs').updateOne(
          { _id: job._id },
          { 
            $set: { 
              isPublic: true,
              status: 'active'
            } 
          }
        );
        console.log(`✅ Updated job: ${job.title} - Now public and active`);
      }
    }
    
    // Final check
    const finalPublicJobs = await db.collection('jobs').find({ isPublic: true, status: 'active' }).toArray();
    console.log(`\n✅ Final result: ${finalPublicJobs.length} public active jobs`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkAndFixJobs();
