// Test script to verify job visibility logic for applicants
// Run with: node test-job-visibility-logic.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testJobVisibility() {
  console.log('🧪 Testing Job Visibility Logic...\n');

  try {
    // 1. Test public job listing (what applicants see)
    console.log('1. Testing public job listing...');
    const publicResponse = await fetch(`${BASE_URL}/api/jobs?public=true`);
    if (publicResponse.ok) {
      const publicData = await publicResponse.json();
      console.log(`✅ Public jobs API working: ${publicData.data?.length || 0} jobs found`);
      
      // Check if any closed jobs are visible
      const closedJobs = publicData.data?.filter(job => job.status === 'closed') || [];
      if (closedJobs.length > 0) {
        console.log('❌ ISSUE: Found closed jobs in public listing:', closedJobs.map(j => j.title));
      } else {
        console.log('✅ No closed jobs visible in public listing');
      }

      // Check for expired jobs (past application deadline)
      const now = new Date();
      const expiredJobs = publicData.data?.filter(job => {
        if (!job.applicationEnd) return false;
        return new Date(job.applicationEnd) < now;
      }) || [];
      
      if (expiredJobs.length > 0) {
        console.log('⚠️  Found expired jobs still visible:', expiredJobs.map(j => ({
          title: j.title,
          applicationEnd: j.applicationEnd,
          expired: new Date(j.applicationEnd) < now
        })));
      } else {
        console.log('✅ No expired jobs visible in public listing');
      }
    } else {
      console.log('❌ Failed to fetch public jobs:', publicResponse.status);
    }

    console.log('\n2. Testing individual job access...');
    
    // Try to access a sample job by ID (this would need a real job ID)
    // This is just showing the concept
    console.log('ℹ️  Individual job access test skipped (needs real job ID)');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

async function testJobClosingFlow() {
  console.log('\n🔄 Testing Job Closing Flow...\n');
  
  // This would require authentication and a real recruiter token
  console.log('ℹ️  Job closing flow test requires authentication - manual testing needed');
  
  console.log('\nTo test manually:');
  console.log('1. Login as a recruiter');
  console.log('2. Create a job posting');
  console.log('3. Note the job ID and verify it appears in public listings');
  console.log('4. Close the job from recruiter dashboard');
  console.log('5. Verify it no longer appears in public listings');
  console.log('6. Try to access the job directly by ID as an applicant');
}

if (require.main === module) {
  testJobVisibility()
    .then(() => testJobClosingFlow())
    .then(() => console.log('\n✅ Testing completed'))
    .catch(console.error);
}

module.exports = { testJobVisibility, testJobClosingFlow };
