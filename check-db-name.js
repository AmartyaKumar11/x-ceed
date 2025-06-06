// Quick test to check database name consistency
const { MongoClient } = require('mongodb');

async function checkDatabaseNames() {
  // Check environment variable
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  console.log('Environment URI:', uri);
  
  // Extract database name like the code does
  const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
  console.log('Extracted database name:', dbName);
  
  // Check what the MongoDB lib is doing
  const cleanUri = uri.split('/').slice(0, 3).join('/');
  console.log('Clean URI:', cleanUri);
  
  console.log('\n--- Expected vs Actual ---');
  console.log('Expected DB: job-portal');
  console.log('Actual DB:', dbName);
  
  // The issue is that job-portal DB has the jobs, but the code is using x-ceed-db
  if (dbName !== 'job-portal') {
    console.log('\n❌ DATABASE MISMATCH FOUND!');
    console.log('Jobs are in "job-portal" database but code is using:', dbName);
  }
}

checkDatabaseNames();
