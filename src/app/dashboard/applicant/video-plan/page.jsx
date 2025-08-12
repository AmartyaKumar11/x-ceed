'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  Youtube,
  ArrowLeft,
  Target,
  Calendar,
  Book,
  Trash2,
  ExternalLink,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function VideoPlanPage() {
  const router = useRouter();
  const [videoPlan, setVideoPlan] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load video plan from localStorage
    const savedPlan = localStorage.getItem('selectedVideoPlan');
    if (savedPlan) {
      const plan = JSON.parse(savedPlan);
      setVideoPlan(plan);
      
      // Load watched videos from localStorage
      const savedWatched = localStorage.getItem('watchedVideos');
      if (savedWatched) {
        setWatchedVideos(new Set(JSON.parse(savedWatched)));
      }
    } else {
      // No plan found, redirect back
      router.push('/dashboard/applicant/prep-plan');
    }
    setLoading(false);
  }, [router]);

  const toggleVideoWatched = (videoUrl) => {
    const newWatchedVideos = new Set(watchedVideos);
    if (newWatchedVideos.has(videoUrl)) {
      newWatchedVideos.delete(videoUrl);
    } else {
      newWatchedVideos.add(videoUrl);
    }
    setWatchedVideos(newWatchedVideos);
    
    // Save to localStorage
    localStorage.setItem('watchedVideos', JSON.stringify([...newWatchedVideos]));
  };

  const removeVideoFromPlan = (videoUrl) => {
    if (!videoPlan) return;
    
    const updatedVideos = videoPlan.videos.filter(v => v.url !== videoUrl);
    const updatedPlan = {
      ...videoPlan,
      videos: updatedVideos,
      totalDuration: calculateTotalDuration(updatedVideos)
    };
    
    setVideoPlan(updatedPlan);
    localStorage.setItem('selectedVideoPlan', JSON.stringify(updatedPlan));
    
    // Remove from watched videos too
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.delete(videoUrl);
    setWatchedVideos(newWatchedVideos);
    localStorage.setItem('watchedVideos', JSON.stringify([...newWatchedVideos]));
  };

  const calculateTotalDuration = (videos) => {
    return videos.reduce((total, video) => {
      const duration = parseDuration(video.duration);
      return total + duration;
    }, 0);
  };

  const parseDuration = (durationStr) => {
    if (!durationStr) return 0;
    
    const parts = durationStr.split(':').map(p => parseInt(p) || 0);
    
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      return parts[0] + parts[1] / 60;
    } else {
      return parts[0] || 0;
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const getYouTubeVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const calculateProgress = () => {
    if (!videoPlan || videoPlan.videos.length === 0) return 0;
    const watchedCount = videoPlan.videos.filter(v => watchedVideos.has(v.url)).length;
    return (watchedCount / videoPlan.videos.length) * 100;
  };

  const getRemainingDuration = () => {
    if (!videoPlan) return 0;
    const unwatchedVideos = videoPlan.videos.filter(v => !watchedVideos.has(v.url));
    return calculateTotalDuration(unwatchedVideos);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 top-16 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading your video plan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!videoPlan) {
    return (
      <div className="fixed inset-0 top-16 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Youtube className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Video Plan Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't selected any videos for your learning plan yet.
              </p>
              <Button onClick={() => router.push('/dashboard/applicant/prep-plan')}>
                Go Back to Prep Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/applicant/prep-plan')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prep Plan
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Video Learning Plan</h1>
              <p className="text-muted-foreground">
                {videoPlan.jobTitle} at {videoPlan.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{videoPlan.videos.length}</div>
                <div className="text-sm text-muted-foreground">Total Videos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{watchedVideos.size}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatDuration(videoPlan.totalDuration)}</div>
                <div className="text-sm text-muted-foreground">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatDuration(getRemainingDuration())}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Video Player Section */}
        {selectedVideo && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Now Playing
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                >
                  Close Player
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-video w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.url)}?autoplay=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedVideo.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVideo.channel} • {selectedVideo.views} views • {selectedVideo.duration}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        const aiAssistantUrl = `/video-ai-assistant?videoId=${getYouTubeVideoId(selectedVideo.url)}&title=${encodeURIComponent(selectedVideo.title)}&channel=${encodeURIComponent(selectedVideo.channel)}`;
                        window.open(aiAssistantUrl, '_blank');
                      }}
                    >
                      Open with AI Assistant
                    </Button>
                    <Button
                      variant={watchedVideos.has(selectedVideo.url) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVideoWatched(selectedVideo.url)}
                      className={watchedVideos.has(selectedVideo.url) ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {watchedVideos.has(selectedVideo.url) ? "Completed" : "Mark Complete"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              Video Learning Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videoPlan.videos.map((video, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    watchedVideos.has(video.url) 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                      <img 
                        src={video.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI4MCIgeT0iNDUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSI+VmlkZW88L3RleHQ+PC9zdmc+'} 
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedVideo(video)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all cursor-pointer" onClick={() => setSelectedVideo(video)}>
                        <Play className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                        {video.duration}
                      </div>
                      {watchedVideos.has(video.url) && (
                        <div className="absolute top-1 left-1 bg-green-600 text-white rounded-full p-1">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2 text-gray-900 dark:text-gray-100">{video.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{video.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{video.channel}</span>
                        <span>{video.views} views</span>
                        <span>{video.duration}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedVideo(video)}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={watchedVideos.has(video.url) ? "default" : "outline"}
                        onClick={() => toggleVideoWatched(video.url)}
                        className={watchedVideos.has(video.url) ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {watchedVideos.has(video.url) ? "Done" : "Mark Done"}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(video.url, '_blank')}
                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        YouTube
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeVideoFromPlan(video.url)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-800"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {videoPlan.videos.length === 0 && (
              <div className="text-center py-8">
                <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No videos in your plan yet</p>
                <Button 
                  onClick={() => router.push('/dashboard/applicant/prep-plan')}
                  className="mt-2"
                >
                  Add Videos to Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Actions */}
        {videoPlan.videos.length > 0 && calculateProgress() === 100 && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">🎉 Congratulations!</h3>
              <p className="text-green-700 mb-4">
                You've completed your entire video learning plan! You're now ready to apply for the job.
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => router.push('/dashboard/applicant/saved-jobs')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  View Job Opportunities
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard/applicant/prep-plan')}
                >
                  Back to Prep Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
