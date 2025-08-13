// Test if the AI API is working on port 3002
async function testAPI() {
  try {
    console.log('🧪 Testing AI API on port 3002...');
    
    const response = await fetch('http://localhost:3002/api/ai/shortlist-candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        jobId: '507f1f77bcf86cd799439011',
        jobTitle: 'Test Job',
        jobDescription: 'Test description',
        jobRequirements: ['React', 'Node.js'],
        candidates: [{
          id: '507f1f77bcf86cd799439012',
          name: 'Test Candidate',
          email: 'test@email.com',
          skills: ['React', 'JavaScript'],
          resumeText: 'Test resume text',
          appliedAt: new Date().toISOString(),
          resumePath: '/test/resume.pdf'
        }]
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API is working on port 3002!', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API error on port 3002:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Error testing API on port 3002:', error.message);
  }
}

testAPI();
