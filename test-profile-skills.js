// Test script for MongoDB connection and profile operations
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const DB_NAME = 'x-ceed-db';

async function main() {
  console.log('Testing profile operations...');
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users in the database`);
    
    // Find user by email
    const testUser = await db.collection('users').findOne({ email: 'kumaramartya11@gmail.com' });
    console.log('Test user found:', !!testUser);
    
    if (testUser) {
      console.log('User ID:', testUser._id);
      console.log('User Type:', testUser.userType);
      console.log('User Skills:', testUser.skills || 'No skills defined');
      
      // Add or update skills
      const updatedSkills = ['JavaScript', 'React', 'Node.js', 'MongoDB'];
      console.log('Updating skills to:', updatedSkills);
      
      const result = await db.collection('users').updateOne(
        { _id: testUser._id },
        { $set: { skills: updatedSkills, updatedAt: new Date() } }
      );
      
      console.log('Update result:', {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      });
      
      // Verify the update
      const updatedUser = await db.collection('users').findOne({ _id: testUser._id });
      console.log('Updated skills:', updatedUser.skills);
    }
  } catch (err) {
    console.error('Error in MongoDB operations:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);
