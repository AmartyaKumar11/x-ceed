// Test if the API endpoint is reachable at all
const fetch = require('node-fetch');

async function testEndpointReachability() {
  try {
    console.log('Testing GET request to applications endpoint...');
    
    const response = await fetch('http://localhost:3002/api/applications/submit', {
      method: 'GET'
    });
    
    console.log('GET Response status:', response.status);
    const text = await response.text();
    console.log('GET Response:', text);
    
    console.log('\nTesting POST without auth...');
    const response2 = await fetch('http://localhost:3002/api/applications/submit', {
      method: 'POST'
    });
    
    console.log('POST Response status:', response2.status);
    const text2 = await response2.text();
    console.log('POST Response:', text2);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testEndpointReachability();
