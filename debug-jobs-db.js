const { MongoClient, ObjectId } = require('mongodb');

async function debugJobsDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('x-ceed-db');
    
    // Check jobs collection
    const jobsCount = await db.collection('jobs').countDocuments();
    console.log(`📊 Total jobs in database: ${jobsCount}`);

    // Get first 3 jobs to see their structure
    const jobs = await db.collection('jobs').find({}).limit(3).toArray();
    console.log('\n📋 Sample jobs:');
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}:`);
      console.log(`  - _id: ${job._id} (type: ${typeof job._id})`);
      console.log(`  - title: ${job.title}`);
      console.log(`  - status: ${job.status}`);
      console.log(`  - recruiterId: ${job.recruiterId}`);
      console.log('');
    });

    // Check if there are any active jobs
    const activeJobs = await db.collection('jobs').find({ status: 'active' }).toArray();
    console.log(`🟢 Active jobs count: ${activeJobs.length}`);

    if (activeJobs.length > 0) {
      console.log('\n🎯 First active job details:');
      const firstActive = activeJobs[0];
      console.log(`  - _id: ${firstActive._id}`);
      console.log(`  - _id type: ${typeof firstActive._id}`);
      console.log(`  - _id constructor: ${firstActive._id.constructor.name}`);
      console.log(`  - title: ${firstActive.title}`);
      
      // Test ObjectId conversion
      console.log('\n🔧 Testing ObjectId operations:');
      console.log(`  - ObjectId.isValid('${firstActive._id}'): ${ObjectId.isValid(firstActive._id.toString())}`);
      console.log(`  - new ObjectId('${firstActive._id}'): ${new ObjectId(firstActive._id.toString())}`);
      
      // Test job lookup
      const lookupResult = await db.collection('jobs').findOne({ _id: firstActive._id });
      console.log(`  - Direct lookup result: ${lookupResult ? 'FOUND' : 'NOT FOUND'}`);
      
      const lookupByString = await db.collection('jobs').findOne({ _id: new ObjectId(firstActive._id.toString()) });
      console.log(`  - String conversion lookup: ${lookupByString ? 'FOUND' : 'NOT FOUND'}`);
    }

    // Check applications collection
    const applicationsCount = await db.collection('applications').countDocuments();
    console.log(`\n📨 Total applications in database: ${applicationsCount}`);

    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`👥 Total users in database: ${usersCount}`);
    
    // Check for applicant users
    const applicants = await db.collection('users').find({ userType: 'applicant' }).limit(2).toArray();
    console.log(`\n🎓 Sample applicants:`);
    applicants.forEach((user, index) => {
      console.log(`Applicant ${index + 1}:`);
      console.log(`  - _id: ${user._id}`);
      console.log(`  - email: ${user.email}`);
      console.log(`  - has resume: ${user.resume ? 'YES' : 'NO'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugJobsDatabase();
