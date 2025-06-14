// Test AI-powered video suggestions
async function testAIVideoSuggestions() {
    console.log('🤖 Testing AI-Powered Video Suggestions...\n');
    
    const baseUrl = 'http://localhost:3000/api/youtube/videos';
    const testQueries = [
        'JavaScript fundamentals',
        'React hooks',
        'Python for beginners',
        'Node.js API development',
        'CSS flexbox',
        'MongoDB database design',
        'AWS deployment',
        'Docker containers'
    ];
    
    for (const query of testQueries) {
        try {
            console.log(`🔍 Testing: "${query}"`);
            
            const response = await fetch(`${baseUrl}?search=${encodeURIComponent(query)}&limit=6`);
            
            if (!response.ok) {
                console.log(`❌ HTTP Error: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.success && data.videos) {
                console.log(`✅ Success: ${data.videos.length} videos returned`);
                console.log(`🤖 AI Generated: ${data.aiGenerated ? 'Yes' : 'No (using fallback)'}`);
                
                // Check first video details
                if (data.videos.length > 0) {
                    const firstVideo = data.videos[0];
                    console.log(`   📺 Sample: "${firstVideo.title}"`);
                    console.log(`   📺 Channel: ${firstVideo.channel}`);
                    console.log(`   📺 Duration: ${firstVideo.duration}`);
                    console.log(`   📺 Views: ${firstVideo.views}`);
                    console.log(`   📺 Description: ${firstVideo.description.substring(0, 100)}...`);
                    
                    // Check if it's topic-specific
                    const queryWords = query.toLowerCase().split(' ');
                    const isRelevant = queryWords.some(word => 
                        firstVideo.title.toLowerCase().includes(word) ||
                        firstVideo.description.toLowerCase().includes(word)
                    );
                    
                    console.log(`   🎯 Topic Relevance: ${isRelevant ? '✅ Highly Relevant' : '⚠️  May need improvement'}`);
                }
                
            } else {
                console.log(`❌ API Error: ${data.error || 'Unknown error'}`);
                if (data.details) {
                    console.log(`   Details: ${data.details}`);
                }
            }
            
            console.log(''); // Empty line for readability
            
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}\n`);
        }
    }
    
    console.log('🎉 AI video suggestion testing completed!');
}

// Test if running in Node.js environment
if (typeof window === 'undefined') {
    // Node.js environment - need to install node-fetch first
    console.log('To run this test, first install node-fetch:');
    console.log('npm install node-fetch');
    console.log('Then add this line at the top of the file:');
    console.log('const fetch = require("node-fetch");');
} else {
    // Browser environment - can run directly
    testAIVideoSuggestions().catch(console.error);
}
