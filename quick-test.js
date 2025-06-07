// Quick test to see server logs
const fetch = require('node-fetch');

async function quickTest() {
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
    
    const loginData = await loginResponse.text();
    console.log('Login response:', loginData);
    
    const loginJson = JSON.parse(loginData);
    if (loginJson.token) {
      console.log('✅ Got token, now testing job application endpoint...');
      
      // Test the job application endpoint with minimal data
      const testResponse = await fetch('http://localhost:3002/api/applications/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginJson.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: '683bf254b60ebfeacf11bf94',
          test: 'data'
        })
      });
      
      const testData = await testResponse.text();
      console.log('Application test response status:', testResponse.status);
      console.log('Application test response:', testData);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest();
