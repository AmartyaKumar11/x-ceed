// Test script to verify fresh news functionality
// This tests that each refresh button click fetches different articles

const testFreshNews = async () => {
  console.log('🧪 Testing Fresh News Functionality...\n');
  
  const baseUrl = 'http://localhost:3000/api/news';
  
  // Test 1: Basic API call
  console.log('1️⃣ Testing basic API call...');
  try {
    const response1 = await fetch(baseUrl);
    const data1 = await response1.json();
    console.log(`✅ Basic call successful: ${data1.articles?.length || 0} articles`);
    console.log(`   Source: ${data1.source}, Query: ${data1.query?.substring(0, 50) || 'N/A'}`);
    console.log(`   First article: ${data1.articles?.[0]?.title?.substring(0, 60) || 'N/A'}...\n`);
  } catch (error) {
    console.error('❌ Basic call failed:', error.message);
  }
  
  // Test 2: Multiple refresh calls with different seeds
  console.log('2️⃣ Testing multiple refresh calls (simulating button clicks)...');
  const refreshResults = [];
  
  for (let i = 1; i <= 5; i++) {
    try {
      const refreshSeed = Date.now() + Math.random() * 1000;
      const refreshUrl = `${baseUrl}?seed=${Math.floor(refreshSeed)}&refresh=true`;
      
      console.log(`   Refresh ${i}/5 (seed: ${Math.floor(refreshSeed)})`);
      const response = await fetch(refreshUrl);
      const data = await response.json();
      
      refreshResults.push({
        seed: Math.floor(refreshSeed),
        source: data.source,
        query: data.query,
        articleCount: data.articles?.length || 0,
        firstTitle: data.articles?.[0]?.title?.substring(0, 60) || 'N/A'
      });
      
      console.log(`      ✅ ${data.articles?.length || 0} articles from ${data.source}`);
      console.log(`      📰 "${data.articles?.[0]?.title?.substring(0, 60) || 'N/A'}..."`);
      
      // Wait a bit between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Refresh ${i} failed:`, error.message);
    }
  }
  
  // Test 3: Analyze results for uniqueness
  console.log('\n3️⃣ Analyzing results for freshness...');
  const uniqueQueries = new Set(refreshResults.map(r => r.query));
  const uniqueTitles = new Set(refreshResults.map(r => r.firstTitle));
  const uniqueSources = new Set(refreshResults.map(r => r.source));
  
  console.log(`📊 Results Summary:`);
  console.log(`   • Total refresh calls: ${refreshResults.length}`);
  console.log(`   • Unique queries used: ${uniqueQueries.size}/${refreshResults.length}`);
  console.log(`   • Unique first titles: ${uniqueTitles.size}/${refreshResults.length}`);
  console.log(`   • Unique sources: ${uniqueSources.size}/${refreshResults.length}`);
  
  // Display query rotation
  console.log('\n🔄 Query Rotation Pattern:');
  refreshResults.forEach((result, i) => {
    console.log(`   ${i + 1}. ${result.query?.substring(0, 50) || 'N/A'}... (${result.source})`);
  });
  
  // Test 4: Verify freshness guarantee
  console.log('\n4️⃣ Freshness Guarantee Test:');
  if (uniqueQueries.size > 1) {
    console.log('✅ PASS: Multiple unique queries detected - fresh content rotation working!');
  } else {
    console.log('⚠️  WARNING: All queries were the same - rotation may not be working');
  }
  
  if (uniqueTitles.size >= Math.min(3, refreshResults.length)) {
    console.log('✅ PASS: Good variety in article titles - fresh content confirmed!');
  } else {
    console.log('⚠️  WARNING: Low variety in article titles - may be showing same content');
  }
  
  console.log('\n🎉 Fresh News Functionality Test Complete!');
};

// Run the test
testFreshNews().catch(console.error);
