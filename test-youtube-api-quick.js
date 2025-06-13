// Quick API test for the YouTube videos endpoint
async function testYouTubeAPI() {
    console.log('🎬 Testing YouTube Videos API...\n');
    
    const baseUrl = 'http://localhost:3000/api/youtube/videos';
    const testQueries = [
        'javascript',
        'react',
        'python',
        'nodejs',
        'aws',
        'docker',
        'database',
        'system design',
        'machine learning',
        'web development'
    ];
    
    for (const query of testQueries) {
        try {
            console.log(`🔍 Testing: ${query.toUpperCase()}`);
            
            const response = await fetch(`${baseUrl}?search=${encodeURIComponent(query)}&limit=6`);
            
            if (!response.ok) {
                console.log(`❌ HTTP Error: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.success && data.videos) {
                console.log(`✅ Success: ${data.videos.length} videos returned`);
                
                // Check first video details
                if (data.videos.length > 0) {
                    const firstVideo = data.videos[0];
                    console.log(`   📺 Sample: "${firstVideo.title.substring(0, 60)}..."`);
                    console.log(`   📺 Channel: ${firstVideo.channel}`);
                    console.log(`   📺 Thumbnail: ${firstVideo.thumbnail ? '✅ Working' : '❌ Missing'}`);
                    console.log(`   📺 Duration: ${firstVideo.duration}`);
                    console.log(`   📺 Views: ${firstVideo.views}`);
                    
                    // Test thumbnail URL
                    try {
                        const thumbnailResponse = await fetch(firstVideo.thumbnail);
                        console.log(`   🖼️  Thumbnail Status: ${thumbnailResponse.ok ? '✅ Accessible' : '❌ Not Accessible'}`);
                    } catch (e) {
                        console.log(`   🖼️  Thumbnail Status: ❌ Error accessing`);
                    }
                }
                
                // Check if videos are topic-specific
                const isTopicSpecific = data.videos.some(video => 
                    video.title.toLowerCase().includes(query.toLowerCase()) ||
                    video.description.toLowerCase().includes(query.toLowerCase())
                );
                
                console.log(`   🎯 Topic Relevance: ${isTopicSpecific ? '✅ Relevant' : '⚠️  Generic'}`);
                
            } else {
                console.log(`❌ API Error: ${data.error || 'Unknown error'}`);
            }
            
            console.log(''); // Empty line for readability
            
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}\n`);
        }
    }
    
    console.log('🎉 API testing completed!');
}

// Test if running in Node.js environment
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    testYouTubeAPI().catch(console.error);
} else {
    // Browser environment
    console.log('Run this in a browser console or Node.js environment');
}
