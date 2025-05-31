// Script to test MongoDB connection
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Check if .env.local file exists
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Checking for .env.local at: ${envPath}`);
if (fs.existsSync(envPath)) {
  console.log('.env.local file found');
  dotenv.config({ path: envPath });
} else {
  console.warn('.env.local file not found');
}

// Fallback to default URI if not found in .env.local

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
console.log('Attempting to connect to MongoDB at:', uri);

const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

async function testConnection() {
  const client = new MongoClient(uri, options);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    // Get database info
    const db = client.db('x-ceed-db');
    const stats = await db.stats();
    console.log('Database stats:', stats);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check users collection
    if (collections.some(c => c.name === 'users')) {
      // Count documents in users collection
      const count = await db.collection('users').countDocuments();
      console.log('Number of users in database:', count);
      
      // Get a sample user (if any)
      if (count > 0) {
        const sampleUser = await db.collection('users').findOne({}, { projection: { password: 0 } });
        console.log('Sample user:', sampleUser);
      }
    } else {
      console.log('Users collection does not exist yet');
    }
    
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

testConnection();
