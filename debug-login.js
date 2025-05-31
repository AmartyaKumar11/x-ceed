const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Test specific email
    const testEmail = 're234@microsoft.com';
    
    console.log(`Looking for user with email: ${testEmail}`);
    
    // Find user by exact email match
    const user = await db.collection('users').findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found with exact match');
      
      // Try case-insensitive search
      const userCaseInsensitive = await db.collection('users').findOne({ 
        email: { $regex: new RegExp('^' + testEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } 
      });
      
      if (userCaseInsensitive) {
        console.log('✅ Found user with case-insensitive search');
        console.log('Actual email in DB:', userCaseInsensitive.email);
      } else {
        console.log('❌ User not found even with case-insensitive search');
      }
      return;
    }
    
    console.log('✅ User found');
    console.log('Email in DB:', user.email);
    console.log('User type:', user.userType);
    console.log('Has password:', !!user.password);
    console.log('Password hash length:', user.password?.length);
    console.log('Password hash starts with:', user.password?.substring(0, 20));
    
    // Test various password combinations
    const passwordsToTest = [
      're234123',
      're234@microsoft.com123',
      're234',
      'password',
      '123456',
      'admin123',
      'recruiter123'
    ];
    
    console.log('\nTesting password combinations...');
    
    for (const password of passwordsToTest) {
      try {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        
        if (isValid) {
          console.log(`🎉 FOUND CORRECT PASSWORD: "${password}"`);
          break;
        }
      } catch (error) {
        console.log(`Password "${password}": ❌ Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugLogin();
