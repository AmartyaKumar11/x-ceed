import { NextResponse } from 'next/server';

// Mock YouTube API - In production, you would use actual YouTube Data API
// You'll need to get a YouTube Data API key from Google Cloud Console
// and add it to your environment variables as YOUTUBE_API_KEY

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'latest technology';
    const category = searchParams.get('category') || '';
    const maxResults = searchParams.get('maxResults') || '10';

    // In a real implementation, you would make this call:
    /*
    const API_KEY = process.env.YOUTUBE_API_KEY;
    const searchQuery = category ? `${category} technology` : query;
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(searchQuery)}&type=video&order=relevance&publishedAfter=${new Date(Date.now() - 7*24*60*60*1000).toISOString()}&key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from YouTube API');
    }
    
    const data = await response.json();
    
    // Get video details for duration and view count
    const videoIds = data.items.map(item => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`
    );
    
    const detailsData = await detailsResponse.json();
    
    const videos = data.items.map((item, index) => {
      const details = detailsData.items[index];
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        duration: details?.contentDetails?.duration || 'PT0S',
        viewCount: details?.statistics?.viewCount || '0',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      };
    });
    */

    // Mock data for development
    const mockVideos = [
      {
        id: 'dQw4w9WgXcQ1',
        title: 'Top 10 Programming Languages to Learn in 2024',
        channelTitle: 'Tech Insights',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        publishedAt: '2024-12-01T10:00:00Z',
        duration: 'PT12M34S',
        viewCount: '125000',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ1'
      },
      {
        id: 'dQw4w9WgXcQ2',
        title: 'JavaScript Frameworks Comparison 2024',
        channelTitle: 'Code Academy',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        publishedAt: '2024-12-02T15:30:00Z',
        duration: 'PT8M45S',
        viewCount: '89000',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ2'
      },
      {
        id: 'dQw4w9WgXcQ3',
        title: 'AI and Machine Learning Trends',
        channelTitle: 'Future Tech',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        publishedAt: '2024-12-03T09:15:00Z',
        duration: 'PT15M22S',
        viewCount: '234000',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ3'
      },
      {
        id: 'dQw4w9WgXcQ4',
        title: 'Web Development Best Practices',
        channelTitle: 'Dev Masters',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        publishedAt: '2024-12-04T14:20:00Z',
        duration: 'PT10M15S',
        viewCount: '156000',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ4'
      },
      {
        id: 'dQw4w9WgXcQ5',
        title: 'Cloud Computing Explained Simply',
        channelTitle: 'Cloud Guru',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        publishedAt: '2024-12-05T11:45:00Z',
        duration: 'PT7M38S',
        viewCount: '78000',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ5'
      }
    ];

    // Filter by category if specified
    let filteredVideos = mockVideos;
    if (category) {
      const categoryFilters = {
        'programming': ['Programming', 'JavaScript', 'Web Development'],
        'ai': ['AI', 'Machine Learning'],
        'cloud': ['Cloud Computing'],
        'mobile': ['Mobile', 'React Native', 'Flutter'],
        'data': ['Data Science', 'Analytics']
      };
      
      const relevantKeywords = categoryFilters[category.toLowerCase()] || [];
      filteredVideos = mockVideos.filter(video => 
        relevantKeywords.some(keyword => 
          video.title.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    // Apply search query filter
    if (query && query !== 'latest technology') {
      filteredVideos = filteredVideos.filter(video =>
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.channelTitle.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Limit results
    const limitedVideos = filteredVideos.slice(0, parseInt(maxResults));

    return NextResponse.json({
      success: true,
      videos: limitedVideos,
      totalResults: limitedVideos.length
    });

  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos',
      videos: []
    }, { status: 500 });
  }
}

// Helper function to convert YouTube duration to readable format
function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  
  if (!matches) return '0:00';
  
  const hours = parseInt(matches[1] || 0);
  const minutes = parseInt(matches[2] || 0);
  const seconds = parseInt(matches[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Helper function to format view count
function formatViewCount(count) {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
