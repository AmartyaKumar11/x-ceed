const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all users with basic info (excluding passwords)
    const users = await db.collection('users').find({}, {
      projection: {
        email: 1,
        userType: 1,
        createdAt: 1,
        'personal.name': 1,
        'recruiter.name': 1
      }
    }).toArray();
    
    console.log('\nExisting users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Type: ${user.userType}`);
      console.log(`   Name: ${user.userType === 'applicant' ? user.personal?.name : user.recruiter?.name || 'N/A'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();
