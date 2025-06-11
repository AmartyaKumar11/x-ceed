// Test the actual API endpoint via HTTP request
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET;

async function testActualAPIEndpoint() {
  console.log('🌐 TESTING ACTUAL API ENDPOINT');
  console.log('==============================\n');
  
  try {
    // Create a JWT token for a recruiter
    const token = jwt.sign(
      { 
        userId: '683b0279ec13c9a203e81bed', // Recruiter ID from previous test
        userType: 'recruiter',
        email: 're234@microsoft.com'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const applicationId = '6849739d7c2074ed331c0e53'; // Application ID from previous test
    
    console.log('🔍 Testing API endpoint...');
    console.log(`   URL: http://localhost:3000/api/applications/${applicationId}`);
    console.log(`   Method: PATCH`);
    console.log(`   Status to update: rejected (to test different status)`);
    
    // Test the API endpoint
    const response = await fetch(`http://localhost:3000/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'rejected' })
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response status text: ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('🎉 API call successful!');
        console.log(`   Status updated to: ${data.data?.status || 'unknown'}`);
      } else {
        console.log('❌ API returned success: false');
        console.log(`   Message: ${data.message}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed');
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - Development server is not running');
      console.log('');
      console.log('🚀 TO FIX THE ISSUE:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Make sure the server is running on http://localhost:3000');
      console.log('3. Then try clicking the accept button again');
    } else {
      console.log('❌ Error testing API endpoint:', error.message);
    }
  }
}

// Run the test
testActualAPIEndpoint().catch(console.error);
