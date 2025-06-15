// Test script for the applications API
const axios = require('axios');

async function testApplicationsAPI() {
  console.log('🧪 Testing Applications API...\n');

  try {
    console.log('📤 Fetching recent applications...');
    const response = await axios.get('http://localhost:3002/api/applications?limit=5', {
      timeout: 10000
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.applications) {
      console.log('\n📋 Applications Summary:');
      console.log(`Total applications: ${response.data.applications.length}`);
      
      response.data.applications.forEach((app, index) => {
        console.log(`${index + 1}. ${app.jobTitle} at ${app.company}`);
        console.log(`   Status: ${app.status} | Applied: ${app.appliedDateRelative}`);
        console.log(`   Location: ${app.location || 'Not specified'}`);
        console.log('');
      });

      if (response.data.pagination) {
        console.log('📄 Pagination Info:');
        console.log(`Page: ${response.data.pagination.page}/${response.data.pagination.pages}`);
        console.log(`Total: ${response.data.pagination.total} applications`);
      }
    }

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testApplicationsAPI();
