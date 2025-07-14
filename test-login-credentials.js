// Test login functionality with mock users
const bcrypt = require('bcryptjs');

// Test users from mock-mongodb.js
const testUsers = [
  {
    _id: '674e2d9f8b1234567890abcd',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$kzP9Zigz9MTDesyMnbLi9Oxbgq0WlHZN7oGEZQipWdjVE7wdddzvi', // password123
    role: 'applicant',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '674e2d9f8b1234567890abce',
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2b$10$kzP9Zigz9MTDesyMnbLi9Oxbgq0WlHZN7oGEZQipWdjVE7wdddzvi', // password123
    role: 'applicant',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function testLoginCredentials() {
  console.log('🧪 Testing login credentials with mock users...\n');
  
  const testPassword = 'password123';
  
  for (const user of testUsers) {
    console.log(`Testing user: ${user.email}`);
    
    // Test password comparison
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    console.log(`  Password "${testPassword}": ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`  User role: ${user.role}`);
    console.log(`  Email verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log('');
  }
  
  // Also test if a fresh hash works
  console.log('🔧 Testing fresh password hash...');
  const freshHash = await bcrypt.hash(testPassword, 10);
  const freshHashValid = await bcrypt.compare(testPassword, freshHash);
  console.log(`Fresh hash validation: ${freshHashValid ? '✅ VALID' : '❌ INVALID'}`);
  
  console.log('\n📋 Summary:');
  console.log('Available test accounts:');
  testUsers.forEach(user => {
    console.log(`  Email: ${user.email} | Password: ${testPassword} | Role: ${user.role}`);
  });
}

testLoginCredentials().catch(console.error);
