// Simple browser test to check if the issue is URL-related
console.log('🔍 Testing current page URL...');
console.log('Current URL:', window.location.href);
console.log('Base URL:', window.location.origin);

// Test the API endpoint
async function testEndpoint() {
  try {
    console.log('🧪 Testing API endpoint from browser...');
    const response = await fetch('/api/ai/shortlist-candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: 'test',
        jobTitle: 'Test',
        jobDescription: 'Test',
        jobRequirements: [],
        candidates: []
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response URL:', response.url);
    
    if (response.status === 401) {
      console.log('✅ API endpoint found (got auth error as expected)');
    } else if (response.status === 404) {
      console.log('❌ API endpoint not found');
    } else {
      console.log('📊 Unexpected status, but endpoint exists');
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testEndpoint();
