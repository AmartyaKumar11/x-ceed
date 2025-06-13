import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }
    
    // Validate that it's a YouTube thumbnail URL
    if (!url.includes('img.youtube.com') && !url.includes('i.ytimg.com')) {
      return NextResponse.json({ error: 'Invalid thumbnail URL' }, { status: 400 });
    }
    
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch thumbnail: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Thumbnail proxy error:', error);
    
    // Return a placeholder image
    const placeholderUrl = 'https://via.placeholder.com/480x360/0066cc/ffffff?text=Video+Thumbnail';
    const placeholderResponse = await fetch(placeholderUrl);
    const placeholderBuffer = await placeholderResponse.arrayBuffer();
    
    return new NextResponse(placeholderBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
