// Test script to debug applications data structure
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';

async function debugApplications() {
  console.log('🔍 Connecting to MongoDB...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('✅ Connected to database');
    
    // Get all applications
    const applications = await db.collection('applications').find({}).limit(10).toArray();
    
    console.log('📊 Total applications found:', applications.length);
    console.log('📋 Sample applications:');
    
    applications.forEach((app, index) => {
      console.log(`\n${index + 1}. Application ID: ${app._id.toString()}`);
      console.log(`   Job ID: ${app.jobId}`);
      console.log(`   Applicant ID: ${app.applicantId}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Applied At: ${app.appliedAt}`);
    });
    
    // Test ObjectId validation
    if (applications.length > 0) {
      const testId = applications[0]._id.toString();
      console.log(`\n🧪 Testing ObjectId validation with: ${testId}`);
      console.log(`   Is Valid: ${ObjectId.isValid(testId)}`);
      
      const objectId = new ObjectId(testId);
      console.log(`   Created ObjectId: ${objectId.toString()}`);
      
      // Test finding the application
      const foundApp = await db.collection('applications').findOne({
        _id: objectId
      });
      
      console.log(`   Found application: ${foundApp ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugApplications();
