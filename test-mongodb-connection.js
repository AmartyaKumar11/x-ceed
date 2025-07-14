const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
console.log('Testing MongoDB connection...');
console.log('URI:', uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@') : 'NOT FOUND');

async function testConnection() {
  const options = {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  };
  
  const client = new MongoClient(uri, options);
  
  try {
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db('x-ceed-db');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
