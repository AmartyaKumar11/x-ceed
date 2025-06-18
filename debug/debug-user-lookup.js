const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function testUserLookup() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('🔍 Testing User Lookup...\n');
    
    // Get an application with userId
    const app = await db.collection('applications').findOne({});
    console.log('Sample application userId:', app.userId);
    
    // Try to find user by _id using the userId as ObjectId
    try {
      const user = await db.collection('users').findOne({ _id: new ObjectId(app.userId) });
      if (user) {
        console.log('✅ Found user by _id:');
        console.log('- Name:', user.name);
        console.log('- Email:', user.email);
        console.log('- Phone:', user.phone);
      } else {
        console.log('❌ No user found with _id matching userId');
      }
    } catch (error) {
      console.log('❌ Error converting userId to ObjectId:', error.message);
    }
    
    // Check if there's any users collection where we might find the user
    const userByStringId = await db.collection('users').findOne({ _id: app.userId });
    if (userByStringId) {
      console.log('✅ Found user by string _id');
    } else {
      console.log('❌ No user found by string _id either');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testUserLookup();
