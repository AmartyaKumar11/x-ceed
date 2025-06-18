// Debug script to check why applications aren't showing in recruiter's candidates section
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugRecruiterCandidates() {
  console.log('🔍 Debugging Recruiter Candidates View Issue...\n');

  let client;
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    let dbName;
    
    // Extract database name from URI
    if (mongoUri.includes('/') && !mongoUri.endsWith('/')) {
      const uriParts = mongoUri.split('/');
      dbName = uriParts[uriParts.length - 1].split('?')[0];
    } else {
      dbName = process.env.DB_NAME || 'x-ceed-db';
    }
    
    console.log(`🔗 Connecting to: ${mongoUri}`);
    console.log(`📋 Using database: ${dbName}`);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    // 1. Check application data integrity
    console.log('\n📊 APPLICATION DATA INTEGRITY CHECK:');
    const allApplications = await db.collection('applications').find({}).toArray();
    console.log(`Total applications: ${allApplications.length}`);
    
    // Check for missing userIds
    const applicationsWithoutUserId = allApplications.filter(app => !app.userId || app.userId === null || app.userId === undefined);
    console.log(`❌ Applications with missing userId: ${applicationsWithoutUserId.length}`);
    
    if (applicationsWithoutUserId.length > 0) {
      console.log('Sample applications with missing userId:');
      applicationsWithoutUserId.slice(0, 3).forEach((app, index) => {
        console.log(`  ${index + 1}. JobId: ${app.jobId}, Status: ${app.status}, Applied: ${app.appliedAt}`);
      });
    }

    // Check for missing jobIds
    const applicationsWithoutJobId = allApplications.filter(app => !app.jobId || app.jobId === null || app.jobId === undefined);
    console.log(`❌ Applications with missing jobId: ${applicationsWithoutJobId.length}`);

    // 2. Check recruiter's perspective - what they should see
    console.log('\n👨‍💼 RECRUITER PERSPECTIVE CHECK:');
    
    // Get all jobs (assuming recruiter can see all jobs they posted)
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`Total jobs in system: ${allJobs.length}`);
    
    // For each job, check applications
    const jobsWithApplications = [];
    for (const job of allJobs) {
      const applications = await db.collection('applications').find({ jobId: job._id.toString() }).toArray();
      if (applications.length > 0) {
        jobsWithApplications.push({
          jobId: job._id,
          jobTitle: job.title,
          company: job.company,
          applicationCount: applications.length,
          applications: applications
        });
      }
    }
    
    console.log(`\n📋 Jobs with applications: ${jobsWithApplications.length}`);
    
    if (jobsWithApplications.length > 0) {
      console.log('\nDetailed breakdown:');
      jobsWithApplications.forEach((job, index) => {
        console.log(`\n${index + 1}. "${job.jobTitle}" at ${job.company || 'Unknown Company'}`);
        console.log(`   Job ID: ${job.jobId}`);
        console.log(`   Applications: ${job.applicationCount}`);
        
        job.applications.forEach((app, appIndex) => {
          console.log(`   ${appIndex + 1}. Applicant: ${app.applicantName || app.userId || 'Unknown'}`);
          console.log(`      Status: ${app.status || 'No status'}`);
          console.log(`      Applied: ${app.appliedAt || 'No date'}`);
          console.log(`      UserId: ${app.userId || 'MISSING'}`);
          console.log(`      Email: ${app.applicantEmail || 'No email'}`);
        });
      });
    } else {
      console.log('❌ NO JOBS HAVE APPLICATIONS - This is likely the main issue!');
    }

    // 3. Check if there's a mismatch in jobId format (ObjectId vs String)
    console.log('\n🔍 CHECKING JOBID FORMAT CONSISTENCY:');
    const sampleJob = allJobs[0];
    if (sampleJob) {
      console.log(`Sample Job ID type: ${typeof sampleJob._id} (${sampleJob._id})`);
      
      // Check if applications are using string or ObjectId format
      const stringMatches = await db.collection('applications').find({ jobId: sampleJob._id.toString() }).toArray();
      const objectIdMatches = await db.collection('applications').find({ jobId: sampleJob._id }).toArray();
      
      console.log(`Applications matching as string: ${stringMatches.length}`);
      console.log(`Applications matching as ObjectId: ${objectIdMatches.length}`);
    }

    // 4. Check user data integrity
    console.log('\n👥 USER DATA CHECK:');
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`Total users: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('Sample user IDs:');
      allUsers.slice(0, 5).forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}, Username: ${user.username || user.email}, Type: ${typeof user._id}`);
      });
    }

    // 5. Simulate what recruiter query might look like
    console.log('\n🔎 SIMULATING RECRUITER QUERY:');
    
    // Common recruiter query patterns
    const recruiterQueries = [
      // Query by job status
      { query: { status: { $in: ['applied', 'pending', 'reviewing'] } }, name: 'Active applications' },
      // Query for recent applications
      { query: { appliedAt: { $exists: true } }, name: 'Applications with apply date' },
      // Query with proper userId
      { query: { userId: { $exists: true, $ne: null } }, name: 'Applications with valid userId' }
    ];

    for (const queryTest of recruiterQueries) {
      const results = await db.collection('applications').find(queryTest.query).toArray();
      console.log(`${queryTest.name}: ${results.length} results`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the debug
debugRecruiterCandidates()
  .then(() => console.log('\n✅ Debug completed!'))
  .catch(console.error);
