// Compare Posted Jobs vs Available Jobs
// This script will check both recruiter-posted jobs and applicant-visible jobs

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function compareJobCounts() {
  console.log('🔍 COMPARING POSTED JOBS vs AVAILABLE JOBS');
  console.log('==========================================\n');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('x-ceed');
    
    // 1. Check ALL jobs posted by recruiters (regardless of status)
    console.log('1️⃣ TOTAL JOBS POSTED BY RECRUITERS:');
    const allJobs = await db.collection('jobs').find({}).toArray();
    console.log(`   Total jobs in database: ${allJobs.length}`);
    
    if (allJobs.length > 0) {
      console.log('   Job breakdown by status:');
      const statusCounts = {};
      allJobs.forEach(job => {
        const status = job.status || 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} jobs`);
      });
      
      console.log('\n   Individual job details:');
      allJobs.forEach((job, index) => {
        const isExpired = job.expiryDate ? new Date(job.expiryDate) < new Date() : false;
        console.log(`   ${index + 1}. "${job.title}"`);
        console.log(`      Status: ${job.status || 'undefined'}`);
        console.log(`      Created: ${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'unknown'}`);
        console.log(`      Expires: ${job.expiryDate ? new Date(job.expiryDate).toLocaleDateString() : 'never'}`);
        console.log(`      Expired: ${isExpired ? 'YES' : 'NO'}`);
        console.log(`      ID: ${job._id}`);
        console.log('');
      });
    }
    
    // 2. Check jobs visible to applicants (using the same logic as API)
    console.log('2️⃣ JOBS AVAILABLE TO APPLICANTS:');
    const applicantVisibleQuery = {
      status: 'active',
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };
    
    const availableJobs = await db.collection('jobs').find(applicantVisibleQuery).toArray();
    console.log(`   Jobs visible to applicants: ${availableJobs.length}`);
    
    if (availableJobs.length > 0) {
      console.log('   Available jobs:');
      availableJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. "${job.title}" (Status: ${job.status}, ID: ${job._id})`);
      });
    }
    
    // 3. Compare the numbers
    console.log('3️⃣ COMPARISON ANALYSIS:');
    console.log(`   Total posted jobs: ${allJobs.length}`);
    console.log(`   Available to applicants: ${availableJobs.length}`);
    console.log(`   Hidden jobs: ${allJobs.length - availableJobs.length}`);
    
    if (allJobs.length === 0 && availableJobs.length === 0) {
      console.log('   ✅ RESULT: No jobs posted, none available - CORRECT');
    } else if (allJobs.length > 0 && availableJobs.length === 0) {
      console.log('   ✅ RESULT: Jobs posted but none available - CORRECT (jobs closed/expired)');
    } else if (allJobs.length > 0 && availableJobs.length > 0) {
      console.log('   ⚠️  RESULT: Jobs posted and some available - CHECK IF INTENDED');
    } else {
      console.log('   ❌ RESULT: Unexpected state');
    }
    
    // 4. Check for recently closed jobs
    console.log('\n4️⃣ RECENTLY CLOSED/EXPIRED JOBS:');
    const closedJobs = await db.collection('jobs').find({
      $or: [
        { status: { $ne: 'active' } },
        { 
          expiryDate: { 
            $exists: true, 
            $ne: null, 
            $lt: new Date() 
          } 
        }
      ]
    }).toArray();
    
    console.log(`   Closed/expired jobs: ${closedJobs.length}`);
    if (closedJobs.length > 0) {
      closedJobs.forEach((job, index) => {
        const reason = job.status !== 'active' ? `Status: ${job.status}` : 'Expired';
        console.log(`   ${index + 1}. "${job.title}" (${reason})`);
      });
    }
    
    // 5. Generate recommendation
    console.log('\n5️⃣ RECOMMENDATION:');
    if (allJobs.length === 0) {
      console.log('   📝 No jobs in database');
      console.log('   🎯 If you see jobs in browser: BROWSER CACHE ISSUE');
      console.log('   💡 Solution: Clear browser cache and hard refresh');
    } else if (availableJobs.length === 0) {
      console.log('   📝 All jobs are closed/expired');
      console.log('   🎯 If you see jobs in browser: BROWSER CACHE ISSUE');
      console.log('   💡 Solution: Clear browser cache and hard refresh');
    } else {
      console.log('   📝 Some jobs are still active and should be visible');
      console.log('   🎯 Check if the visible jobs match the available jobs list above');
    }
    
  } catch (error) {
    console.error('❌ Error during comparison:', error);
  } finally {
    await client.close();
  }
}

compareJobCounts();
