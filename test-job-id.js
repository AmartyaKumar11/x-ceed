const { MongoClient, ObjectId } = require('mongodb');

async function testJobId() {
  const uri = 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('x-ceed-db');
    
    // Get a job from the database
    const job = await db.collection('jobs').findOne({ status: 'active' });
    
    if (job) {
      console.log('📋 Original job from database:');
      console.log('  - _id:', job._id);
      console.log('  - _id type:', typeof job._id);
      console.log('  - _id constructor:', job._id.constructor.name);
      
      // Simulate JSON serialization (what happens when sending to frontend)
      const serialized = JSON.stringify(job);
      console.log('\n📤 After JSON.stringify:');
      console.log('  - serialized _id:', JSON.parse(serialized)._id);
      console.log('  - serialized _id type:', typeof JSON.parse(serialized)._id);
      
      const frontendJobId = JSON.parse(serialized)._id;
      
      // Test what happens when frontend sends this back
      console.log('\n🔍 Testing ObjectId operations with frontend job ID:');
      console.log('  - frontendJobId:', frontendJobId);
      console.log('  - ObjectId.isValid(frontendJobId):', ObjectId.isValid(frontendJobId));
      
      // Test finding job with this ID
      const foundJob = await db.collection('jobs').findOne({ _id: new ObjectId(frontendJobId) });
      console.log('  - Can find job with new ObjectId(frontendJobId):', !!foundJob);
      
      // Test what the current API is doing
      const apiTest = await db.collection('jobs').findOne({ _id: new ObjectId(frontendJobId) });
      console.log('  - API lookup result:', !!apiTest);
      
    } else {
      console.log('❌ No active jobs found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testJobId();
