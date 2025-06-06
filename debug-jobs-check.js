// Debug script to check jobs in database
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function checkJobs() {
  try {
    console.log('🔍 Connecting to database...');
    const client = await clientPromise;
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    const db = client.db(dbName);
    
    console.log('🔍 Using database:', dbName);
    
    // Get all jobs
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log('\n📊 Total jobs in database:', allJobs.length);
    
    if (allJobs.length > 0) {
      console.log('\n📋 Jobs list:');
      allJobs.forEach((job, index) => {
        console.log(`${index + 1}. ID: ${job._id}`);
        console.log(`   Title: ${job.title}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Company: ${job.companyName || job.company || 'N/A'}`);
        console.log(`   Created: ${job.createdAt}`);
        console.log('');
      });
      
      // Check specifically for active jobs
      const activeJobs = await db.collection('jobs').find({ status: 'active' }).toArray();
      console.log('✅ Active jobs count:', activeJobs.length);
      
      // Test a specific job ID if provided as argument
      const testJobId = process.argv[2];
      if (testJobId && ObjectId.isValid(testJobId)) {
        console.log('\n🔍 Testing specific job ID:', testJobId);
        const specificJob = await db.collection('jobs').findOne({ _id: new ObjectId(testJobId) });
        console.log('Job found:', !!specificJob);
        if (specificJob) {
          console.log('Job details:', {
            id: specificJob._id,
            title: specificJob.title,
            status: specificJob.status,
            company: specificJob.companyName || specificJob.company
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkJobs();
