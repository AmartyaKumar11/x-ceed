import { MongoClient, ObjectId } from 'mongodb';

async function debugJobFiltering() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🔍 Debugging Job Filtering Issue\n');
    
    // Check all recruiters
    const recruiters = await db.collection('users').find({ 
      userType: 'recruiter' 
    }).toArray();
    
    console.log(`📊 Found ${recruiters.length} recruiters:`);
    for (const recruiter of recruiters) {
      const jobCount = await db.collection('jobs').countDocuments({ 
        recruiterId: recruiter._id.toString() 
      });
      console.log(`   - ${recruiter.email} (${recruiter._id}): ${jobCount} jobs`);
    }
    
    console.log('\n🔍 Checking specific user: amartya2@gmail.com');
    const user = await db.collection('users').findOne({ email: 'amartya2@gmail.com' });
    if (user) {
      console.log(`   - User ID: ${user._id}`);
      console.log(`   - User Type: ${user.userType}`);
      
      const userJobs = await db.collection('jobs').find({ 
        recruiterId: user._id.toString() 
      }).toArray();
      
      console.log(`   - Jobs created by this user: ${userJobs.length}`);
      userJobs.forEach(job => {
        console.log(`     * ${job.title} (Status: ${job.status})`);
      });
    }
    
    // Check for data inconsistencies
    console.log('\n🔍 Checking for data inconsistencies...');
    const allJobs = await db.collection('jobs').find({}).toArray();
    
    const recruiterIdTypes = {};
    allJobs.forEach(job => {
      const type = typeof job.recruiterId;
      recruiterIdTypes[type] = (recruiterIdTypes[type] || 0) + 1;
    });
    
    console.log('📊 Recruiter ID types in jobs collection:');
    Object.entries(recruiterIdTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} jobs`);
    });
    
    if (recruiterIdTypes.string && recruiterIdTypes.object) {
      console.log('⚠️  ISSUE FOUND: Mixed ID types detected!');
      console.log('   This could cause filtering problems.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugJobFiltering();
