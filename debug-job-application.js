const { MongoClient, ObjectId } = require('mongodb');

async function debugJobApplication() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    // First, let's see what jobs exist
    console.log('=== JOBS IN DATABASE ===');
    const jobs = await db.collection('jobs').find({}).toArray();
    jobs.forEach(job => {
      console.log(`ID: ${job._id} | Title: ${job.title} | Status: ${job.status}`);
      console.log(`ID Type: ${typeof job._id} | ID String: ${job._id.toString()}`);
    });
    
    // Test with a specific job ID from your frontend
    console.log('\n=== TESTING JOB LOOKUP ===');
    const sampleJobId = jobs[0]._id.toString();
    console.log(`Testing with Job ID: ${sampleJobId}`);
    
    // Test exactly how the API searches for jobs
    console.log('\n1. Testing ObjectId.isValid():');
    console.log(`ObjectId.isValid(${sampleJobId}):`, ObjectId.isValid(sampleJobId));
    
    console.log('\n2. Testing findOne with ObjectId conversion:');
    const foundJob1 = await db.collection('jobs').findOne({ 
      _id: new ObjectId(sampleJobId),
      status: 'active' 
    });
    console.log('Job found with ObjectId + active status:', foundJob1 ? 'YES' : 'NO');
    if (foundJob1) {
      console.log('Found job title:', foundJob1.title);
    }
    
    console.log('\n3. Testing findOne with just ObjectId (no status filter):');
    const foundJob2 = await db.collection('jobs').findOne({ 
      _id: new ObjectId(sampleJobId)
    });
    console.log('Job found with just ObjectId:', foundJob2 ? 'YES' : 'NO');
    if (foundJob2) {
      console.log('Found job title:', foundJob2.title);
      console.log('Found job status:', foundJob2.status);
    }
    
    console.log('\n4. Testing with string ID (should fail):');
    const foundJob3 = await db.collection('jobs').findOne({ 
      _id: sampleJobId,
      status: 'active' 
    });
    console.log('Job found with string ID:', foundJob3 ? 'YES' : 'NO');
    
    console.log('\n=== ACTIVE JOBS COUNT ===');
    const activeCount = await db.collection('jobs').countDocuments({ status: 'active' });
    console.log('Total active jobs:', activeCount);
    
    const activeJobs = await db.collection('jobs').find({ status: 'active' }).toArray();
    console.log('Active job IDs:');
    activeJobs.forEach(job => {
      console.log(`  - ${job._id} (${job.title})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugJobApplication();
