// Browser-compatible test to debug the frontend issue
// Paste this into your browser console when the AI shortlist error occurs

console.log('🔍 Frontend Debug Test');

// Test 1: Check if the API endpoint is reachable from browser
fetch('/api/ai/shortlist-candidates', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📊 GET test response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  });
  return response.text();
})
.then(text => {
  console.log('📥 GET response body:', text);
})
.catch(error => {
  console.error('❌ GET test failed:', error);
});

// Test 2: Check POST with minimal data
const testData = {
  jobId: 'test-123',
  jobTitle: 'Test Job',
  jobDescription: 'Test description',
  jobRequirements: ['JavaScript'],
  candidates: [{
    id: 'test-candidate',
    name: 'Test User',
    email: 'test@test.com',
    skills: ['JavaScript'],
    resumeText: 'Test resume text',
    appliedAt: new Date().toISOString()
  }]
};

const token = localStorage.getItem('token');
console.log('🔍 Token status:', token ? 'Token exists' : 'No token');

fetch('/api/ai/shortlist-candidates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || 'test-token'}`
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📊 POST test response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  });
  return response.text();
})
.then(text => {
  console.log('📥 POST response body:', text);
  try {
    const data = JSON.parse(text);
    console.log('✅ Parsed JSON:', data);
  } catch (e) {
    console.log('❌ Not valid JSON');
  }
})
.catch(error => {
  console.error('❌ POST test failed:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
});
