// Test script to check if jobs are rendering correctly in RealJobsComponent
import { connectToDatabase } from './src/lib/mongodb.js';

async function testJobsRendering() {
  console.log('🔍 Testing jobs rendering...');
  
  try {
    // Test 1: Check database connection and jobs count
    console.log('\n1. Checking database jobs...');
    const { db } = await connectToDatabase();
    const jobsCollection = db.collection('jobs');
    
    const totalJobs = await jobsCollection.countDocuments();
    const activeJobs = await jobsCollection.countDocuments({ status: 'active' });
    
    console.log(`   - Total jobs in DB: ${totalJobs}`);
    console.log(`   - Active jobs in DB: ${activeJobs}`);
    
    // Test 2: Simulate API call
    console.log('\n2. Testing API response...');
    const jobs = await jobsCollection.find({ status: 'active' }).toArray();
    
    console.log(`   - Jobs fetched: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log(`   - Sample job: ${jobs[0].title} at ${jobs[0].companyName}`);
      console.log(`   - Job fields: ${Object.keys(jobs[0]).join(', ')}`);
    }
    
    // Test 3: Check required fields for rendering
    console.log('\n3. Checking required fields for UI rendering...');
    const requiredFields = ['_id', 'title', 'companyName', 'workMode', 'salaryMin', 'salaryMax'];
    
    jobs.forEach((job, index) => {
      const missingFields = requiredFields.filter(field => !job[field]);
      if (missingFields.length > 0) {
        console.log(`   ⚠️ Job ${index + 1} missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log(`   ✅ Job ${index + 1}: All required fields present`);
      }
    });
    
    console.log('\n✅ Jobs rendering test completed!');
    
  } catch (error) {
    console.error('❌ Error testing jobs rendering:', error);
  }
  
  process.exit(0);
}

testJobsRendering();
