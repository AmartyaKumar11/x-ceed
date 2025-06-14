// Simple test of thumbnail generation logic
function generateMockVideos(topic, count) {
  const channels = [
    'freeCodeCamp.org',
    'Traversy Media', 
    'Programming with Mosh',
    'The Net Ninja',
    'Academind',
    'Coding Tech'
  ];

  const videoTypes = [
    'Tutorial', 'Complete Course', 'Crash Course', 'Masterclass', 
    'Guide', 'Workshop', 'Bootcamp', 'Full Course'
  ];

  const durations = [
    '15:32', '1:24:17', '45:23', '2:15:44', '32:18', 
    '58:09', '1:45:33', '23:56', '3:12:21', '41:07'
  ];

  const viewCounts = [
    '1.2M views', '850K views', '2.3M views', '450K views', '3.1M views',
    '675K views', '1.8M views', '920K views', '4.2M views', '1.5M views'
  ];

  const videos = [];
  
  for (let i = 0; i < count; i++) {
    const channel = channels[i % channels.length];
    const videoType = videoTypes[i % videoTypes.length];
    const duration = durations[i % durations.length];
    const views = viewCounts[i % viewCounts.length];

    // Generate a realistic video ID
    const videoId = generateVideoId(topic, i);
    
    // Create reliable SVG thumbnail that always works
    const svgThumbnail = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="480" height="360" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="360" fill="#0066cc"/>
        <circle cx="240" cy="180" r="30" fill="white" opacity="0.9"/>
        <polygon points="230,165 250,180 230,195" fill="#0066cc"/>
        <text x="240" y="250" font-size="18" fill="white" text-anchor="middle">
          ${topic.split(' ')[0]} Tutorial
        </text>
        <text x="240" y="280" font-size="14" fill="white" text-anchor="middle" opacity="0.8">
          ${channel}
        </text>
      </svg>
    `).toString('base64')}`;
    
    videos.push({
      id: videoId,
      title: `${topic} ${videoType} - Learn ${topic} ${i === 0 ? 'for Beginners' : i === 1 ? 'Fast' : 'Complete Course'}`,
      channel: channel,
      channelTitle: channel,
      thumbnail: svgThumbnail,
      thumbnailFallback: svgThumbnail,
      publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      duration: duration,
      views: views,
      description: `Learn ${topic} in this comprehensive tutorial. Perfect for ${i % 3 === 0 ? 'beginners' : i % 3 === 1 ? 'intermediate learners' : 'advanced developers'} who want to master ${topic}. We'll cover all the fundamentals and practical examples.`,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
  }
  
  return videos;
}

function generateVideoId(topic, index) {
  // Generate a realistic-looking YouTube video ID (11 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const seed = topic.toLowerCase().replace(/[^a-z]/g, '') + index.toString();
  
  // Use a simple hash-like approach for consistency
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
  }
  
  for (let i = 0; i < 11; i++) {
    result += chars[Math.abs(hash + i) % chars.length];
  }
  
  return result;
}

// Test the function
console.log('🧪 Testing Mock Video Generation...\n');

const testTopics = ['JavaScript', 'React', 'Python', 'Node.js'];

testTopics.forEach(topic => {
  console.log(`\n📚 Testing topic: ${topic}`);
  const videos = generateMockVideos(topic, 3);
  
  videos.forEach((video, index) => {
    console.log(`\n${index + 1}. ${video.title}`);
    console.log(`   Channel: ${video.channel}`);
    console.log(`   Duration: ${video.duration} | Views: ${video.views}`);
    console.log(`   Thumbnail type: ${video.thumbnail.startsWith('data:') ? 'SVG Data URL' : 'External URL'}`);
    console.log(`   Thumbnail length: ${video.thumbnail.length} characters`);
    
    // Verify it's a valid base64 data URL
    if (video.thumbnail.startsWith('data:image/svg+xml;base64,')) {
      try {
        const base64Data = video.thumbnail.split(',')[1];
        const decoded = Buffer.from(base64Data, 'base64').toString();
        console.log(`   ✅ Valid SVG (${decoded.length} chars decoded)`);
      } catch (e) {
        console.log(`   ❌ Invalid base64: ${e.message}`);
      }
    }
  });
});

console.log('\n🎯 Summary: All videos should have working SVG thumbnails that display immediately.');
console.log('These thumbnails are embedded as base64 data URLs, so they never fail to load.');
