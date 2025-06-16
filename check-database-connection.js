// Check which database is actually being used
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection and configuration...\n');

  let client;
  try {
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`MONGODB_URI: ${process.env.MONGODB_URI}`);
    console.log(`DB_NAME: ${process.env.DB_NAME}`);
    console.log('');

    // Parse the MongoDB URI to see if database name is included
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    console.log('🔗 MongoDB URI Analysis:');
    console.log(`Full URI: ${mongoUri}`);
    
    // Extract database name from URI if present
    const uriParts = mongoUri.split('/');
    const dbFromUri = uriParts[uriParts.length - 1];
    console.log(`Database from URI: ${dbFromUri}`);
    
    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    
    // Check both possible database names
    const possibleDbs = [
      process.env.DB_NAME || 'x-ceed',
      dbFromUri,
      'x-ceed-db',
      'x-ceed'
    ];
    
    console.log('\n📊 Checking databases for job collections:');
    
    for (const dbName of [...new Set(possibleDbs)]) {
      if (dbName && dbName !== 'localhost:27017') {
        try {
          const db = client.db(dbName);
          const collections = await db.listCollections().toArray();
          const hasJobs = collections.some(col => col.name === 'jobs');
          
          if (hasJobs) {
            const jobCount = await db.collection('jobs').countDocuments();
            console.log(`✅ Database: ${dbName} - Jobs collection found with ${jobCount} jobs`);
            
            if (jobCount > 0) {
              // Show some sample jobs
              const sampleJobs = await db.collection('jobs').find({}).limit(3).toArray();
              console.log('   Sample jobs:');
              sampleJobs.forEach(job => {
                console.log(`   - ${job.title} (${job.status || 'no status'}) - ${job.company || 'no company'}`);
              });
            }
          } else {
            console.log(`❌ Database: ${dbName} - No jobs collection found`);
            console.log(`   Available collections: ${collections.map(c => c.name).join(', ')}`);
          }
        } catch (error) {
          console.log(`❌ Database: ${dbName} - Error: ${error.message}`);
        }
      }
    }
    
    // List all databases
    console.log('\n🗃️ All available databases:');
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkDatabaseConnection();
