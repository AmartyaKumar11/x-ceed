const { MongoClient, ObjectId } = require('mongodb');

async function testLocalJobLookup() {
  const uri = "mongodb://localhost:27017/x-ceed-db";
  const client = new MongoClient(uri);
  
  try {
    console.log('🔍 Testing job lookup in local x-ceed-db database...\n');
    
    await client.connect();
    const db = client.db('x-ceed-db');
    
    // Get all jobs
    const jobs = await db.collection('jobs').find({}).toArray();
    console.log(`Found ${jobs.length} total jobs:`);
    
    jobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} (ID: ${job._id}, Status: ${job.status})`);
    });
    
    if (jobs.length > 0) {
      const testJobId = jobs[0]._id.toString();
      console.log(`\n🧪 Testing job lookup with ID: ${testJobId}`);
      
      // Test the exact same lookup logic as the API
      const foundJob = await db.collection('jobs').findOne({ 
        _id: new ObjectId(testJobId),
        status: 'active'
      });
      
      console.log('Job found with active status:', foundJob ? 'YES' : 'NO');
      
      if (!foundJob) {
        // Check if job exists but with different status
        const anyStatusJob = await db.collection('jobs').findOne({ 
          _id: new ObjectId(testJobId)
        });
        
        if (anyStatusJob) {
          console.log(`Job exists but status is: ${anyStatusJob.status}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testLocalJobLookup();
