const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function checkUserCredentials() {
  const uri = 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    const user = await db.collection('users').findOne({ email: 'kumaramartya11@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:');
    console.log('Email:', user.email);
    console.log('UserType:', user.userType);
    console.log('Password hash:', user.password?.substring(0, 20) + '...');
    
    // Test common passwords
    const testPasswords = ['password123', 'password', '123456', 'test123', 'admin'];
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`Testing "${testPassword}":`, isValid ? '✅' : '❌');
      if (isValid) {
        console.log(`✅ Correct password is: ${testPassword}`);
        break;
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUserCredentials();
