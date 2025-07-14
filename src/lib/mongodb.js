import { MongoClient } from 'mongodb';
import { MockMongoClient } from './mock-mongodb.js';

// Use the full MongoDB URI directly
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';

// Extract database name from URI
let dbName;
if (uri.includes('mongodb+srv://') || uri.includes('mongodb.net')) {
  // MongoDB Atlas connection - extract database name from URI path
  const urlParts = uri.split('/');
  const dbPart = urlParts[urlParts.length - 1];
  dbName = dbPart.split('?')[0] || 'x-ceed-db';
} else {
  // Local MongoDB connection
  dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
}

console.log("MongoDB connection URI:", uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@')); // Debug log with hidden credentials
console.log("Database name:", dbName); // Debug log

// MongoDB options for Atlas connection
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority'
};

let client;
let useMockClient = false;

// Try to connect to Atlas first, fallback to mock client
async function createClient() {
  try {
    client = new MongoClient(uri, options);
    await client.connect();
    console.log('✅ MongoDB Atlas connection successful!');
    return client;
  } catch (error) {
    console.log('❌ MongoDB Atlas connection failed:', error.message);
    console.log('🔄 Falling back to mock MongoDB client for testing...');
    useMockClient = true;
    client = new MockMongoClient();
    await client.connect();
    return client;
  }
}
let clientPromise;

// Initialize the client connection
if (!clientPromise) {
  clientPromise = createClient();
}

// Test the connection immediately to verify it works
async function testConnection() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    
    if (!useMockClient) {
      console.log('MongoDB connection successful! Connected to:', uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@'));
      console.log('Using database:', dbName);
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Create users collection if it doesn't exist
      if (!collections.some(c => c.name === 'users')) {
        console.log('Creating users collection...');
        await db.createCollection('users');
        console.log('Users collection created successfully');
      }
    } else {
      console.log('Using mock database for testing');
    }
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Call the test connection function
testConnection();

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
    console.log("MongoDB connection successful!");
    console.log("Using database:", dbName);
    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}