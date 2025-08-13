// Test script to debug AI shortlisting API
const fetch = require('node-fetch');

async function testAIAPI() {
  console.log('🧪 Testing AI Shortlisting API...');
  
  const testData = {
    jobId: 'test-job-123',
    jobTitle: 'Software Developer',
    jobDescription: 'We are looking for a skilled software developer with React experience.',
    jobRequirements: ['React', 'JavaScript', 'Node.js'],
    candidates: [
      {
        id: 'test-candidate-1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['React', 'JavaScript'],
        resumeText: 'Experienced React developer with 3 years of experience in building web applications.',
        appliedAt: new Date().toISOString()
      }
    ]
  };

  try {
    console.log('📤 Sending request to API...');
    const response = await fetch('http://localhost:3002/api/ai/shortlist-candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIAPI();
