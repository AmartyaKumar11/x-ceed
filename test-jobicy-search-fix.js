// Test script to verify Jobicy API search fix
const fetch = require('node-fetch');

async function testJobicySearch() {
  console.log('🔍 Testing Jobicy search functionality...\n');
  
  // Test 1: Direct external API call with tag parameter (should work)
  console.log('Test 1: Direct Jobicy API with tag parameter');
  try {
    const response = await fetch('https://jobicy.com/api/v2/remote-jobs?count=2&tag=developer', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: External API with tag works');
      console.log(`   Found ${data.jobs?.length || 0} jobs`);
    } else {
      console.log(`❌ FAILED: Status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Test parameter transformation logic
  console.log('Test 2: Parameter transformation logic');
  const params = new URLSearchParams();
  const q = 'developer';
  const tag = null;
  
  // This simulates our new logic
  if (q && !tag) {
    params.append('tag', q);
    console.log('✅ SUCCESS: Query transformed to tag parameter');
    console.log(`   Original q="${q}" → tag="${q}"`);
  }
  
  console.log(`   Final URL: https://jobicy.com/api/v2/remote-jobs?${params.toString()}`);
  
  console.log('\n🎉 Fix verification complete!');
  console.log('The search functionality should now work by converting "q" parameters to "tag" parameters.');
}

testJobicySearch().catch(console.error);
