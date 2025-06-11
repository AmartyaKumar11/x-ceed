const fetch = require('node-fetch');

async function testJobsAPI() {
  console.log('🔍 Testing Jobs API for Recruiter Filtering\n');
  
  // Test cases with different tokens
  const testCases = [
    {
      name: 'Without Authentication',
      token: null,
      expectation: 'Should return 401 Unauthorized'
    },
    {
      name: 'With Valid Token (your token)',
      token: 'YOUR_JWT_TOKEN_HERE', // Replace with your actual token
      expectation: 'Should return only your jobs'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(`Expected: ${testCase.expectation}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (testCase.token && testCase.token !== 'YOUR_JWT_TOKEN_HERE') {
        headers['Authorization'] = `Bearer ${testCase.token}`;
      }
      
      console.log('📤 Making API request to /api/jobs...');
      
      const response = await fetch('http://localhost:3000/api/jobs', {
        method: 'GET',
        headers
      });
      
      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Success! Found ${data.data.length} jobs`);
        
        if (data.data.length > 0) {
          console.log('📋 Job Details:');
          data.data.forEach((job, index) => {
            console.log(`   ${index + 1}. ${job.title}`);
            console.log(`      - Recruiter ID: ${job.recruiterId}`);
            console.log(`      - Status: ${job.status}`);
            console.log(`      - Created: ${job.createdAt}`);
          });
          
          // Check for unique recruiter IDs
          const uniqueRecruiters = [...new Set(data.data.map(job => job.recruiterId))];
          console.log(`\n🔍 Analysis: Jobs from ${uniqueRecruiters.length} different recruiter(s)`);
          uniqueRecruiters.forEach(id => {
            const count = data.data.filter(job => job.recruiterId === id).length;
            console.log(`   - Recruiter ${id}: ${count} jobs`);
          });
          
          if (uniqueRecruiters.length > 1) {
            console.log('⚠️  WARNING: Multiple recruiters detected! This indicates a filtering issue.');
          } else {
            console.log('✅ GOOD: All jobs belong to the same recruiter.');
          }
        }
      } else {
        console.log(`❌ API Error: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n📋 Instructions to test with your actual token:');
  console.log('1. Login to your application in the browser');
  console.log('2. Open DevTools (F12) → Application → Local Storage');
  console.log('3. Copy the "token" value');
  console.log('4. Replace "YOUR_JWT_TOKEN_HERE" in this script with your token');
  console.log('5. Run this script again');
}

testJobsAPI();
