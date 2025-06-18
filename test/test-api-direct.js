// Test the YouTube API route directly
const fs = require('fs');
const path = require('path');

// Mock the NextResponse for testing
global.NextResponse = {
  json: (data, options = {}) => ({
    json: () => Promise.resolve(data),
    status: options.status || 200,
    data: data
  })
};

// Mock environment
process.env.YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'test-key';

async function testYouTubeAPI() {
  console.log('🧪 Testing YouTube API Route...\n');
  
  try {
    // Import the API route
    const routePath = path.join(__dirname, 'src', 'app', 'api', 'youtube', 'videos', 'route.js');
    const { GET } = require(routePath);
    
    // Mock request
    const mockRequest = {
      url: 'http://localhost:3000/api/youtube/videos?search=javascript&limit=3'
    };
    
    console.log('📞 Calling API with search: "javascript", limit: 3');
    const response = await GET(mockRequest);
    const data = response.data;
    
    console.log('\n📊 API Response:');
    console.log(`- Success: ${data.success}`);
    console.log(`- Source: ${data.source}`);
    console.log(`- Total Results: ${data.totalResults}`);
    console.log(`- Query: ${data.query}`);
    
    if (data.videos && data.videos.length > 0) {
      console.log('\n🎥 Videos:');
      data.videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channel}`);
        console.log(`   Duration: ${video.duration}`);
        console.log(`   Views: ${video.views}`);
        console.log(`   Thumbnail: ${video.thumbnail.substring(0, 80)}${video.thumbnail.length > 80 ? '...' : ''}`);
        if (video.thumbnailFallback) {
          console.log(`   Fallback: ${video.thumbnailFallback.substring(0, 80)}${video.thumbnailFallback.length > 80 ? '...' : ''}`);
        }
        if (video.thumbnailAlternatives) {
          console.log(`   Alternatives: ${video.thumbnailAlternatives.length} URLs`);
        }
      });
      
      // Test thumbnail formats
      console.log('\n🖼️ Thumbnail Analysis:');
      const thumbnailTypes = {
        'data:': 0,
        'https://img.youtube.com/': 0,
        'https://i.ytimg.com/': 0,
        'https://via.placeholder.com/': 0,
        'other': 0
      };
      
      data.videos.forEach(video => {
        let found = false;
        for (const [type, count] of Object.entries(thumbnailTypes)) {
          if (type !== 'other' && video.thumbnail.startsWith(type)) {
            thumbnailTypes[type]++;
            found = true;
            break;
          }
        }
        if (!found) {
          thumbnailTypes.other++;
        }
      });
      
      console.log('Thumbnail URL types:');
      Object.entries(thumbnailTypes).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`  - ${type}: ${count} video(s)`);
        }
      });
      
    } else {
      console.log('\n❌ No videos returned');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testYouTubeAPI();
