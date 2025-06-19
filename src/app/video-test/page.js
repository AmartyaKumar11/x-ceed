'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VideoTestPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('javascript tutorial');

  const testVideoAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing video API with query:', query);
      
      const apiUrl = `/api/youtube/videos?search=${encodeURIComponent(query)}&limit=6`;
      console.log('📞 Calling API:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          console.log('🎥 Videos loaded:', data.videos.length);
          
          // Test first thumbnail
          const firstVideo = data.videos[0];
          console.log('First video thumbnail:', firstVideo.thumbnail);
        } else {
          setError('No videos found');
        }
      } else {
        const errorText = await response.text();
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Video API Test Page</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1"
          />
          <Button onClick={testVideoAPI} disabled={loading}>
            {loading ? 'Loading...' : 'Test API'}
          </Button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded">
            Error: {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <div className="relative aspect-video bg-gray-100">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log(`✅ Thumbnail ${index} loaded:`, video.thumbnail);
                }}
                onError={(e) => {
                  console.log(`❌ Thumbnail ${index} failed:`, e.target.src);
                  
                  // Try fallback
                  if (video.thumbnailFallback && e.target.src !== video.thumbnailFallback) {
                    console.log(`🔄 Trying fallback for ${index}:`, video.thumbnailFallback);
                    e.target.src = video.thumbnailFallback;
                  } else if (video.thumbnailAlternatives?.length > 0) {
                    const currentIndex = video.thumbnailAlternatives.indexOf(e.target.src);
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < video.thumbnailAlternatives.length) {
                      console.log(`🔄 Trying alternative ${nextIndex} for ${index}:`, video.thumbnailAlternatives[nextIndex]);
                      e.target.src = video.thumbnailAlternatives[nextIndex];
                    }
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                {video.duration}
              </div>
            </div>
            
            <div className="p-3">
              <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{video.channel}</p>
              <div className="text-xs text-muted-foreground">
                {video.views} • {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="mt-2 text-xs">
                <div>Thumbnail: {video.thumbnail?.substring(0, 50)}...</div>
                <div>Has fallback: {video.thumbnailFallback ? 'Yes' : 'No'}</div>
                <div>Alternatives: {video.thumbnailAlternatives?.length || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
