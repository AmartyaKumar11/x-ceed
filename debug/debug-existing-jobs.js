// Debug script to check current job statuses in database
// Run with: node debug-existing-jobs.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugExistingJobs() {
  console.log('🔍 Debugging existing jobs in database...\n');

  let client;
  try {    // Connect to MongoDB - Fixed database connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    let dbName;
    
    // Extract database name from URI
    if (mongoUri.includes('/') && !mongoUri.endsWith('/')) {
      const uriParts = mongoUri.split('/');
      dbName = uriParts[uriParts.length - 1];
    } else {
      dbName = process.env.DB_NAME || 'x-ceed-db';
    }
    
    console.log(`🔗 Connecting to: ${mongoUri}`);
    console.log(`📋 Using database: ${dbName}`);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    console.log('📊 Current job statistics:');
    
    // Get all jobs with their statuses
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`Total jobs in database: ${allJobs.length}`);

    // Group by status
    const statusCounts = {};
    allJobs.forEach(job => {
      const status = job.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Jobs by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} jobs`);
    });

    // Check for jobs that should be hidden but might still be visible
    const now = new Date();
    const problematicJobs = allJobs.filter(job => {
      // Jobs that should be hidden from applicants
      if (job.status === 'closed' || job.status === 'deleted') {
        return true;
      }
      // Jobs that are expired
      if (job.applicationEnd && new Date(job.applicationEnd) < now) {
        return true;
      }
      return false;
    });

    console.log(`\n⚠️  Jobs that should be hidden: ${problematicJobs.length}`);
    if (problematicJobs.length > 0) {
      console.log('\n🔍 Hidden jobs details:');
      problematicJobs.forEach((job, index) => {
        console.log(`${index + 1}. "${job.title}"`);
        console.log(`   Status: ${job.status || 'undefined'}`);
        console.log(`   Application End: ${job.applicationEnd || 'No deadline'}`);
        console.log(`   Created: ${job.createdAt}`);
        console.log(`   ID: ${job._id}`);
        console.log('');
      });
    }

    // Check what the public API query would return
    const publicVisibleJobs = await db.collection('jobs').find({
      status: 'active',
      $or: [
        { applicationEnd: { $gte: now } },
        { applicationEnd: { $exists: false } },
        { applicationEnd: null }
      ]
    }).toArray();

    console.log(`✅ Jobs visible to applicants (API query): ${publicVisibleJobs.length}`);
    if (publicVisibleJobs.length > 0) {
      console.log('\n📋 Currently visible jobs:');
      publicVisibleJobs.forEach((job, index) => {
        console.log(`${index + 1}. "${job.title}" (Status: ${job.status})`);
      });
    }

    // Suggest cleanup actions
    if (problematicJobs.length > 0) {
      console.log('\n🛠️  Suggested actions:');
      console.log('1. Update job statuses to "closed" if needed');
      console.log('2. Clear browser cache and refresh the applicant job page');
      console.log('3. Check if frontend is properly calling the public API');
      
      console.log('\n💡 Would you like to automatically close all problematic jobs? (Run with --fix flag)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function fixProblematicJobs() {
  console.log('🔧 Fixing problematic jobs...\n');

  let client;
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'x-ceed';
    
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    const now = new Date();
    
    // Update expired jobs to closed
    const expiredResult = await db.collection('jobs').updateMany(
      {
        status: 'active',
        applicationEnd: { $lt: now, $ne: null }
      },
      {
        $set: {
          status: 'closed',
          updatedAt: new Date(),
          closedReason: 'Expired - Application deadline passed'
        }
      }
    );

    console.log(`✅ Updated ${expiredResult.modifiedCount} expired jobs to closed status`);

    // Optionally, you can also clean up any jobs with undefined status
    const undefinedStatusResult = await db.collection('jobs').updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]
      },
      {
        $set: {
          status: 'active',
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Fixed ${undefinedStatusResult.modifiedCount} jobs with undefined status`);

  } catch (error) {
    console.error('❌ Error during fix:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--fix')) {
  fixProblematicJobs()
    .then(() => debugExistingJobs())
    .then(() => console.log('\n🎉 Job cleanup completed!'))
    .catch(console.error);
} else {
  debugExistingJobs()
    .then(() => console.log('\n💡 Run with --fix flag to automatically update problematic jobs'))
    .catch(console.error);
}
