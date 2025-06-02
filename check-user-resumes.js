const { MongoClient, ObjectId } = require('mongodb');

async function checkUserResumes() {
  const uri = 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('x-ceed-db');
    
    // Get all applicants and their resume status
    const applicants = await db.collection('users').find({ userType: 'applicant' }).toArray();
    
    console.log(`👥 Found ${applicants.length} applicants:`);
    console.log('');
    
    applicants.forEach((user, index) => {
      console.log(`Applicant ${index + 1}:`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Name: ${user.personal?.name || 'Not set'}`);
      console.log(`  - Resume: ${user.resume ? '✅ YES' : '❌ NO'}`);
      if (user.resume) {
        console.log(`  - Resume path: ${user.resume}`);
      }
      console.log('');
    });

    // Also check if there are any resume files in the uploads folder
    console.log('📁 Checking recent activity...');
    
    // Look for recent applications that might have been attempted
    const recentApplications = await db.collection('applications').find({}).sort({ appliedAt: -1 }).limit(5).toArray();
    console.log(`📨 Recent applications: ${recentApplications.length}`);
    
    if (recentApplications.length > 0) {
      recentApplications.forEach((app, index) => {
        console.log(`Application ${index + 1}:`);
        console.log(`  - Job ID: ${app.jobId}`);
        console.log(`  - Applicant ID: ${app.applicantId}`);
        console.log(`  - Applied at: ${app.appliedAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserResumes();
