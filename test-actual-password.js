// Test login with the actual password you provided
const fetch = require('node-fetch');

async function testWithActualPassword() {
  console.log('🧪 Testing login with the actual password you provided...\n');
  
  const loginUrl = 'http://localhost:3002/api/auth/login';
  
  const credentials = {
    email: 'amartya-applicant@gmail.com',
    password: 'applicant'
  };
  
  console.log(`🔍 Testing: ${credentials.email} with password: "${credentials.password}"`);
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, result);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Login worked with your actual password!');
      console.log(`👤 User: ${result.user.name || 'N/A'}`);
      console.log(`🎭 Role: ${result.user.role}`);
      console.log(`🔑 Token: ${result.token.substring(0, 20)}...`);
      console.log('\n🎉 You can now login to the website with these credentials!');
    } else {
      console.log(`\n❌ Login failed: ${result.message}`);
      console.log('\n🤔 The password might not be correct, or there could be another issue.');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testWithActualPassword().catch(console.error);
