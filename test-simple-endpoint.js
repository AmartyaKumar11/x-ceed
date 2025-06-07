const fetch = require('node-fetch');

async function testSimpleEndpoint() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Test simple endpoint
    console.log('🧪 Testing simple endpoint...');
    const response = await fetch('http://localhost:3002/api/applications/test-simple', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log('Simple test status:', response.status);
    const result = await response.json();
    console.log('Simple test result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleEndpoint();
