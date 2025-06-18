// Debug script to check MongoDB collections and data
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function debugDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📂 Available Collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check applications collection
    console.log('\n📋 Applications Collection:');
    const applicationsCount = await db.collection('applications').countDocuments();
    console.log(`Total applications: ${applicationsCount}`);
    
    if (applicationsCount > 0) {
      console.log('\n📄 Sample Applications:');
      const sampleApps = await db.collection('applications').find().limit(3).toArray();
      sampleApps.forEach((app, index) => {
        console.log(`${index + 1}. User: ${app.userId}, Job: ${app.jobId}, Status: ${app.status}, Applied: ${app.appliedAt}`);
      });
      
      // Check applications for user 'amartya3'
      console.log('\n👤 Applications for user "amartya3":');
      const userApps = await db.collection('applications').find({ userId: 'amartya3' }).toArray();
      console.log(`Found ${userApps.length} applications for amartya3`);
      userApps.forEach((app, index) => {
        console.log(`${index + 1}. Job: ${app.jobId}, Status: ${app.status}, Applied: ${app.appliedAt}`);
      });
    }
    
    // Check jobs collection
    console.log('\n💼 Jobs Collection:');
    const jobsCount = await db.collection('jobs').countDocuments();
    console.log(`Total jobs: ${jobsCount}`);
    
    if (jobsCount > 0) {
      console.log('\n📄 Sample Jobs:');
      const sampleJobs = await db.collection('jobs').find().limit(3).toArray();
      sampleJobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} at ${job.company} (ID: ${job._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.close();
  }
}

debugDatabase();
