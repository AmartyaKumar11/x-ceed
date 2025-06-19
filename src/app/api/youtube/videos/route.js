import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('search') || 'programming tutorial';
    const maxResults = parseInt(searchParams.get('maxResults') || searchParams.get('limit') || '12');
    const duration = searchParams.get('duration') || 'any';
    const order = searchParams.get('order') || 'relevance';
    const publishedAfter = searchParams.get('publishedAfter');

    // Check if we have YouTube API key
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (youtubeApiKey) {
      // Use real YouTube API
      return await fetchRealYouTubeVideos(query, maxResults, youtubeApiKey, duration, order, publishedAfter);
    } else {
      // Use enhanced mock data with working thumbnails
      return await fetchMockVideos(query, maxResults);
    }

  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos',
      videos: [],
      details: error.message
    }, { status: 500 });
  }
}

async function fetchRealYouTubeVideos(query, maxResults, apiKey, duration = 'any', order = 'relevance', publishedAfter = null) {
  try {
    // Map duration filter to YouTube API values
    let videoDuration = 'any';
    if (duration === 'short') videoDuration = 'short';
    else if (duration === 'medium') videoDuration = 'medium';
    else if (duration === 'long') videoDuration = 'long';

    // Search for videos with filters to prioritize educational content
    // We'll request more videos than needed to filter out shorts and low-quality content
    let searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&q=${encodeURIComponent(query + ' tutorial complete course programming')}&` +
      `maxResults=${Math.min(maxResults * 3, 50)}&key=${apiKey}&order=${order}&` +
      `videoDefinition=any&videoDuration=${videoDuration}&videoEmbeddable=true`;

    // Add published after filter if provided
    if (publishedAfter) {
      searchUrl += `&publishedAfter=${publishedAfter}`;
    }

    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return fetchMockVideos(query, maxResults);
    }

    // Get video details (duration, view count, etc.)
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`;    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Filter out shorts and prioritize educational content
    const filteredVideos = detailsData.items.filter(video => {
      const duration = video.contentDetails.duration;
      const title = video.snippet.title.toLowerCase();
      const channelTitle = video.snippet.channelTitle.toLowerCase();
      
      // Convert ISO 8601 duration to seconds for filtering
      const durationInSeconds = parseDuration(duration);
      
      // Filter criteria:
      // 1. Duration > 2 minutes (filter out shorts)
      // 2. Duration < 8 hours (filter out extremely long content)
      // 3. Prioritize known educational channels
      // 4. Filter out music, entertainment, non-educational content
      
      const isGoodDuration = durationInSeconds > 120 && durationInSeconds < 28800; // 2 min to 8 hours
      const isEducational = isEducationalContent(title, channelTitle);
      const isNotShorts = durationInSeconds > 60; // Shorts are typically under 60 seconds
      
      return isGoodDuration && isEducational && isNotShorts;
    });

    // Sort by educational quality and relevance
    const sortedVideos = filteredVideos.sort((a, b) => {
      const scoreA = calculateEducationalScore(a.snippet.title, a.snippet.channelTitle, a.contentDetails.duration);
      const scoreB = calculateEducationalScore(b.snippet.title, b.snippet.channelTitle, b.contentDetails.duration);
      return scoreB - scoreA; // Higher score first
    });

    // Take only the requested number of results
    const finalVideos = sortedVideos.slice(0, maxResults);    // Format videos for frontend
    const formattedVideos = finalVideos.map(video => {
      // Get the best available thumbnail with fallbacks
      const thumbnails = video.snippet.thumbnails;
      let thumbnailUrl = '';
      
      // Try different thumbnail qualities in order of preference
      if (thumbnails.medium?.url) {
        thumbnailUrl = thumbnails.medium.url;
      } else if (thumbnails.high?.url) {
        thumbnailUrl = thumbnails.high.url;
      } else if (thumbnails.default?.url) {
        thumbnailUrl = thumbnails.default.url;
      } else {
        // Fallback to direct YouTube thumbnail URL
        thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
      }
      
      // Create a reliable SVG fallback that works everywhere
      const svgFallback = `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="480" height="360" xmlns="http://www.w3.org/2000/svg">
          <rect width="480" height="360" fill="#0066cc"/>
          <text x="50%" y="45%" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">
            📺 ${video.snippet.title.split(' ').slice(0, 3).join(' ')}
          </text>
          <text x="50%" y="55%" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${video.snippet.channelTitle}
          </text>
        </svg>
      `).toString('base64')}`;
      
      return {
        id: video.id,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        channelTitle: video.snippet.channelTitle,
        thumbnail: thumbnailUrl,
        thumbnailFallback: svgFallback,
        thumbnailAlternatives: [
          `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
          `https://img.youtube.com/vi/${video.id}/default.jpg`
        ],
        publishedAt: video.snippet.publishedAt,
        duration: formatDuration(video.contentDetails.duration),
        views: formatViewCount(video.statistics.viewCount),
        description: video.snippet.description,
        url: `https://www.youtube.com/watch?v=${video.id}`
      };
    });

    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      totalResults: formattedVideos.length,
      query: query,
      source: 'youtube_api'
    });

  } catch (error) {
    console.error('YouTube API fetch error:', error);
    // Fallback to mock data if YouTube API fails
    return fetchMockVideos(query, maxResults);
  }
}

