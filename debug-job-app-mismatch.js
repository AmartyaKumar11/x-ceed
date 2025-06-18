const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function debugJobApplicationMismatch() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('🔍 Debugging Job-Application Mismatch...\n');
    
    // Get sample applications
    const applications = await db.collection('applications').find({}).limit(5).toArray();
    console.log(`Found ${applications.length} applications`);
    
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      console.log(`\nApplication ${i + 1}:`);
      console.log('- Application ID:', app._id);
      console.log('- Job ID:', app.jobId);
      console.log('- Job ID Type:', typeof app.jobId);
      console.log('- User ID:', app.userId);
      
      // Try to find the job
      const job = await db.collection('jobs').findOne({ _id: app.jobId });
      if (job) {
        console.log('- Job Found:', job.title);
      } else {
        console.log('- Job NOT Found');
        
        // Try with ObjectId conversion
        try {
          const jobWithObjectId = await db.collection('jobs').findOne({ _id: new ObjectId(app.jobId) });
          if (jobWithObjectId) {
            console.log('- Job Found with ObjectId conversion:', jobWithObjectId.title);
          } else {
            console.log('- Job still NOT found even with ObjectId conversion');
          }
        } catch (err) {
          console.log('- Error converting to ObjectId:', err.message);
        }
      }
    }
    
    // List some job IDs
    console.log('\n📋 Sample Job IDs in jobs collection:');
    const jobs = await db.collection('jobs').find({}).limit(5).toArray();
    jobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job._id} (${typeof job._id}) - ${job.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugJobApplicationMismatch();
