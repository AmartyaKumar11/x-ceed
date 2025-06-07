// Test direct access to the jobs API to ensure authentication works
const fetch = require('node-fetch');

async function testJobsAPI() {
  try {
    console.log('Testing jobs API access...');
    
    // Test without authentication first
    const response = await fetch('http://localhost:3002/api/jobs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success && data.data) {
      console.log(`Found ${data.data.length} jobs`);
      data.data.forEach(job => {
        console.log(`- ${job.title} (ID: ${job._id}) - Status: ${job.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing jobs API:', error);
  }
}

testJobsAPI();