async function fetchMockVideos(query, maxResults) {
  // Enhanced mock data with working thumbnails
  const mockVideos = generateMockVideos(query, maxResults);
  
  return NextResponse.json({
    success: true,
    videos: mockVideos,
    totalResults: mockVideos.length,
    query: query,
    source: 'mock_data'
  });
}

function generateMockVideos(topic, count) {
  const channels = [
    'freeCodeCamp.org',
    'Traversy Media', 
    'Programming with Mosh',
    'The Net Ninja',
    'Academind',
    'Dev Ed',
    'Web Dev Simplified',
    'Coding Train',
    'Tech With Tim',
    'CS Dojo'
  ];

  const videoTypes = [
    'Complete Tutorial',
    'Crash Course',
    'Full Course',
    'Step by Step Guide',
    'Beginner Tutorial',
    'Advanced Guide',
    'Project Tutorial',
    'Explained Simply',
    'From Scratch',
    'Complete Guide'
  ];

  const durations = [
    '15:32', '28:45', '1:12:34', '45:21', '2:15:43', 
    '38:12', '1:45:22', '52:18', '3:21:45', '1:28:56'
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
    const views = viewCounts[i % viewCounts.length];    // Generate a realistic video ID
    const videoId = generateVideoId(topic, i);
      // Use actual YouTube thumbnail URLs that work with better fallbacks
    const mockVideoIds = [
      'dQw4w9WgXcQ', 'ScMzIvxBSi4', 'L_LUpnjgPso', 'fJ9rUzIMcZQ', 'ZbZSe6N_BXs',
      'DLzxrzFCyOs', '9drEtMBBdAI', 'WrAog6jFkFQ', 'YQHsXMglC9A', 'oHg5SJYRHA0',
      'jNQXAC9IVRw', 'me2TRQJDfJg', 'WlgrFtqUBzI', 'hTWKbfoikeg', 'Y8Wp3dafaMQ'
    ];
    const thumbnailVideoId = mockVideoIds[i % mockVideoIds.length];
    
    // Try multiple thumbnail URL formats for better reliability
    const primaryThumbnail = `https://img.youtube.com/vi/${thumbnailVideoId}/mqdefault.jpg`;
    const backupThumbnails = [
      `https://i.ytimg.com/vi/${thumbnailVideoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${thumbnailVideoId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${thumbnailVideoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${thumbnailVideoId}/default.jpg`
    ];
      // Backup thumbnail if YouTube thumbnail fails - more sophisticated SVG
    const backupThumbnail = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="480" height="360" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="480" height="360" fill="url(#bg)"/>
        <rect x="30" y="30" width="420" height="300" fill="#4B5563" rx="8" opacity="0.8"/>
        <circle cx="240" cy="160" r="45" fill="#6B7280"/>
        <polygon points="220,140 270,160 220,180" fill="#F9FAFB"/>
        <text x="240" y="220" font-size="16" fill="#F9FAFB" text-anchor="middle" font-family="Arial, sans-serif" font-weight="500">
          ${topic.split(' ').slice(0, 3).join(' ')} Tutorial
        </text>
        <text x="240" y="245" font-size="12" fill="#D1D5DB" text-anchor="middle" font-family="Arial, sans-serif">
          ${channel}
        </text>
        <text x="240" y="270" font-size="10" fill="#9CA3AF" text-anchor="middle" font-family="Arial, sans-serif">
          Programming • Tutorial
        </text>
      </svg>
    `).toString('base64')}`;
      
      videos.push({
      id: videoId,
      title: `${topic} ${videoType} - Learn ${topic} ${i === 0 ? 'for Beginners' : i === 1 ? 'Fast' : 'Complete Course'}`,
      channel: channel,
      channelTitle: channel,
      thumbnail: primaryThumbnail,
      thumbnailFallback: backupThumbnail,
      thumbnailAlternatives: backupThumbnails,
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

function formatDuration(isoDuration) {
  if (!isoDuration) return '0:00';
  
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function formatViewCount(viewCount) {
  if (!viewCount) return '0 views';
  
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K views`;
  } else {
    return `${count} views`;
  }
}

// Helper function to parse ISO 8601 duration to seconds
function parseDuration(isoDuration) {
  if (!isoDuration) return 0;
  
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to identify educational content
function isEducationalContent(title, channelTitle) {
  const educationalChannels = [
    'freecodecamp', 'traversy media', 'programming with mosh', 'the net ninja',
    'academind', 'dev ed', 'web dev simplified', 'coding train', 'tech with tim',
    'cs dojo', 'fireship', 'corey schafer', 'sentdex', 'derek banas',
    'thenewboston', 'leveluptuts', 'laracasts', 'wes bos', 'fun fun function',
    'edureka', 'simplilearn', 'programming knowledge', 'clever programmer',
    'code with harry', 'apna college', 'gate smashers', 'jenny\'s lectures',
    'code with mosh', 'net ninja', 'brad traversy', 'maximilian schwarzmüller',
    'angular university', 'react training', 'vue mastery', 'egghead'
  ];

  const educationalKeywords = [
    'tutorial', 'course', 'learn', 'guide', 'explained', 'beginner',
    'complete', 'crash course', 'step by step', 'full course', 'masterclass',
    'bootcamp', 'programming', 'coding', 'development', 'developer',
    'javascript', 'python', 'react', 'node', 'css', 'html', 'api',
    'database', 'web development', 'software', 'computer science'
  ];

  const nonEducationalKeywords = [
    'music', 'song', 'dance', 'funny', 'meme', 'reaction', 'review',
    'unboxing', 'vlog', 'gaming', 'entertainment', 'comedy', 'prank',
    'shorts', 'tiktok', 'challenge', 'vs', 'versus', 'drama'
  ];

  // Check if it's from a known educational channel
  const isEducationalChannel = educationalChannels.some(channel => 
    channelTitle.toLowerCase().includes(channel)
  );

  // Check for educational keywords in title
  const hasEducationalKeywords = educationalKeywords.some(keyword => 
    title.toLowerCase().includes(keyword)
  );

  // Check for non-educational keywords (negative score)
  const hasNonEducationalKeywords = nonEducationalKeywords.some(keyword => 
    title.toLowerCase().includes(keyword)
  );

  return (isEducationalChannel || hasEducationalKeywords) && !hasNonEducationalKeywords;
}

// Helper function to calculate educational score for sorting
function calculateEducationalScore(title, channelTitle, duration) {
  let score = 0;
  
  const titleLower = title.toLowerCase();
  const channelLower = channelTitle.toLowerCase();
  const durationInSeconds = parseDuration(duration);
  
  // Channel reputation score
  const premiumChannels = ['freecodecamp', 'programming with mosh', 'traversy media', 'the net ninja'];
  const goodChannels = ['academind', 'dev ed', 'web dev simplified', 'coding train', 'tech with tim'];
  
  if (premiumChannels.some(channel => channelLower.includes(channel))) {
    score += 50;
  } else if (goodChannels.some(channel => channelLower.includes(channel))) {
    score += 30;
  }
  
  // Title quality score
  if (titleLower.includes('complete')) score += 20;
  if (titleLower.includes('full course')) score += 25;
  if (titleLower.includes('crash course')) score += 15;
  if (titleLower.includes('tutorial')) score += 10;
  if (titleLower.includes('beginner')) score += 15;
  if (titleLower.includes('step by step')) score += 15;
  if (titleLower.includes('guide')) score += 10;
  if (titleLower.includes('explained')) score += 10;
  
  // Duration sweet spot (10 minutes to 3 hours is ideal for tutorials)
  if (durationInSeconds >= 600 && durationInSeconds <= 10800) { // 10 min to 3 hours
    score += 20;
  } else if (durationInSeconds >= 300 && durationInSeconds <= 21600) { // 5 min to 6 hours
    score += 10;
  }
  
  // Penalize very short content (likely shorts or low-quality)
  if (durationInSeconds < 300) { // Less than 5 minutes
    score -= 30;
  }
  
  // Penalize non-educational content
  const badKeywords = ['music', 'song', 'funny', 'meme', 'reaction', 'shorts'];
  if (badKeywords.some(keyword => titleLower.includes(keyword))) {
    score -= 50;
  }
  
  return score;
}
