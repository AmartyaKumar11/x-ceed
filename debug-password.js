const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function debugPassword() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get a specific user to test
    const testEmail = 'something@gmail.com';
    const user = await db.collection('users').findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found:', testEmail);
      return;
    }
    
    console.log('✅ User found:', testEmail);
    console.log('User type:', user.userType);
    console.log('Stored password hash:', user.password);
    
    // Test different password variations
    const passwordsToTest = [
      'something123',  // Expected pattern
      'something',     // Just the base
      'Something123',  // Capitalized
      'SOMETHING123',  // All caps
    ];
    
    console.log('\nTesting password variations:');
    for (const testPassword of passwordsToTest) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      } catch (error) {
        console.log(`Password "${testPassword}": ❌ Error - ${error.message}`);
      }
    }
    
    // Also test creating a new hash to see if bcrypt is working
    console.log('\n--- Testing bcrypt functionality ---');
    const testPlaintext = 'something123';
    const newHash = await bcrypt.hash(testPlaintext, 10);
    console.log('New hash created:', newHash);
    const verifyNewHash = await bcrypt.compare(testPlaintext, newHash);
    console.log('New hash verification:', verifyNewHash ? '✅ WORKS' : '❌ FAILED');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugPassword();
