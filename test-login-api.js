// Test the login API endpoint directly
const fetch = require('node-fetch');

async function testLoginAPI() {
  console.log('🧪 Testing login API endpoint...\n');
  
  const baseUrl = 'http://localhost:3002';
  const loginUrl = `${baseUrl}/api/auth/login`;
  
  const testCredentials = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'john@example.com', password: 'password123' },
    { email: 'test@example.com', password: 'wrongpassword' }, // Should fail
  ];
  
  for (const [index, credentials] of testCredentials.entries()) {
    console.log(`Test ${index + 1}: ${credentials.email} with password "${credentials.password}"`);
    
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      const result = await response.json();
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Response:`, result);
      
      if (response.ok) {
        console.log(`  ✅ Login successful!`);
        if (result.user) {
          console.log(`  User: ${result.user.name} (${result.user.email})`);
          console.log(`  Role: ${result.user.role}`);
        }
        if (result.token) {
          console.log(`  Token received: ${result.token.substring(0, 20)}...`);
        }
      } else {
        console.log(`  ❌ Login failed: ${result.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`  💥 Request failed: ${error.message}`);
    }
    
    console.log('');
  }
}

testLoginAPI().catch(console.error);
