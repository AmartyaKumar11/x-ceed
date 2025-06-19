// Test script for Google APIs integration
// Run with: node test-google-integration.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testGoogleIntegration() {
  console.log('🧪 Testing Google APIs Integration...\n');

  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  console.log('- GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing');
  console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_CLIENT_ID) {
    console.log('❌ No Google API credentials found.');
    console.log('📖 Please follow the setup guide in GOOGLE_SETUP_GUIDE.md');
    return;
  }

  try {
    // Test API endpoint
    console.log('🌐 Testing API Endpoint...');
      const testData = {
      action: 'create_doc_for_video',
      data: {
        videoTitle: 'Test Video - API Integration',
        videoChannel: 'Test Channel',
        videoId: 'test_video_123'
      }
    };

    // Note: This requires the Next.js server to be running
    const response = await fetch('http://localhost:3002/api/google-integration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Test Successful!');
      console.log('📊 Result:', result);
    } else {
      console.log('❌ API Test Failed:', response.status, response.statusText);
      const error = await response.text();
      console.log('Error details:', error);
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure your Next.js server is running on port 3002');
      console.log('   Run: npm run dev');
    }
  }
}

// Run the test
testGoogleIntegration().catch(console.error);
