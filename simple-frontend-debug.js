// Simple Frontend Jobs Debug Test
// This will test the API endpoint directly without database connection

async function testJobsAPI() {
  console.log('🔍 Testing Jobs API directly...\n');
  
  try {
    // Start the Next.js server if not running
    const http = require('http');
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    console.log('📡 Testing /api/jobs?public=true endpoint...');
    
    // Test if server is running on port 3000
    let serverRunning = false;
    try {
      const testResponse = await fetch('http://localhost:3000/api/jobs?public=true');
      serverRunning = true;
      console.log('✅ Server is running on port 3000');
      
      const data = await testResponse.json();
      console.log('📊 API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log(`\n📈 Jobs count: ${data.data.length}`);
        if (data.data.length === 0) {
          console.log('✅ No jobs returned - this is correct if database is empty');
        } else {
          console.log('⚠️ Jobs found despite empty database:');
          data.data.forEach((job, index) => {
            console.log(`${index + 1}. ${job.title} - Status: ${job.status}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Server not running or API not accessible');
      console.log('Please start the server with: npm run dev');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Generate browser debugging script
function generateBrowserDebugScript() {
  console.log('\n📝 BROWSER DEBUGGING SCRIPT:');
  console.log('Copy and paste this into your browser console while on the jobs page:');
  console.log('='.repeat(80));
  
  const script = `
// Run this in browser console to debug job visibility
console.log('🔍 Debugging job visibility...');

// 1. Clear all caches
console.log('🧹 Clearing caches...');
localStorage.clear();
sessionStorage.clear();
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

// 2. Force fresh API call
console.log('📡 Testing API directly...');
fetch('/api/jobs?public=true', {
  method: 'GET',
  cache: 'no-cache',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('API Response:', data);
  if (data.success && data.data) {
    console.log('Jobs count:', data.data.length);
    if (data.data.length === 0) {
      console.log('✅ API returns no jobs - correct behavior');
    } else {
      console.log('⚠️ Jobs found:', data.data.map(job => ({
        id: job._id,
        title: job.title,
        status: job.status
      })));
    }
  }
})
.catch(error => console.error('API Error:', error));

// 3. Check React component state (if available)
setTimeout(() => {
  console.log('🔍 Checking page for job elements...');
  const jobElements = document.querySelectorAll('[data-testid*="job"], .job-card, [class*="job"]');
  console.log('Job elements found on page:', jobElements.length);
  
  if (jobElements.length > 0) {
    console.log('Job elements:', Array.from(jobElements).map(el => ({
      tag: el.tagName,
      className: el.className,
      textContent: el.textContent?.substring(0, 100)
    })));
  }
}, 2000);

console.log('🎯 After running this script, refresh the page with Ctrl+F5');
`;
  
  console.log(script);
  console.log('='.repeat(80));
}

// Run the test
testJobsAPI().then(() => {
  generateBrowserDebugScript();
  
  console.log('\n🔧 MANUAL DEBUGGING STEPS:');
  console.log('1. Ensure the Next.js server is running: npm run dev');
  console.log('2. Open browser and go to the jobs page');
  console.log('3. Open Developer Tools (F12)');
  console.log('4. Run the browser script above in the Console tab');
  console.log('5. Check the Network tab for API requests');
  console.log('6. Look for any hardcoded job data in the page source');
});
