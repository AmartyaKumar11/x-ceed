// Quick test for AI Shortlisting API
console.log('🧪 Testing AI Shortlisting API...');

// Test with a simple fetch to see if the API responds
async function quickTest() {
  try {
    const response = await fetch('http://localhost:3002/api/ai/shortlist-candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: 'test-job-id'
      })
    });

    console.log('📊 Response Status:', response.status);
    
    const data = await response.json();
    console.log('📋 Response Data:', data);
    
    if (data.success) {
      console.log('✅ API is working!');
    } else {
      console.log('⚠️ API returned error:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
quickTest();
