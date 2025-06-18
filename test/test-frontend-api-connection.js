// Test the actual API endpoints that the frontend uses
// Run with: node test-frontend-api-connection.js

async function testAPIConnection() {
  console.log('🔍 Testing Frontend API Connection...\n');

  const BASE_URL = 'http://localhost:3000';

  try {
    // Test 1: Public Jobs API (what applicants see)
    console.log('1. Testing Public Jobs API...');
    try {
      const response = await fetch(`${BASE_URL}/api/jobs?public=true`);
      console.log(`   Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Success: ${data.success}`);
        console.log(`   Jobs returned: ${data.data?.length || 0}`);
        
        if (data.data && data.data.length > 0) {
          console.log('   Job titles:');
          data.data.forEach((job, index) => {
            console.log(`     ${index + 1}. "${job.title}" (Status: ${job.status})`);
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   Connection Error: ${error.message}`);
    }

    console.log('\n2. Testing API Server Status...');
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      if (healthResponse.ok) {
        console.log('   ✅ API server is running');
      } else {
        console.log('   ⚠️  API server responded with error');
      }
    } catch (error) {
      console.log('   ❌ API server may not be running');
      console.log('   Make sure to start your Next.js dev server: npm run dev');
    }

    console.log('\n3. Browser Cache Check...');
    console.log('   📋 To clear frontend cache:');
    console.log('   1. Open browser Developer Tools (F12)');
    console.log('   2. Right-click refresh button');
    console.log('   3. Select "Empty Cache and Hard Reload"');
    console.log('   4. Or go to Application tab > Storage > Clear storage');

    console.log('\n4. Frontend Component Check...');
    console.log('   🔍 The jobs are fetched by RealJobsComponent.jsx');
    console.log('   📄 Check browser Network tab to see if API calls are being made');
    console.log('   🔗 API endpoint: /api/jobs?public=true');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test if we're in a Node.js environment with fetch
if (typeof fetch === 'undefined') {
  // Use node-fetch for older Node versions
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
  } catch (error) {
    console.log('📦 Installing node-fetch for API testing...');
    console.log('Run: npm install node-fetch');
    console.log('Or test the API directly in browser console');
    process.exit(1);
  }
}

testAPIConnection()
  .then(() => console.log('\n🎯 API connection test completed'))
  .catch(console.error);
