const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkTestUser() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('xceed_dashboard');
    const users = db.collection('users');
    
    // Check for test user
    const testUser = await users.findOne({ email: 'test-applicant@example.com' });
    
    if (testUser) {
      console.log('✅ Test user found:');
      console.log('Email:', testUser.email);
      console.log('UserType:', testUser.userType);
      console.log('Created:', testUser.createdAt);
      console.log('Has resume:', !!testUser.resume);
    } else {
      console.log('❌ Test user not found');
      
      // Let's check what users exist
      console.log('\n📋 All users in database:');
      const allUsers = await users.find({}).toArray();
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}, Type: ${user.userType}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkTestUser();
