// Comprehensive Frontend Jobs Debug Script
// This script will help identify why jobs are still visible despite empty database

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugFrontendJobs() {
  console.log('🔍 Debugging Frontend Jobs Visibility Issue...\n');
  
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
  
  try {
    await client.connect();
    const db = client.db('x-ceed');
    
    // 1. Check database state
    console.log('1️⃣ DATABASE STATE:');
    const jobs = await db.collection('jobs').find({}).toArray();
    console.log(`   Total jobs in database: ${jobs.length}`);
    
    if (jobs.length > 0) {
      console.log('   Jobs found:');
      jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} - Status: ${job.status || 'undefined'} - Expired: ${job.expiryDate ? (new Date(job.expiryDate) < new Date() ? 'YES' : 'NO') : 'No expiry'}`);
      });
    } else {
      console.log('   ✅ Database is empty - no jobs should be visible');
    }
    
    // 2. Test API endpoints directly
    console.log('\n2️⃣ API ENDPOINT TESTING:');
    
    // Test public jobs API
    console.log('   Testing /api/jobs?public=true equivalent query...');
    const publicJobsQuery = {
      status: 'active',
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };
    
    const publicJobs = await db.collection('jobs').find(publicJobsQuery).toArray();
    console.log(`   Public jobs query result: ${publicJobs.length} jobs`);
    
    // 3. Check for any potential data issues
    console.log('\n3️⃣ DATA INTEGRITY CHECKS:');
    
    // Check for jobs without status field
    const jobsWithoutStatus = await db.collection('jobs').find({ status: { $exists: false } }).toArray();
    console.log(`   Jobs without status field: ${jobsWithoutStatus.length}`);
    
    // Check for jobs with null/undefined status
    const jobsWithNullStatus = await db.collection('jobs').find({ status: null }).toArray();
    console.log(`   Jobs with null status: ${jobsWithNullStatus.length}`);
    
    // Check for jobs with empty string status
    const jobsWithEmptyStatus = await db.collection('jobs').find({ status: '' }).toArray();
    console.log(`   Jobs with empty status: ${jobsWithEmptyStatus.length}`);
    
    // 4. Generate frontend debugging instructions
    console.log('\n4️⃣ FRONTEND DEBUGGING INSTRUCTIONS:');
    console.log('   To debug the frontend, open your browser and:');
    console.log('   1. Open Developer Tools (F12)');
    console.log('   2. Go to the Console tab');
    console.log('   3. Navigate to the jobs page');
    console.log('   4. Look for the following console messages:');
    console.log('      - "🔍 RealJobsComponent: Starting fetchJobs..."');
    console.log('      - "📡 RealJobsComponent: Response status: [number]"');
    console.log('      - "✅ RealJobsComponent: Received data: [object]"');
    console.log('      - "📊 RealJobsComponent: Setting jobs: [number] jobs"');
    console.log('');
    console.log('   5. In the Console, run this command to check API directly:');
    console.log('      fetch("/api/jobs?public=true").then(r => r.json()).then(console.log)');
    console.log('');
    console.log('   6. Check Network tab for the API request to /api/jobs?public=true');
    console.log('   7. Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)');
    console.log('   8. Try hard refresh: Ctrl+F5 (or Cmd+Shift+R on Mac)');
    
    // 5. Check for application and saved jobs that might reference non-existent jobs
    console.log('\n5️⃣ RELATED DATA CHECKS:');
    
    const applications = await db.collection('applications').find({}).toArray();
    console.log(`   Total applications: ${applications.length}`);
    
    const savedJobs = await db.collection('savedJobs').find({}).toArray();
    console.log(`   Total saved jobs: ${savedJobs.length}`);
    
    if (applications.length > 0) {
      const uniqueJobIds = [...new Set(applications.map(app => app.jobId))];
      console.log(`   Unique job IDs in applications: ${uniqueJobIds.length}`);
      console.log(`   Job IDs: ${uniqueJobIds.join(', ')}`);
    }
    
    if (savedJobs.length > 0) {
      const uniqueSavedJobIds = [...new Set(savedJobs.map(saved => saved.jobId))];
      console.log(`   Unique job IDs in saved jobs: ${uniqueSavedJobIds.length}`);
      console.log(`   Saved Job IDs: ${uniqueSavedJobIds.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await client.close();
  }
}

// Create a browser cache clearing script
function generateBrowserClearScript() {
  const script = `
// Browser Console Script - Run this in your browser's developer console
// This script will help clear any cached job data and force a fresh fetch

console.log('🧹 Clearing job-related browser cache...');

// Clear localStorage job-related data
Object.keys(localStorage).forEach(key => {
  if (key.includes('job') || key.includes('Job')) {
    console.log('Removing localStorage key:', key);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage job-related data
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('job') || key.includes('Job')) {
    console.log('Removing sessionStorage key:', key);
    sessionStorage.removeItem(key);
  }
});

// Force reload jobs data
console.log('🔄 Force reloading jobs data...');
fetch('/api/jobs?public=true', {
  cache: 'no-cache',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
})
.then(response => response.json())
.then(data => {
  console.log('📊 Fresh API response:', data);
  if (data.success && data.data) {
    console.log(\`✅ Fresh jobs count: \${data.data.length}\`);
    if (data.data.length === 0) {
      console.log('🎉 Confirmed: No jobs in database - page should show no jobs');
    } else {
      console.log('⚠️ Jobs still exist:', data.data.map(job => ({
        id: job._id,
        title: job.title,
        status: job.status,
        expired: job.expiryDate ? new Date(job.expiryDate) < new Date() : false
      })));
    }
  }
})
.catch(error => console.error('❌ Error fetching fresh data:', error));

console.log('✅ Cache clearing complete. Please refresh the page.');
`;

  return script;
}

// Run the debug
debugFrontendJobs().then(() => {
  console.log('\n📝 BROWSER CONSOLE SCRIPT:');
  console.log('Copy and paste the following script into your browser console:');
  console.log('='.repeat(80));
  console.log(generateBrowserClearScript());
  console.log('='.repeat(80));
});
