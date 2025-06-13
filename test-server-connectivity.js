// Quick server connectivity test
const http = require('http');

async function testServerConnectivity() {
  console.log('🔍 Testing development server connectivity...\n');
  
  const ports = [3000, 3001, 3002, 3003]; // Common development ports
  
  for (const port of ports) {
    await testPort(port);
  }
  
  console.log('\n💡 If all tests failed, the development server might not be running.');
  console.log('   Try starting it with: npm run dev');
}

function testPort(port) {
  return new Promise((resolve) => {
    console.log(`🔌 Testing port ${port}...`);
    
    const req = http.get(`http://localhost:${port}/api/youtube/videos?search=test&limit=1`, (res) => {
      console.log(`✅ Port ${port}: Server is responding (Status: ${res.statusCode})`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Response preview: ${JSON.stringify({
            success: parsed.success,
            source: parsed.source,
            videosCount: parsed.videos?.length || 0
          })}`);
        } catch (e) {
          console.log(`   Response (first 100 chars): ${data.substring(0, 100)}...`);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`❌ Port ${port}: Connection refused (server not running)`);
      } else {
        console.log(`❌ Port ${port}: ${err.message}`);
      }
      resolve();
    });
    
    req.setTimeout(3000, () => {
      console.log(`⏰ Port ${port}: Request timeout`);
      req.destroy();
      resolve();
    });
  });
}

// Also test the specific YouTube API endpoint directly
async function testYouTubeEndpoint() {
  console.log('\n🎥 Testing YouTube API endpoint directly...\n');
  
  const testQueries = [
    'JavaScript tutorial',
    'React programming',
    'Python basics'
  ];
  
  for (const query of testQueries) {
    console.log(`🔍 Testing query: "${query}"`);
    
    try {
      const searchParam = encodeURIComponent(query + ' programming');
      const url = `http://localhost:3000/api/youtube/videos?search=${searchParam}&limit=3`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Query "${query}": Success`);
        console.log(`   Source: ${data.source}, Videos: ${data.videos?.length || 0}`);
      } else {
        console.log(`❌ Query "${query}": Failed (${response.status})`);
      }
      
    } catch (error) {
      console.log(`❌ Query "${query}": Error - ${error.message}`);
    }
  }
}

// Run the tests
async function runAllTests() {
  await testServerConnectivity();
  
  // Only test YouTube endpoint if fetch is available (Node 18+)
  if (typeof fetch !== 'undefined') {
    await testYouTubeEndpoint();
  } else {
    console.log('\n💡 To test YouTube endpoint, run this in a browser or use Node.js 18+');
  }
  
  console.log('\n🎯 Summary:');
  console.log('   - If you see "Connection refused": Start the dev server with "npm run dev"');
  console.log('   - If you see timeouts: Check if the server is overloaded');
  console.log('   - If you see 404 errors: The API endpoint might not exist');
  console.log('   - If you see 500 errors: There might be a server-side error');
}

runAllTests().catch(console.error);
