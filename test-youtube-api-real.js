// Quick test of the YouTube API
async function testYouTubeAPI() {
    console.log('🎬 Testing Real YouTube API Integration...\n');
    
    const testQueries = [
        'JavaScript fundamentals',
        'React hooks tutorial',
        'Python for beginners',
        'Node.js API development',
        'CSS flexbox guide'
    ];
    
    for (const query of testQueries) {
        try {
            console.log(`🔍 Testing: "${query}"`);
            
            const response = await fetch(`http://localhost:3002/api/youtube/videos?search=${encodeURIComponent(query)}&limit=6`);
            
            if (!response.ok) {
                console.log(`❌ HTTP Error: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.success && data.videos) {
                console.log(`✅ Success: ${data.videos.length} videos returned`);
                console.log(`📡 Source: ${data.source || 'unknown'}`);
                
                if (data.videos.length > 0) {
                    const firstVideo = data.videos[0];
                    console.log(`   📺 Sample: "${firstVideo.title}"`);
                    console.log(`   📺 Channel: ${firstVideo.channel}`);
                    console.log(`   📺 Views: ${firstVideo.views}`);
                    console.log(`   📺 Duration: ${firstVideo.duration}`);
                    console.log(`   📺 Thumbnail: ${firstVideo.thumbnail ? '✅ Available' : '❌ Missing'}`);
                }
            } else {
                console.log(`❌ API Error: ${data.error || 'Unknown error'}`);
                if (data.details) {
                    console.log(`   Details: ${data.details}`);
                }
            }
            
            console.log(''); // Empty line
            
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}\n`);
        }
    }
    
    console.log('🎉 YouTube API testing completed!');
}

// Test in browser console
console.log('Copy and paste this function into browser console to test:');
console.log('testYouTubeAPI();');
