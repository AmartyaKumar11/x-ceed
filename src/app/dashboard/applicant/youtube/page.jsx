'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter,
  Play, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  Clock,
  Eye,
  ArrowLeft,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function YouTubePage() {
  const router = useRouter();  const [videos, setVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [error, setError] = useState(null);

  const categories = ['All', 'AI', 'Web Dev', 'Machine Learning', 'Gadgets', 'Space'];
  useEffect(() => {
    fetchVideos();
    loadSavedVideos();
  }, []);

  useEffect(() => {
    // Debounced search - refetch when search query or category changes
    const timeoutId = setTimeout(() => {
      fetchVideos(searchQuery, activeCategory);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeCategory]);
  const fetchVideos = async (searchQuery = '', category = 'All') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: searchQuery || 'latest technology',
        maxResults: '20'
      });
      
      if (category !== 'All') {
        params.append('category', category);
      }
      
      const response = await fetch(`/api/youtube/videos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.videos);
      } else {
        setError('Failed to load videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos');
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

  const removeSavedVideo = (videoId) => {
    const newSavedVideos = savedVideos.filter(saved => saved.id !== videoId);
    setSavedVideos(newSavedVideos);
    localStorage.setItem('savedYouTubeVideos', JSON.stringify(newSavedVideos));
  };

  const clearAllSaved = () => {
    setSavedVideos([]);
    localStorage.removeItem('savedYouTubeVideos');
  };

  const handleWatchNow = (videoUrl) => {
    window.open(videoUrl, '_blank');
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

  const VideoCard = ({ video, isSaved, onToggleSave, showRemove = false, onRemove }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative">
        {/* Thumbnail */}
        <div className="aspect-video bg-muted overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 flex items-center justify-center">
            <Play className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{video.channelName}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViewCount(video.viewCount)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(video.publishedAt)}
            </div>
          </div>
          {video.category && (
            <Badge variant="secondary" className="text-xs">
              {video.category}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 h-8"
            onClick={() => handleWatchNow(video.url)}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Watch Now
          </Button>
          {showRemove ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0"
              onClick={() => onRemove(video.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onToggleSave(video)}
            >
              {isSaved ? (
                <BookmarkCheck className="h-3 w-3 text-blue-600" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Play className="h-8 w-8 text-red-500" />
              Tech Videos Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover the latest technology videos and tutorials
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="browse">Browse Videos</TabsTrigger>
          <TabsTrigger value="saved" className="relative">
            Saved Videos
            {savedVideos.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {savedVideos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchVideos}>Try Again</Button>
            </div>          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => {
                const isSaved = savedVideos.some(saved => saved.id === video.id);
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isSaved={isSaved}
                    onToggleSave={toggleSaveVideo}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {savedVideos.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No saved videos yet</h3>
              <p className="text-muted-foreground">Save videos you want to watch later by clicking the bookmark icon.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {savedVideos.length} video{savedVideos.length !== 1 ? 's' : ''} saved
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllSaved}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isSaved={true}
                    onToggleSave={toggleSaveVideo}
                    showRemove={true}
                    onRemove={removeSavedVideo}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
