// Check what users exist in the database
const { MongoClient } = require('mongodb');

async function checkUsers() {
  console.log('🔍 Checking Users in Database...\n');

  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`📊 Found ${users.length} total users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.personal?.name || 'N/A'}`);
      console.log(`   Type: ${user.userType}`);
      console.log(`   Education entries: ${user.education ? user.education.length : 0}`);
      console.log(`   Work experience entries: ${user.workExperience ? user.workExperience.length : 0}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUsers();
