const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testLogin() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Test credentials
    const testEmail = 're234@microsoft.com';
    const testPassword = 're234123';
    
    console.log(`Testing login for: ${testEmail}`);
    console.log(`Testing password: ${testPassword}`);
    
    // Find user by email
    const user = await db.collection('users').findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found');
    console.log('User type:', user.userType);
    console.log('User created:', user.createdAt);
    
    // Test password
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is correct!');
      console.log('You should be able to login with:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    } else {
      console.log('❌ Password is incorrect');
      console.log('Let me check what the password should be...');
      
      // Try different password variations
      const variations = [
        're234123',
        'Re234123',
        're234@microsoft.com123',
        're234',
        'password123',
        '123456'
      ];
      
      console.log('Testing password variations...');
      for (const variation of variations) {
        const isValid = await bcrypt.compare(variation, user.password);
        if (isValid) {
          console.log(`✅ Correct password found: ${variation}`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testLogin();
