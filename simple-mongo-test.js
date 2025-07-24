const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env.local' });

console.log('🔧 Simple MongoDB Diagnostic Test');
console.log('================================');

// Environment check
const uri = process.env.MONGODB_URI;
console.log('✅ MONGODB_URI found:', uri ? 'Yes' : 'No');
console.log('📍 Connection string:', uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@') : 'NOT FOUND');

if (!uri) {
  console.log('❌ No MongoDB URI found in environment variables');
  process.exit(1);
}

// Extract database name
const dbName = uri.split('/').pop().split('?')[0];
console.log('🗂️ Database name:', dbName);

async function simpleTest() {
  console.log('\n🧪 Testing connection...');
  
  // Most basic connection possible
  const client = new MongoClient(uri);
  
  try {
    console.log('   Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('   Testing ping...');
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Ping successful!');
    
    console.log('   Listing collections...');
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`, collections.map(c => c.name));
    
    if (collections.find(c => c.name === 'users')) {
      console.log('   Checking users collection...');
      const users = db.collection('users');
      const count = await users.countDocuments();
      console.log(`✅ Users collection has ${count} documents`);
      
      // Try to find a specific user
      const testUser = await users.findOne({ email: 'amartya-applicant@gmail.com' });
      console.log('✅ Test user found:', testUser ? 'Yes' : 'No');
    }
    
    console.log('\n🎉 ALL TESTS PASSED! MongoDB connection is working.');
    
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    
    // Specific error analysis
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔍 SSL/TLS Error Detected:');
      console.log('- This might be a certificate validation issue');
      console.log('- Try updating your MongoDB driver: npm update mongodb');
      console.log('- Check MongoDB Atlas network access settings');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔍 Authentication Error:');
      console.log('- Check username/password in connection string');
      console.log('- Verify database user exists in MongoDB Atlas');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n🔍 Connection Timeout:');
      console.log('- Check network connectivity');
      console.log('- Verify IP whitelist in MongoDB Atlas');
    }
    
    process.exit(1);
  } finally {
    await client.close();
  }
}

simpleTest();
