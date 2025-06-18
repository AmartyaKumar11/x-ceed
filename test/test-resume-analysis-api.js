// Test the updated resume analysis API
import { connectDB } from '../src/lib/mongodb.js';

async function testAnalysisAPI() {
  console.log('🧪 Testing Resume Analysis API with MongoDB integration...');
  
  try {
    // First, let's check what jobs are available in the database
    const { db } = await connectDB();
    const jobs = await db.collection('jobs').find({ status: 'active' }).limit(5).toArray();
    
    console.log('📋 Available jobs in database:', jobs.length);
    if (jobs.length === 0) {
      console.log('❌ No active jobs found in database');
      return;
    }
    
    // Take the first job for testing
    const testJob = jobs[0];
    console.log('🎯 Using job for test:', {
      id: testJob._id,
      title: testJob.title,
      company: testJob.companyName,
      hasDescription: !!testJob.description
    });
    
    // Test the analysis API
    const testData = {
      jobId: testJob._id.toString(),
      resumePath: 'test-resume.pdf',
      isUploadedFile: false,
      userSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB']
    };
    
    console.log('📤 Sending test request...');
    const response = await fetch('http://localhost:3000/api/resume-match/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but that's expected
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    const result = await response.json();
    console.log('📥 Response:', result);
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test
testAnalysisAPI();
