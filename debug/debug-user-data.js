const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function debugUserData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('👤 Debugging User Data...\n');
    
    // Get sample users
    const users = await db.collection('users').find({}).limit(5).toArray();
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, i) => {
      console.log(`\nUser ${i + 1}:`);
      console.log('- _id:', user._id);
      console.log('- userId:', user.userId);
      console.log('- name:', user.name);
      console.log('- email:', user.email);
      console.log('- phone:', user.phone);
    });
    
    // Get sample applications to see what userIds they have
    console.log('\n📋 Sample Applications with UserIds:');
    const applications = await db.collection('applications').find({}).limit(5).toArray();
    applications.forEach((app, i) => {
      console.log(`\nApplication ${i + 1}:`);
      console.log('- _id:', app._id);
      console.log('- userId:', app.userId);
      console.log('- jobId:', app.jobId);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugUserData();
