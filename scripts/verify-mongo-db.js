// Script to verify MongoDB connection and set up collections
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Checking for .env.local at: ${envPath}`);
if (fs.existsSync(envPath)) {
  console.log('.env.local file found');
  dotenv.config({ path: envPath });
} else {
  console.warn('.env.local file not found');
}

// Get MongoDB URI from environment or use default
let uri = process.env.MONGODB_URI;
if (!uri) {
  uri = 'mongodb://localhost:27017';
  console.log(`No MONGODB_URI found in environment, using default: ${uri}`);
} else {
  console.log(`Found MONGODB_URI in environment: ${uri}`);
}

// Extract database name or use default
const uriParts = uri.split('/');
let dbName;

if (uriParts.length >= 4) {
  dbName = uriParts[3].split('?')[0];
  // Remove database name from connection string
  uri = uriParts.slice(0, 3).join('/');
} else {
  dbName = 'x-ceed-db';
}

console.log(`Connection URI: ${uri}`);
console.log(`Database name: ${dbName}`);

// MongoDB options for reliability
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
};

async function setupDatabase() {
  const client = new MongoClient(uri, options);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    // List all databases
    const databasesList = await client.db().admin().listDatabases();
    console.log('Available databases:');
    databasesList.databases.forEach(db => {
      console.log(` - ${db.name}`);
    });
    
    // Get or create our database
    const db = client.db(dbName);
    console.log(`\nUsing database: ${dbName}`);
    
    // List collections in our database
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    if (collections.length === 0) {
      console.log('  (no collections found)');
    } else {
      collections.forEach(collection => {
        console.log(` - ${collection.name}`);
      });
    }
    
    // Create users collection if it doesn't exist
    if (!collections.some(c => c.name === 'users')) {
      console.log('\nCreating users collection...');
      await db.createCollection('users');
      console.log('Users collection created successfully');
    } else {
      console.log('\nUsers collection already exists');
      
      // Check users count
      const count = await db.collection('users').countDocuments();
      console.log(`Users collection contains ${count} documents`);
      
      if (count > 0) {
        const sample = await db.collection('users').find({}).limit(1).toArray();
        console.log('Sample user (fields only):');
        console.log(Object.keys(sample[0]).join(', '));
      }
    }
    
    console.log('\nDatabase setup complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

setupDatabase().catch(console.error);
