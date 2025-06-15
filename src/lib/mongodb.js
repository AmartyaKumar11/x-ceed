import { MongoClient } from 'mongodb';

// Extract database name from URI or use default
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
// Make sure URI doesn't include database name - it should be passed separately
const cleanUri = uri.split('/').slice(0, 3).join('/');
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

console.log("MongoDB connection URI:", cleanUri); // Debug log
console.log("Database name:", dbName); // Debug log

// MongoDB options for better connection reliability
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
};

const client = new MongoClient(cleanUri, options);
let clientPromise;

// Test the connection immediately to verify it works
async function testConnection() {
  try {
    await client.connect();
    console.log('MongoDB connection successful! Connected to:', cleanUri);
    console.log('Using database:', dbName);
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Create users collection if it doesn't exist
    if (!collections.some(c => c.name === 'users')) {
      console.log('Creating users collection...');
      await db.createCollection('users');
      console.log('Users collection created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Call the test connection function
testConnection();

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = client.connect();
}

// Export both the client promise and a function to get the correct database
export default clientPromise;

// Helper function to get the database with the correct name
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

// Helper function for database connection (for compatibility)
export async function connectDB() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    console.log("MongoDB connection successful! Connected to:", cleanUri);
    console.log("Using database:", dbName);
    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}