// Script to check and clean up duplicate email entries in the database
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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
 * Find and list all users in the database
 */
async function listAllUsers() {
  let client;

  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uriWithoutDB, options);
    await client.connect();
    console.log('Connected to MongoDB successfully!');

    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);

    // Get all users
    const users = await db.collection('users').find({}, { projection: { 
      _id: 1, 
      email: 1, 
      userType: 1, 
      createdAt: 1, 
      "personal.name": 1,
      "contact.email": 1
    }}).toArray();
    
    console.log('Found', users.length, 'users in the database');
    console.log('==================================');
    
    // Print each user's info
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.personal?.name || 'N/A'}`);
      console.log(`  Contact Email: ${user.contact?.email || 'N/A'}`);
      console.log(`  Type: ${user.userType}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('----------------------------------');
    });

    return users;
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

/**
 * Find and list possible duplicate email entries
 */
async function findDuplicateEmails() {
  let client;

  try {
    client = new MongoClient(uriWithoutDB, options);
    await client.connect();
    const db = client.db(dbName);

    // Group by email (case-insensitive) and find duplicates
    const pipeline = [
      { 
        $group: { 
          _id: { $toLower: "$email" }, 
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          emails: { $push: "$email" },
          names: { $push: "$personal.name" }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ];

    const duplicates = await db.collection('users').aggregate(pipeline).toArray();
    
    if (duplicates.length === 0) {
      console.log('No duplicate emails found!');
      return [];
    }

    console.log('Found', duplicates.length, 'duplicate email groups:');
    duplicates.forEach((dup, index) => {
      console.log(`Duplicate Group ${index + 1}:`);
      console.log(`  Email: ${dup._id} (${dup.count} occurrences)`);
      console.log(`  IDs: ${dup.ids.join(', ')}`);
      console.log(`  Original Emails: ${dup.emails.join(', ')}`);
      console.log(`  Names: ${dup.names.join(', ')}`);
      console.log('----------------------------------');
    });

    return duplicates;
  } catch (error) {
    console.error('Error finding duplicate emails:', error);
    return [];
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Fix a specific user's email in the database
 */
async function fixUserEmail(userId, newEmail) {
  let client;

  try {
    client = new MongoClient(uriWithoutDB, options);
    await client.connect();
    const db = client.db(dbName);
    
    // Update user's email
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: { email: newEmail, "contact.email": newEmail } }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`Successfully updated user ${userId} with new email: ${newEmail}`);
      return true;
    } else {
      console.log(`Failed to update user ${userId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the functions
async function run() {
  console.log('=== X-CEED DATABASE USER EMAIL CHECK ===');
  await listAllUsers();
  await findDuplicateEmails();
}

run();
