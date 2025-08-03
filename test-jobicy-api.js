// Test script to verify Jobicy API integration
const testJobicyAPI = async () => {
  console.log('🧪 Testing Jobicy API integration...\n');

  try {
    // Test the API route
    const response = await fetch('http://localhost:3002/api/jobs/jobicy?count=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Test Results:');
      console.log(`   📊 Jobs fetched: ${data.jobs?.length || 0}`);
      console.log(`   📈 Total available: ${data.total || 0}`);
      console.log(`   🔗 Source: ${data.source}`);
      
      if (data.jobs && data.jobs.length > 0) {
        console.log('\n📋 Sample Jobs:');
        data.jobs.slice(0, 3).forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title}`);
          console.log(`      Company: ${job.company}`);
          console.log(`      Location: ${job.location}`);
          console.log(`      Type: ${job.type}`);
          console.log(`      Posted: ${job.postedDateRelative}`);
          console.log('');
        });
      }
    } else {
      console.error('❌ API Test Failed:', data.message);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
};

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testJobicyAPI();
} else {
  // Node.js environment
  const fetch = require('node-fetch');
  testJobicyAPI();
}

module.exports = { testJobicyAPI };
