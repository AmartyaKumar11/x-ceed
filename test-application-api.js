// Test the application submission API directly
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testApplicationSubmission() {
  console.log('🧪 Testing job application submission API...\n');
  
  try {
    // First, get a valid job ID from the database
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = "mongodb://localhost:27017/x-ceed-db";
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db('x-ceed-db');
    
    const activeJobs = await db.collection('jobs').find({ status: 'active' }).toArray();
    
    if (activeJobs.length === 0) {
      console.log('❌ No active jobs found');
      return;
    }
    
    const testJob = activeJobs[0];
    console.log(`📋 Using job: ${testJob.title} (ID: ${testJob._id})`);
    
    // Get a test user for authentication
    const testUser = await db.collection('users').findOne({ userType: 'applicant' });
    if (!testUser) {
      console.log('❌ No applicant users found');
      return;
    }
    
    console.log(`👤 Using user: ${testUser.email}`);
    await client.close();
    
    // Create a test PDF file
    const testPdfPath = path.join(__dirname, 'test-resume.pdf');
    if (!fs.existsSync(testPdfPath)) {
      fs.writeFileSync(testPdfPath, 'fake pdf content for testing');
    }
    
    // Simulate the login to get a token (you'll need to replace this with actual token)
    console.log('\n🔐 Authentication needed...');
    console.log('Please check your browser for the auth token in localStorage');
    console.log('Or use the network tab to see the Authorization header');
    
    // For now, let's just test the form data structure
    const form = new FormData();
    form.append('jobId', testJob._id.toString());
    form.append('coverLetter', 'Test cover letter');
    form.append('additionalMessage', 'Test additional message');
    form.append('resume', fs.createReadStream(testPdfPath));
    
    console.log('\n📝 Form data structure looks correct:');
    console.log('- jobId:', testJob._id.toString());
    console.log('- coverLetter: Test cover letter');
    console.log('- additionalMessage: Test additional message');
    console.log('- resume: file stream');
    
    // Clean up test file
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testApplicationSubmission();
