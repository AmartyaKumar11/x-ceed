// Quick test to verify job visibility API is working
// This tests the actual API endpoints

const https = require('https');
const http = require('http');

async function testPublicJobsAPI() {
  console.log('🧪 Testing Public Jobs API...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/jobs?public=true',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`📊 Response Status: ${res.statusCode}`);
          console.log(`📈 Jobs Found: ${response.data?.length || 0}`);
          
          if (response.success && Array.isArray(response.data)) {
            console.log('✅ Public Jobs API is working correctly');
            
            // Check for any jobs with wrong status
            const badJobs = response.data.filter(job => job.status !== 'active');
            if (badJobs.length > 0) {
              console.log(`❌ Found ${badJobs.length} non-active jobs in results`);
            } else {
              console.log('✅ All returned jobs have status: "active"');
            }
            
            // Check for expired jobs
            const now = new Date();
            const expiredJobs = response.data.filter(job => {
              return job.applicationEnd && new Date(job.applicationEnd) < now;
            });
            
            if (expiredJobs.length > 0) {
              console.log(`❌ Found ${expiredJobs.length} expired jobs in results`);
            } else {
              console.log('✅ No expired jobs in results');
            }
            
          } else {
            console.log('❌ API response format issue');
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ JSON parsing error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ API request failed:', error.message);
      console.log('ℹ️  Make sure the Next.js app is running on localhost:3000');
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Job Closing Logic - API Test\n');
  
  try {
    await testPublicJobsAPI();
    console.log('\n✅ API test completed successfully');
    console.log('\n📋 Manual verification steps:');
    console.log('1. Open the application at http://localhost:3000');
    console.log('2. Login as recruiter and create a test job');
    console.log('3. Login as applicant and verify job is visible');
    console.log('4. Close job as recruiter and verify it disappears for applicant');
    
  } catch (error) {
    console.log('\n❌ API test failed');
    console.log('🔧 Troubleshooting:');
    console.log('- Ensure Next.js app is running: npm run dev');
    console.log('- Check MongoDB connection');
    console.log('- Verify API routes are correctly configured');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPublicJobsAPI };
