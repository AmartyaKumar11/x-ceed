// Script to test and verify the X-CEED recruitment platform
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading environment from:', envPath);
  dotenv.config({ path: envPath });
}

// Get connection string and database name
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const uriWithoutDB = uri.split('/').slice(0, 3).join('/');
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

console.log('MongoDB URI:', uriWithoutDB);
console.log('Database name:', dbName);

// MongoDB connection options
const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
};

/**
 * Tests the MongoDB connection and verifies collections
 */
async function testMongoDBConnection() {
  let client;

  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uriWithoutDB, options);
    await client.connect();
    console.log('Connected to MongoDB successfully!');

    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);

    // Check collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);

    // Required collections for X-CEED platform
    const requiredCollections = ['users', 'jobs', 'applications', 'notifications'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
    
    if (missingCollections.length > 0) {
      console.log('Missing collections:', missingCollections);
      
      // Create missing collections
      for (const collection of missingCollections) {
        console.log(`Creating collection: ${collection}`);
        await db.createCollection(collection);
        console.log(`Collection ${collection} created`);
      }
    } else {
      console.log('All required collections exist');
    }

    // Show user count
    const userCount = await db.collection('users').countDocuments();
    console.log(`Number of users in database: ${userCount}`);
    
    if (userCount > 0) {
      // Sample a user without revealing passwords
      const sampleUser = await db.collection('users')
        .findOne({}, { projection: { password: 0 } });
      console.log('Sample user data:', JSON.stringify(sampleUser, null, 2));
    }

    return true;
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return false;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

/**
 * Creates a test user directly in the database
 */
async function createTestUserInDB() {
  let client;

  try {
    console.log('Creating test user directly in database...');
    client = new MongoClient(uriWithoutDB, options);
    await client.connect();
    
    const db = client.db(dbName);
    
    // Generate today's date and 21 years ago for DOB
    const today = new Date();
    const dob = new Date(today);
    dob.setFullYear(dob.getFullYear() - 21);
    
    // Create test user
    const testUser = {
      email: `testuser_${Date.now()}@example.com`,
      password: await bcrypt.hash('TestPassword123!', 10),
      userType: 'applicant',
      createdAt: today,
      updatedAt: today,
      personal: {
        name: 'Test User',
        address: '123 Test Street, Test City, 12345',
        dob: dob,
        sex: 'Female'
      },
      education: [{
        degree: 'Bachelor of Science',
        institution: 'Test University',
        address: 'Test University Campus, Test City',
        startDate: new Date(2020, 8, 1),  // Sept 1, 2020
        endDate: new Date(2024, 5, 1),    // June 1, 2024
        grade: '3.8 GPA'
      }],
      contact: {
        phone: '1234567890',
        alternatePhone: '',
        email: `testuser_${Date.now()}@example.com`
      },
      workExperience: [{
        company: 'Test Company',
        position: 'Intern',
        description: 'Worked on various projects',
        startDate: new Date(2023, 5, 1),   // June 1, 2023
        endDate: new Date(2023, 8, 1)      // Sept 1, 2023
      }]
    };
    
    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email: testUser.email });
    if (existingUser) {
      console.log(`User with email ${testUser.email} already exists`);
      return existingUser;
    }
    
    // Insert the user
    const result = await db.collection('users').insertOne(testUser);
    console.log(`Test user created with ID: ${result.insertedId}`);
    
    // Return user without password
    const { password, ...userWithoutPassword } = testUser;
    return { ...userWithoutPassword, _id: result.insertedId };
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== X-CEED RECRUITMENT PLATFORM TESTS ===');
  
  // Test MongoDB connection
  console.log('\n--- Testing MongoDB Connection ---');
  const dbConnectionSuccess = await testMongoDBConnection();
  if (!dbConnectionSuccess) {
    console.error('MongoDB connection test failed. Please check your MongoDB installation and configuration.');
    process.exit(1);
  }
  
  // Create a test user in the database
  try {
    console.log('\n--- Creating Test User ---');
    const testUser = await createTestUserInDB();
    console.log('Test user created successfully:', testUser.email);
  } catch (error) {
    console.error('Failed to create test user:', error.message);
  }
  
  console.log('\n=== TESTS COMPLETED ===');
}

// Run all tests
runTests();
