// Test Premium NewsAPI with Real API Key
console.log('🧪 Testing PREMIUM NewsAPI with your real API key...');

// Test premium NewsAPI endpoint
fetch('/api/news')
  .then(response => {
    console.log('📡 Premium NewsAPI Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📰 Premium NewsAPI Response:', data);
    
    if (data.success && data.articles) {
      console.log('✅ PREMIUM NewsAPI working with your API key!');
      console.log(`📊 Received ${data.articles.length} professional news articles`);
      
      // Show the sources to prove they're real
      const sources = [...new Set(data.articles.map(a => a.source?.name || a.source))];
      console.log('🏢 Professional Sources:', sources.join(', '));
      
      // Show first 3 real articles
      console.log('\n📖 Latest Real Tech News:');
      data.articles.slice(0, 3).forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   📰 ${article.source?.name || article.source}`);
        console.log(`   🕐 ${new Date(article.publishedAt).toLocaleString()}`);
        console.log(`   🔗 ${article.url}`);
        console.log(`   📄 ${article.description?.substring(0, 100)}...`);
      });
      
      console.log('\n🎉 SUCCESS: You now have REAL-TIME professional tech news!');
    } else {
      console.error('❌ Invalid response format:', data);
    }
  })
  .catch(error => {
    console.error('💥 Error testing Premium NewsAPI:', error);
    
    // Test fallback endpoint
    console.log('🔄 Testing fallback free sources...');
    fetch('/api/news/free')
      .then(response => response.json())
      .then(data => {
        console.log('📰 Fallback sources working:', data.articles?.length || 0, 'articles');
      })
      .catch(err => {
        console.error('❌ Fallback also failed:', err);
      });
  });

// Test auto-refresh simulation
setTimeout(() => {
  console.log('\n🔄 Testing refresh functionality...');
  fetch('/api/news')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Refresh test completed');
      console.log(`📊 Fresh articles fetched: ${data.articles?.length || 0}`);
      
      if (data.articles && data.articles.length > 0) {
        const latestArticle = data.articles[0];
        console.log('🆕 Latest article:', latestArticle.title);
        console.log('📅 Published:', new Date(latestArticle.publishedAt).toLocaleString());
      }
    })
    .catch(error => {
      console.error('❌ Refresh test failed:', error);
    });
}, 3000);

// Instructions for testing in the app
setTimeout(() => {
  console.log('\n📱 TO TEST IN YOUR APP:');
  console.log('1. Run: npm run dev');
  console.log('2. Go to: http://localhost:3002/dashboard/applicant');
  console.log('3. Look at the left news panel');
  console.log('4. Click the refresh button to get fresh news');
  console.log('5. Articles will auto-refresh every 5 minutes');
  console.log('\n✨ You now have LIVE tech news from major sources!');
}, 5000);
