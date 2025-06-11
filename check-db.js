const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('x-ceed-db');
  
  console.log('=== USERS ===');
  const users = await db.collection('users').find({}).limit(5).toArray();
  users.forEach(user => {
    console.log(`ID: ${user._id}, Type: ${user.userType}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`);
  });
  
  console.log('\n=== APPLICATIONS ===');
  const applications = await db.collection('applications').find({}).limit(5).toArray();
  applications.forEach(app => {
    console.log(`ID: ${app._id}, Applicant: ${app.applicantId}, Job: ${app.jobId}, Status: ${app.status}`);
  });
  
  console.log('\n=== JOBS ===');
  const jobs = await db.collection('jobs').find({}).limit(5).toArray();
  jobs.forEach(job => {
    console.log(`ID: ${job._id}, Title: ${job.title}, Recruiter: ${job.recruiterId}, Status: ${job.status}`);
  });
  
  await client.close();
}

checkDatabase().catch(console.error);
