const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

async function testCurrentAuth() {
  const uri = 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('x-ceed-db');
    
    // Find an applicant to test with
    const applicant = await db.collection('users').findOne({ userType: 'applicant' });
    
    if (!applicant) {
      console.log('❌ No applicant found');
      return;
    }
    
    console.log('👤 Testing with applicant:', applicant.email);
    
    // Test token creation (simulate login)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-tokens';
    const tokenPayload = {
      userId: applicant._id.toString(),
      email: applicant.email,
      userType: applicant.userType
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log('🔑 Generated token:', token.substring(0, 50) + '...');
    
    // Test token verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verification successful:', decoded);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
    }
    
    // Test ObjectId handling for job lookup
    const jobs = await db.collection('jobs').find({ status: 'active' }).limit(1).toArray();
    if (jobs.length > 0) {
      const job = jobs[0];
      console.log('🎯 Testing job lookup:');
      console.log('  - Job ID from DB:', job._id);
      console.log('  - Job ID as string:', job._id.toString());
      console.log('  - ObjectId.isValid:', ObjectId.isValid(job._id.toString()));
      
      // Test the lookup that's failing in the API
      const foundJob = await db.collection('jobs').findOne({ _id: new ObjectId(job._id.toString()) });
      console.log('  - Job lookup result:', !!foundJob);
    }
    
    // Check current user resume status
    console.log('📋 Current user resume status:');
    console.log('  - Has resume field:', !!applicant.resume);
    if (applicant.resume) {
      console.log('  - Resume path:', applicant.resume);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testCurrentAuth();
