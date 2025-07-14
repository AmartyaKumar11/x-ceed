// Test database connection and check for users
const { MongoClient } = require('mongodb');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  // Try local MongoDB first
  const localUri = 'mongodb://localhost:27017/x-ceed-db';
  console.log('Attempting to connect to local MongoDB:', localUri);
  
  try {
    const client = new MongoClient(localUri);
    await client.connect();
    console.log('✅ Connected to local MongoDB successfully!');
    
    const db = client.db('x-ceed-db');
    const users = await db.collection('users').find({}).toArray();
    console.log('📊 Users in database:', users.length);
    
    if (users.length > 0) {
      console.log('👥 Sample users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}, Role: ${user.role || 'N/A'}`);
      });
    } else {
      console.log('⚠️ No users found in database');
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.log('❌ Local MongoDB connection failed:', error.message);
    
    // Test if it's using mock client
    console.log('\n🔄 Testing mock client behavior...');
    try {
      // Import the mongodb.js module to test mock behavior
      const clientPromise = require('./src/lib/mongodb.js').default;
      const client = await clientPromise;
      const db = client.db('x-ceed-db');
      
      console.log('📦 Using mock database client');
      const users = await db.collection('users').find({}).toArray();
      console.log('👥 Mock users found:', users.length);
      
      if (users.length > 0) {
        console.log('Sample mock users:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}, Role: ${user.role || 'N/A'}`);
        });
      }
      
      return true;
    } catch (mockError) {
      console.log('❌ Mock client also failed:', mockError.message);
      return false;
    }
  }
}

// Run the test
testDatabaseConnection().then(() => {
  console.log('\n🎯 Database connection test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
