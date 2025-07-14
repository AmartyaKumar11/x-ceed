const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testAtlasConnection() {
  console.log('🔍 Testing MongoDB Atlas connection with real database...\n');
  
  const uri = process.env.MONGODB_URI;
  console.log('📡 Connection URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@'));
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  try {
    // Connect directly to MongoDB Atlas
    const client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });
    
    console.log('🔌 Attempting to connect to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    // Get the database
    const db = client.db('x-ceed-db');
    console.log('📚 Connected to database: x-ceed-db');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📂 Collections found:', collections.map(c => c.name));
    
    // Get users from the database
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n👥 Total users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 User details:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.name || 'N/A'}`);
        console.log(`   🎭 Role: ${user.role || user.userType || 'N/A'}`);
        console.log(`   ✅ Email Verified: ${user.isEmailVerified || false}`);
        console.log(`   🔐 Has Password: ${user.password ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${user.createdAt || 'N/A'}`);
      });
      
      // Test password for first user
      if (users[0] && users[0].password) {
        console.log('\n🔐 Testing password verification for first user...');
        const testPasswords = ['password', 'password123', '123456', 'admin', users[0].email.split('@')[0]];
        
        for (const testPassword of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPassword, users[0].password);
            console.log(`   "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
            if (isValid) {
              console.log(`   🎉 Found working password: "${testPassword}"`);
            }
          } catch (error) {
            console.log(`   "${testPassword}": ❌ Error - ${error.message}`);
          }
        }
      }
    } else {
      console.log('\n⚠️ No users found in the database');
      console.log('💡 Try registering a new user first');
    }
    
    await client.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔑 Authentication issue - check username/password');
    } else if (error.message.includes('network')) {
      console.log('\n🌐 Network issue - check internet connection');
    } else if (error.message.includes('timeout')) {
      console.log('\n⏰ Timeout issue - check MongoDB Atlas cluster status');
    }
  }
}

testAtlasConnection().then(() => {
  console.log('\n🎯 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
