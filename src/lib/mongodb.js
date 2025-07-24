import { MongoClient } from 'mongodb';

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

// MongoDB options for Atlas connection - optimized for SSL issues
const options = {
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000,
  retryWrites: true,
  w: 'majority',
  ssl: true,
  sslValidate: false,
  sslCA: undefined,
  authSource: 'admin',
  useNewUrlParser: true,
  useUnifiedTopology: true
};

let client;

// Try to connect to Atlas - with multiple fallback strategies
async function createClient() {
  const connectionStrategies = [
    // Strategy 1: Standard connection with SSL bypass
    {
      name: 'Standard SSL bypass',
      options: {
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
        retryWrites: true,
        w: 'majority',
        ssl: true,
        sslValidate: false,
        authSource: 'admin',
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    // Strategy 2: No SSL validation
    {
      name: 'No SSL validation',
      options: {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        retryWrites: true,
        w: 'majority',
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        authSource: 'admin'
      }
    },
    // Strategy 3: Basic connection
    {
      name: 'Basic connection',
      options: {
        retryWrites: true,
        w: 'majority'
      }
    }
  ];

  for (const strategy of connectionStrategies) {
    try {
      console.log(`🔄 Trying MongoDB connection strategy: ${strategy.name}`);
      client = new MongoClient(uri, strategy.options);
      
      // Test the connection
      await client.connect();
      
      // Ping to verify connection
      await client.db('admin').command({ ping: 1 });
      
      console.log(`✅ MongoDB Atlas connection successful with strategy: ${strategy.name}`);
      console.log('📍 Connected to:', uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@'));
      console.log('🗂️ Database:', dbName);
      
      return client;
    } catch (error) {
      console.error(`❌ Strategy "${strategy.name}" failed:`, error.message);
      
      // Close the client if it was created
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      
      // If this is not the last strategy, continue to the next one
      if (strategy !== connectionStrategies[connectionStrategies.length - 1]) {
        continue;
      }
      
      // This was the last strategy, throw the error
      throw new Error(`All MongoDB connection strategies failed. Last error: ${error.message}`);
    }
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
    
    console.log('✅ MongoDB connection verified!');
    console.log('🗂️ Using database:', dbName);
    
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Create users collection if it doesn't exist
    if (!collections.some(c => c.name === 'users')) {
      console.log('📝 Creating users collection...');
      await db.createCollection('users');
      console.log('✅ Users collection created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    throw error;
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