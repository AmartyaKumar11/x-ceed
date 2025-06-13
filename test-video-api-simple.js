// Quick test for the YouTube videos API
async function testVideoAPI() {
    console.log('🎬 Testing YouTube Videos API...\n');
    
    const testQueries = [
        'JavaScript fundamentals',
        'React hooks',
        'Python basics',
        'Node.js tutorial',
        'CSS flexbox'
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
                console.log(`📡 Source: ${data.source}`);
                
                // Check first video
                if (data.videos.length > 0) {
                    const video = data.videos[0];
                    console.log(`   📺 "${video.title}"`);
                    console.log(`   📺 Channel: ${video.channel}`);
                    console.log(`   📺 Duration: ${video.duration}`);
                    console.log(`   📺 Views: ${video.views}`);
                    console.log(`   📺 Thumbnail: ${video.thumbnail ? '✅' : '❌'}`);
                }
            } else {
                console.log(`❌ Error: ${data.error}`);
            }
            
            console.log('');
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}\n`);
        }
    }
}

// Run in browser console
testVideoAPI();
