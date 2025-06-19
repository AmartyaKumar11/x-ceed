// Debug script to test video API and thumbnails
const testVideoAPI = async () => {
  try {
    console.log('🧪 Testing video API...');
    
    const testQuery = 'javascript tutorial';
    const apiUrl = `/api/youtube/videos?search=${encodeURIComponent(testQuery)}&limit=3`;
    
    console.log('📞 Calling API:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.videos && data.videos.length > 0) {
        console.log('🎥 First video details:');
        const firstVideo = data.videos[0];
        console.log('- Title:', firstVideo.title);
        console.log('- Thumbnail:', firstVideo.thumbnail);
        console.log('- Thumbnail fallback:', firstVideo.thumbnailFallback);
        console.log('- Channel:', firstVideo.channel);
        
        // Test thumbnail loading
        if (firstVideo.thumbnail) {
          const img = new Image();
          img.onload = () => console.log('✅ Thumbnail loads successfully');
          img.onerror = (e) => console.log('❌ Thumbnail failed to load:', e);
          img.src = firstVideo.thumbnail;
        }
      }
    } else {
      console.error('❌ API call failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

// Run the test
if (typeof window !== 'undefined') {
  testVideoAPI();
}

export default testVideoAPI;
