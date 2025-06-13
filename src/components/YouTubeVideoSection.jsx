'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  Clock,
  Eye,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function YouTubeVideoSection() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedVideos, setSavedVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingVideos();
    loadSavedVideos();
  }, []);  const fetchTrendingVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching YouTube videos...');
      
      const response = await fetch('/api/youtube/videos?q=latest technology&maxResults=5');
      console.log('YouTube API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('YouTube API data:', data);
      
      if (data.success && data.videos) {
        setVideos(data.videos);
        console.log('Successfully loaded', data.videos.length, 'videos');
      } else {
        throw new Error(data.error || 'Failed to load videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError(`Failed to load videos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedVideos = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedYouTubeVideos');
      if (saved) {
        setSavedVideos(JSON.parse(saved));
      }
    }
  };

  const toggleSaveVideo = (video) => {
    const isCurrentlySaved = savedVideos.some(saved => saved.id === video.id);
    let newSavedVideos;
    
    if (isCurrentlySaved) {
      newSavedVideos = savedVideos.filter(saved => saved.id !== video.id);
    } else {
      newSavedVideos = [...savedVideos, { ...video, savedAt: new Date().toISOString() }];
    }
    
    setSavedVideos(newSavedVideos);
    localStorage.setItem('savedYouTubeVideos', JSON.stringify(newSavedVideos));
  };
  const formatDuration = (duration) => {
    // Convert YouTube duration format (PT12M34S) to readable format (12:34)
    if (!duration || typeof duration !== 'string') return duration;
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const formatViewCount = (viewCount) => {
    if (!viewCount) return '0';
    
    const num = parseInt(viewCount);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return viewCount;
  };

  const formatTimeAgo = (publishedAt) => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleWatchNow = (videoUrl) => {
    window.open(videoUrl, '_blank');
  };

  const handleViewMore = () => {
    router.push('/dashboard/applicant/youtube');
  };

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-red-500" />
            Trending Tech Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-red-500" />
            Trending Tech Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTrendingVideos}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="h-fit border-2 border-red-200 dark:border-red-800">
      <CardHeader className="pb-3 bg-red-50 dark:bg-red-950/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="h-5 w-5 text-red-500" />
          Trending Tech Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0"><ScrollArea className="h-[400px] px-6">
          <div className="space-y-3">
            {videos.slice(0, 5).map((video) => {
              const isSaved = savedVideos.some(saved => saved.id === video.id);
              
              return (
                <div 
                  key={video.id} 
                  className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-14 bg-muted rounded-md overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 flex items-center justify-center">
                        <Play className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {video.title}
                    </h4>                    <p className="text-xs text-muted-foreground mt-1">
                      {video.channelTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatViewCount(video.viewCount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(video.publishedAt)}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => handleWatchNow(video.url)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Watch
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleSaveVideo(video)}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-3 w-3 text-blue-600" />
                        ) : (
                          <Bookmark className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* View More Button */}
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2"
            onClick={handleViewMore}
          >
            View More
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
