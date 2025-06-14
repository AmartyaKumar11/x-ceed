const https = require('https');
const http = require('http');

async function testThumbnailUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✓ ${url}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Content-Type: ${res.headers['content-type']}`);
      console.log(`  Content-Length: ${res.headers['content-length']}`);
      resolve({ url, status: res.statusCode, success: res.statusCode === 200 });
    });
    
    req.on('error', (err) => {
      console.log(`✗ ${url}`);
      console.log(`  Error: ${err.message}`);
      resolve({ url, status: 'error', success: false, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve({ url, status: 'timeout', success: false });
    });
  });
}

async function main() {
  console.log('🔍 Testing Thumbnail URLs...\n');
  
  // Test different thumbnail URL formats
  const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll video ID for testing
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${testVideoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${testVideoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${testVideoId}/default.jpg`,
    'https://via.placeholder.com/480x360/0066cc/ffffff?text=Video+Thumbnail',
    'https://picsum.photos/480/360',
    `https://i.ytimg.com/vi/${testVideoId}/mqdefault.jpg`
  ];
  
  const results = [];
  
  for (const url of thumbnailUrls) {
    const result = await testThumbnailUrl(url);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📊 Summary:');
  results.forEach((result, i) => {
    const status = result.success ? '✅ Working' : '❌ Failed';
    console.log(`${i+1}. ${status} - ${result.url}`);
  });
  
  const workingUrls = results.filter(r => r.success);
  console.log(`\n${workingUrls.length}/${results.length} URLs are working`);
  
  if (workingUrls.length > 0) {
    console.log('\n✅ Working URLs:');
    workingUrls.forEach(r => console.log(`  - ${r.url}`));
  }
}

main().catch(console.error);
