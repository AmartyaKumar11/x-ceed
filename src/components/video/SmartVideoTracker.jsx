'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from '@/components/ui/use-toast';
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Brain,
  TrendingDown,
  Shield
} from 'lucide-react';

export default function SmartVideoTracker({ 
  videoId, 
  videoTitle, 
  videoDuration, 
  onProgressUpdate,
  onVideoCompleted,
  minimumWatchPercentage = 75,
  allowedSpeedRange = { min: 0.75, max: 2.0 },
  enableAntiCheat = true 
}) {
  const { toast } = useToast();
  
  const [watchData, setWatchData] = useState({
    totalWatchTime: 0,
    actualProgress: 0,
    watchedSegments: new Set(),
    playbackSpeed: 1.0,
    averageSpeed: 1.0,
    focusTime: 0,
    blurTime: 0,
    seekCount: 0,
    pauseCount: 0,
    isEligibleForCompletion: false,
    qualityScore: 0,
    watchHistory: []
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [warnings, setWarnings] = useState([]);
  const [isTabVisible, setIsTabVisible] = useState(true);
  
  const playerRef = useRef(null);
  const startTimeRef = useRef(null);
  const speedHistoryRef = useRef([]);
  const lastUpdateRef = useRef(0);

  // YouTube Player API integration
  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      
      if (!isVisible && isPlaying) {
        updateWatchData(prev => ({
          ...prev,
          blurTime: prev.blurTime + 1
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  const initializePlayer = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event) => {
    const duration = event.target.getDuration();
    console.log('🎥 Player ready, duration:', duration);
  };

  const onPlayerStateChange = (event) => {
    const player = event.target;
    const currentTime = player.getCurrentTime();
    const playbackRate = player.getPlaybackRate();
    
    setCurrentTime(currentTime);
    setPlaybackSpeed(playbackRate);

    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        startTimeRef.current = Date.now();
        trackPlaybackStart(currentTime, playbackRate);
        break;
        
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        trackPlaybackPause(currentTime);
        break;
        
      case window.YT.PlayerState.ENDED:
        setIsPlaying(false);
        handleVideoEnd();
        break;
    }
  };

  const trackPlaybackStart = (currentTime, speed) => {
    speedHistoryRef.current.push({ 
      timestamp: Date.now(), 
      speed, 
      position: currentTime 
    });

    // Check for suspicious speed changes
    if (enableAntiCheat && speed > allowedSpeedRange.max) {
      addWarning('high_speed', `Playback speed ${speed}x is too high. Maximum allowed: ${allowedSpeedRange.max}x`);
    }
    
    if (enableAntiCheat && speed < allowedSpeedRange.min) {
      addWarning('low_speed', `Playback speed ${speed}x is too low. Minimum allowed: ${allowedSpeedRange.min}x`);
    }
  };

  const trackPlaybackPause = (currentTime) => {
    if (startTimeRef.current) {
      const watchDuration = (Date.now() - startTimeRef.current) / 1000;
      
      updateWatchData(prev => {
        const newWatchedSegments = new Set(prev.watchedSegments);
        const segmentStart = Math.floor(lastUpdateRef.current);
        const segmentEnd = Math.floor(currentTime);
        
        // Mark segments as watched
        for (let i = segmentStart; i <= segmentEnd; i++) {
          newWatchedSegments.add(i);
        }

        const newTotalWatchTime = prev.totalWatchTime + watchDuration;
        const actualProgress = (newWatchedSegments.size / videoDuration) * 100;
        const qualityScore = calculateQualityScore(prev, watchDuration, currentTime);

        return {
          ...prev,
          totalWatchTime: newTotalWatchTime,
          actualProgress,
          watchedSegments: newWatchedSegments,
          pauseCount: prev.pauseCount + 1,
          qualityScore,
          watchHistory: [...prev.watchHistory, {
            timestamp: Date.now(),
            duration: watchDuration,
            startPos: lastUpdateRef.current,
            endPos: currentTime,
            speed: prev.playbackSpeed
          }]
        };
      });

      lastUpdateRef.current = currentTime;
    }
  };

  const calculateQualityScore = (prevData, watchDuration, currentTime) => {
    let score = 0;
    
    // Base score for time watched
    score += Math.min(watchDuration / videoDuration * 100, 25);
    
    // Penalty for excessive speed
    const avgSpeed = speedHistoryRef.current.reduce((sum, entry) => sum + entry.speed, 0) / speedHistoryRef.current.length;
    if (avgSpeed > 1.5) {
      score -= 20;
    } else if (avgSpeed < 0.9) {
      score -= 10;
    }
    
    // Penalty for too many pauses
    if (prevData.pauseCount > videoDuration / 60) { // More than 1 pause per minute
      score -= 15;
    }
    
    // Penalty for tab switching
    const focusRatio = prevData.focusTime / (prevData.focusTime + prevData.blurTime);
    if (focusRatio < 0.8) {
      score -= 25;
    }
    
    // Bonus for consistent watching
    if (prevData.watchedSegments.size / videoDuration > 0.9) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  };

  const addWarning = (type, message) => {
    // Show toast notification immediately
    toast({
      title: "⚠️ Video Watching Warning",
      description: message,
      variant: "destructive",
      duration: 4000,
    });

    setWarnings(prev => {
      const existing = prev.find(w => w.type === type);
      if (existing) {
        return prev.map(w => w.type === type ? { ...w, count: w.count + 1, message } : w);
      }
      return [...prev, { type, message, count: 1, timestamp: Date.now() }];
    });
  };

  const handleVideoEnd = () => {
    const isEligible = checkCompletionEligibility();
    
    updateWatchData(prev => ({
      ...prev,
      isEligibleForCompletion: isEligible
    }));

    if (isEligible) {
      onVideoCompleted({
        ...watchData,
        isEligibleForCompletion: true,
        completedAt: new Date().toISOString()
      });
    }
  };

  const checkCompletionEligibility = () => {
    const progressPercentage = (watchData.watchedSegments.size / videoDuration) * 100;
    const qualityThreshold = 60; // Minimum quality score
    
    const isEligible = 
      progressPercentage >= minimumWatchPercentage &&
      watchData.qualityScore >= qualityThreshold &&
      warnings.filter(w => w.type === 'high_speed').length < 3;

    return isEligible;
  };

  const forceMarkComplete = () => {
    // Admin override - still tracks that it was forced
    onVideoCompleted({
      ...watchData,
      isEligibleForCompletion: false,
      forceCompleted: true,
      completedAt: new Date().toISOString()
    });
  };

  const updateWatchData = (updater) => {
    setWatchData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      // Defer the callback to avoid setState during render
      setTimeout(() => onProgressUpdate(newData), 0);
      return newData;
    });
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="aspect-video w-full relative">
        <div id={`youtube-player-${videoId}`} className="w-full h-full"></div>
        
        {/* Overlay warnings */}
        {warnings.length > 0 && (
          <div className="absolute top-4 right-4 space-y-2">
            {warnings.map((warning, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {warning.type === 'high_speed' && 'Speed Warning'}
                {warning.type === 'low_speed' && 'Slow Playback'}
                {warning.count > 1 && ` (${warning.count}x)`}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Progress Tracking Dashboard */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Watch Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Watch Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(watchData.actualProgress)}%
                </span>
              </div>
              <Progress value={watchData.actualProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Minimum required: {minimumWatchPercentage}%
              </div>
            </div>

            {/* Quality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  Quality Score
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(watchData.qualityScore)}/100
                </span>
              </div>
              <Progress 
                value={watchData.qualityScore} 
                className={`h-2 ${watchData.qualityScore >= 60 ? 'text-green-600' : 'text-red-600'}`} 
              />
              <div className="text-xs text-muted-foreground">
                Minimum for completion: 60
              </div>
            </div>

            {/* Watch Stats */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Watch Statistics</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total Time:</span>
                  <span>{Math.round(watchData.totalWatchTime / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Speed:</span>
                  <span>{watchData.averageSpeed.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Focus Time:</span>
                  <span>{Math.round((watchData.focusTime / (watchData.focusTime + watchData.blurTime)) * 100) || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Status */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {watchData.isEligibleForCompletion ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      Eligible for Completion
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">
                      Continue Watching
                    </span>
                  </>
                )}
              </div>

              {/* Admin Override (only show in development or for admins) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={forceMarkComplete}
                  className="text-xs"
                >
                  Force Complete (Dev)
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
