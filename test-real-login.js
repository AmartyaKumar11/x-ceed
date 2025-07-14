// Test login with actual Atlas users
const fetch = require('node-fetch');

async function testRealLogin() {
  console.log('🧪 Testing login with real MongoDB Atlas users...\n');
  
  const baseUrl = 'http://localhost:3002';
  const loginUrl = `${baseUrl}/api/auth/login`;
  
  const realUsers = [
    { email: 'amartya-applicant@gmail.com', passwords: ['password', 'password123', 'amartya', '123456'] },
    { email: 'amartya-recruiter@gmail.com', passwords: ['password', 'password123', 'amartya', '123456'] },
    { email: 'test@example.com', passwords: ['password', 'password123', 'test', '123456'] },
    { email: 'newuser@example.com', passwords: ['password', 'password123', 'newuser', '123456'] }
  ];
  
  for (const user of realUsers) {
    console.log(`\n🔍 Testing ${user.email}:`);
    
    for (const password of user.passwords) {
      try {
        console.log(`   Trying password: "${password}"`);
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ SUCCESS! Password "${password}" works for ${user.email}`);
          console.log(`   User: ${result.user.name || 'N/A'} (${result.user.role})`);
          break; // Found working password, move to next user
        } else {
          console.log(`   ❌ Failed: ${result.message}`);
        }
        
      } catch (error) {
        console.log(`   💥 Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n💡 If no passwords worked, you may need to:');
  console.log('1. Remember the exact password you used during registration');
  console.log('2. Register a new user with a known password');
  console.log('3. Reset the password for existing users');
}

testRealLogin().catch(console.error);
