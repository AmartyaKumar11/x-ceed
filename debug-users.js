// Debug script to check users in database
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    console.log('Database name:', db.databaseName);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log('\n=== USERS IN DATABASE ===');
    console.log('Total users:', users.length);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('User Type:', user.userType);
      console.log('Created:', user.createdAt);
    });
    
    // Check for recruiter users specifically
    const recruiters = users.filter(user => user.userType === 'recruiter');
    console.log('\n=== RECRUITER USERS ===');
    console.log('Total recruiters:', recruiters.length);
    
    recruiters.forEach((recruiter, index) => {
      console.log(`\nRecruiter ${index + 1}:`);
      console.log('ID:', recruiter._id);
      console.log('Email:', recruiter.email);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();
