// Test the resume analysis API with a real job from the database
const fetch = require('node-fetch');

async function testResumeAnalysisAPI() {
  console.log('🧪 Testing Resume Analysis API...');
  
  try {
    // First, let's get a real job ID from the database
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('x-ceed-db');
    
    const sampleJob = await db.collection('jobs').findOne({ status: 'active' });
    if (!sampleJob) {
      console.error('❌ No active jobs found in database');
      return;
    }
    
    console.log('✅ Found sample job:', {
      id: sampleJob._id,
      title: sampleJob.title,
      company: sampleJob.companyName
    });
    
    await client.close();
    
    // Now test the API
    const testData = {
      jobId: sampleJob._id.toString(),
      resumePath: 'test-resume.pdf',
      isUploadedFile: false,
      userSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB']
    };
    
    console.log('📤 Testing API with data:', testData);
    
    const response = await fetch('http://localhost:3000/api/resume-match/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-test' // This will fail auth, but we can see if the job fetch works
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    const result = await response.json();
    console.log('📥 Response:', result);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testResumeAnalysisAPI();
