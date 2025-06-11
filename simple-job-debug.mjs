import { MongoClient, ObjectId } from 'mongodb';

async function debugJobFiltering() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🔍 Debugging Job Filtering Issue\n');
    
    // Find your user account
    const yourEmail = 'amartya2@gmail.com';
    const user = await db.collection('users').findOne({ email: yourEmail });
    
    if (!user) {
      console.log('❌ User not found with email:', yourEmail);
      return;
    }
    
    console.log('✅ Found user:');
    console.log('   - ID:', user._id.toString());
    console.log('   - Email:', user.email);
    console.log('   - Type:', user.userType);
    console.log('   - Name:', user.recruiter?.name || user.personal?.name);
    
    // Check jobs created by this user
    const userJobs = await db.collection('jobs').find({ 
      recruiterId: user._id.toString() 
    }).toArray();
    
    console.log(`\n✅ Jobs created by ${yourEmail}: ${userJobs.length}`);
    userJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} (${job.status})`);
      console.log(`      - Recruiter ID: ${job.recruiterId}`);
      console.log(`      - Created: ${job.createdAt}`);
    });
    
    // Check all jobs to see if there are jobs from other recruiters
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`\n📊 Total jobs in database: ${allJobs.length}`);
    
    const recruiterGroups = {};
    allJobs.forEach(job => {
      if (!recruiterGroups[job.recruiterId]) {
        recruiterGroups[job.recruiterId] = [];
      }
      recruiterGroups[job.recruiterId].push(job);
    });
    
    console.log('\n📋 Jobs grouped by recruiter:');
    for (const [recruiterId, jobs] of Object.entries(recruiterGroups)) {
      const recruiter = await db.collection('users').findOne({ 
        _id: new ObjectId(recruiterId) 
      });
      const recruiterEmail = recruiter ? recruiter.email : 'Unknown';
      console.log(`   - ${recruiterEmail} (${recruiterId}): ${jobs.length} jobs`);
      
      if (recruiterId === user._id.toString()) {
        console.log('     ✅ This is YOUR account');
      }
    }
    
    // Test the exact filtering query used by the API
    console.log('\n🧪 Testing API filtering query...');
    const apiQuery = { 
      recruiterId: user._id.toString(),
      status: { $ne: 'deleted' }
    };
    
    const filteredJobs = await db.collection('jobs')
      .find(apiQuery)
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`✅ API query result: ${filteredJobs.length} jobs`);
    
    if (filteredJobs.length !== userJobs.length) {
      console.log('⚠️  Mismatch detected!');
      console.log(`   - Direct recruiterId query: ${userJobs.length}`);
      console.log(`   - API query with status filter: ${filteredJobs.length}`);
    } else {
      console.log('✅ Filtering query works correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugJobFiltering();
