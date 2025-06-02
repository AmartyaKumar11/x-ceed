const fetch = require('node-fetch');

async function testLoginDirect() {
  try {
    console.log('🔍 Testing login API directly...');
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify({
        email: 'test-applicant@example.com',
        password: 'testpassword123'
      })
    });
    
    console.log('📝 Response status:', response.status);
    console.log('📝 Response headers:', Object.fromEntries(response.headers));
    
    const responseData = await response.text();
    console.log('📝 Response body (raw):', responseData);
    
    try {
      const jsonData = JSON.parse(responseData);
      console.log('📝 Response body (parsed):', jsonData);
    } catch (e) {
      console.log('❌ Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLoginDirect();
