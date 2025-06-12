// Test News API endpoint
console.log('🧪 Testing News API...');

fetch('/api/news')
  .then(response => {
    console.log('📡 Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📰 News API Response:', data);
    
    if (data.success && data.articles) {
      console.log('✅ News API working correctly');
      console.log(`📊 Received ${data.articles.length} articles`);
      
      // Log first article details
      if (data.articles.length > 0) {
        const firstArticle = data.articles[0];
        console.log('📖 First Article:');
        console.log('  - Title:', firstArticle.title);
        console.log('  - Source:', firstArticle.source?.name || firstArticle.source);
        console.log('  - Published:', firstArticle.publishedAt);
        console.log('  - URL:', firstArticle.url);
      }
    } else {
      console.error('❌ Invalid response format:', data);
    }
  })
  .catch(error => {
    console.error('💥 Error testing News API:', error);
  });

// Test the component after a delay to see if it loads
setTimeout(() => {
  const newsPanel = document.querySelector('.news-panel') || 
                   document.querySelector('[data-testid="news-panel"]') ||
                   document.querySelector('[class*="news"]');
  
  if (newsPanel) {
    console.log('📱 Found news panel in DOM:', newsPanel);
  } else {
    console.log('ℹ️ News panel not found in DOM. Make sure you\'re on the applicant dashboard.');
  }
}, 3000);
