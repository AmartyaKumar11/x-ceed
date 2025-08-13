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
  Download,
  Brain,
  Shield,
  AlertTriangle,
  Trophy,
  Coins
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SmartVideoTracker from "@/components/video/SmartVideoTracker";
import LearningBetInterface from '@/components/betting/LearningBetInterface';
import PayoutCalculator from '@/components/betting/PayoutCalculator';
import BettingTestingPanelSimple from '@/components/betting/BettingTestingPanelSimple';

export default function VideoPlanPage() {
  const router = useRouter();
  const [videoPlan, setVideoPlan] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});
  const [completionData, setCompletionData] = useState({});
  
  // Blockchain betting state
  const [showBetting, setShowBetting] = useState(true); // Show betting by default
  const [activeBet, setActiveBet] = useState(null);
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState(null);

  useEffect(() => {
    const loadVideoPlan = async () => {
      try {
        // First, try to get from localStorage
        const savedPlan = localStorage.getItem('selectedVideoPlan');
        let plan = null;
        
        if (savedPlan) {
          plan = JSON.parse(savedPlan);
          setVideoPlan(plan);
          setPlanId(plan.planId);
        }

        // Then try to load from backend
        const userId = localStorage.getItem('userId') || 'temp-user-id'; // Replace with actual user ID
        const jobId = plan?.jobId || 'temp-job-id'; // Get from plan or URL params
        
        try {
          const response = await fetch(`/api/video-plans/custom?userId=${userId}&jobId=${jobId}`);
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.videoPlan) {
              const backendPlan = result.videoPlan;
              
              // Use backend data
              setVideoPlan({
                videos: backendPlan.videos,
                totalDuration: backendPlan.totalDuration,
                jobTitle: backendPlan.jobTitle,
                companyName: backendPlan.companyName,
                planId: backendPlan._id
              });
              
              setPlanId(backendPlan._id);
              
              // Load watched videos from backend
              if (backendPlan.watchedVideos) {
                setWatchedVideos(new Set(backendPlan.watchedVideos));
              }
              
              console.log('✅ Loaded video plan from backend');
            }
          }
        } catch (backendError) {
          console.log('⚠️ Backend not available, using localStorage:', backendError);
          // Continue with localStorage data
        }

        // Calculate AI estimated completion time
        if (plan && plan.videos) {
          const estimatedTime = calculateAIEstimatedTime(plan.videos);
          console.log('🤖 AI Estimated Time:', estimatedTime, 'seconds');
          console.log('📹 Number of videos:', plan.videos.length);
          setEstimatedCompletionTime(estimatedTime);
        }

        // Fallback: Load watched videos from localStorage if no backend data
        if (!planId) {
          const savedWatched = localStorage.getItem('watchedVideos');
          if (savedWatched) {
            setWatchedVideos(new Set(JSON.parse(savedWatched)));
          }
        }

        if (!plan && !planId) {
          // No plan found anywhere, redirect back
          router.push('/dashboard/applicant/prep-plan');
          return;
        }
        
      } catch (error) {
        console.error('❌ Error loading video plan:', error);
        router.push('/dashboard/applicant/prep-plan');
      } finally {
        setLoading(false);
      }
    };

    loadVideoPlan();
  }, [router]);

  const handleVideoProgress = (videoUrl, progressData) => {
    setVideoProgress(prev => ({
      ...prev,
      [videoUrl]: progressData
    }));
  };

  const handleVideoCompleted = async (videoUrl, completionData) => {
    // Only mark as completed if genuinely eligible
    if (completionData.isEligibleForCompletion) {
      const newWatchedVideos = new Set(watchedVideos);
      newWatchedVideos.add(videoUrl);
      setWatchedVideos(newWatchedVideos);
      
      // Store completion data for payout calculation
      setCompletionData(prev => ({
        ...prev,
        [videoUrl]: {
          ...completionData,
          qualityBonus: calculateQualityBonus(completionData),
          completionTime: new Date().toISOString()
        }
      }));

      // Save to localStorage as backup
      localStorage.setItem('watchedVideos', JSON.stringify([...newWatchedVideos]));
      
      // Save to backend if planId exists
      if (planId) {
        try {
          await fetch('/api/video-plans/custom', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              planId,
              watchedVideos: [...newWatchedVideos],
              completionData: {
                ...completionData,
                [videoUrl]: completionData
              }
            })
          });
          console.log('✅ Completion synced to backend');
        } catch (error) {
          console.error('⚠️ Failed to sync completion to backend:', error);
        }
      }
    } else if (completionData.forceCompleted) {
      // Handle force completion (reduced payout)
      const newWatchedVideos = new Set(watchedVideos);
      newWatchedVideos.add(videoUrl);
      setWatchedVideos(newWatchedVideos);
      
      setCompletionData(prev => ({
        ...prev,
        [videoUrl]: {
          ...completionData,
          qualityBonus: 0, // No bonus for forced completion
          payoutPenalty: 0.5, // 50% payout reduction
          completionTime: new Date().toISOString()
        }
      }));
    }
  };

  // Calculate AI estimated completion time for all videos
  const calculateAIEstimatedTime = (videos) => {
    if (!videos || videos.length === 0) return 0;
    
    let totalSeconds = 0;
    videos.forEach(video => {
      // Extract duration from video.duration (format: "PT4M33S" or similar)
      const duration = video.duration || '0';
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      
      if (match) {
        const minutes = parseInt(match[1] || '0', 10);
        const seconds = parseInt(match[2] || '0', 10);
        totalSeconds += (minutes * 60) + seconds;
      } else {
        // Fallback: estimate based on title/content (average 5 minutes per video)
        totalSeconds += 300;
      }
    });
    
    // Add buffer time for learning (20% extra)
    return Math.floor(totalSeconds * 1.2);
  };

  // Handle betting functionality
  const handleBetPlaced = (betData) => {
    setActiveBet(betData);
    setShowBetting(false);
  };

  // Handle test completion from testing panel
  const handleTestComplete = (testCompletions, testPayout) => {
    if (testCompletions && Object.keys(testCompletions).length > 0) {
      // Mark all videos as watched
      const videoUrls = videoPlan.videos.map(video => video.url);
      setWatchedVideos(new Set(videoUrls));
      
      // Set completion data for all videos
      setCompletionData(testCompletions);
      
      console.log('🧪 Test scenario completed:', {
        completedVideos: Object.keys(testCompletions).length,
        expectedPayout: testPayout
      });
    } else {
      // Clear test data
      setWatchedVideos(new Set());
      setCompletionData({});
    }
  };

  // Calculate overall quality score from all video completion data
  const calculateOverallQualityScore = () => {
    const completedVideos = Object.values(completionData);
    if (completedVideos.length === 0) return 0;
    
    const totalScore = completedVideos.reduce((sum, data) => {
      return sum + (data.qualityScore || 0);
    }, 0);
    
    return Math.round(totalScore / completedVideos.length);
  };

  // Calculate actual completion time for all videos
  const calculateActualCompletionTime = () => {
    const completedVideos = Object.values(completionData);
    if (completedVideos.length === 0) return null;
    
    return completedVideos.reduce((sum, data) => {
      return sum + (data.totalWatchTime || 0);
    }, 0);
  };

  const calculateQualityBonus = (completionData) => {
    // Calculate bonus based on quality metrics
    let bonus = 0;
    
    if (completionData.qualityScore >= 90) {
      bonus = 0.5; // 50% bonus for excellent quality
    } else if (completionData.qualityScore >= 75) {
      bonus = 0.25; // 25% bonus for good quality
    } else if (completionData.qualityScore >= 60) {
      bonus = 0; // No bonus but eligible
    }
    
    return bonus;
  };
  const toggleVideoWatched = async (videoUrl) => {
    // Check if user has watched enough of the video
    const progressData = videoProgress[videoUrl];
    
    if (!watchedVideos.has(videoUrl)) {
      // Trying to mark as complete
      if (!progressData || progressData.actualProgress < 75) {
        // Show warning - not enough progress
        alert(`⚠️ You must watch at least 75% of the video to mark it as completed.\n\nCurrent progress: ${Math.round(progressData?.actualProgress || 0)}%\n\nPlease continue watching the video.`);
        return;
      }
      
      if (progressData.qualityScore < 60) {
        // Show warning - quality too low
        alert(`⚠️ Video completion quality is too low (${Math.round(progressData.qualityScore)}/100).\n\nMinimum required: 60/100\n\nPlease watch the video more carefully:\n• Don't skip content\n• Keep playback speed reasonable\n• Stay focused on the video`);
        return;
      }
    }
    
    // Legacy method - for admin override or unmarking
    const newWatchedVideos = new Set(watchedVideos);
    if (newWatchedVideos.has(videoUrl)) {
      newWatchedVideos.delete(videoUrl);
      // Also remove completion data when unmarking
      setCompletionData(prev => {
        const newData = { ...prev };
        delete newData[videoUrl];
        return newData;
      });
    } else {
      newWatchedVideos.add(videoUrl);
      
      // If manually marking complete with sufficient progress, store completion data
      if (progressData && progressData.actualProgress >= 75) {
        setCompletionData(prev => ({
          ...prev,
          [videoUrl]: {
            ...progressData,
            manualCompletion: true,
            qualityBonus: calculateQualityBonus(progressData),
            completionTime: new Date().toISOString()
          }
        }));
      }
    }
    
    setWatchedVideos(newWatchedVideos);
    
    // Save to localStorage as backup
    localStorage.setItem('watchedVideos', JSON.stringify([...newWatchedVideos]));
    
    // Save to backend if planId exists
    if (planId) {
      try {
        await fetch('/api/video-plans/custom', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            watchedVideos: [...newWatchedVideos]
          })
        });
        console.log('✅ Watch progress synced to backend');
      } catch (error) {
        console.error('⚠️ Failed to sync watch progress to backend:', error);
      }
    }
  };

  const removeVideoFromPlan = async (videoUrl) => {
    if (!videoPlan) return;
    
    const updatedVideos = videoPlan.videos.filter(v => v.url !== videoUrl);
    const updatedPlan = {
      ...videoPlan,
      videos: updatedVideos,
      totalDuration: calculateTotalDuration(updatedVideos)
    };
    
    setVideoPlan(updatedPlan);
    localStorage.setItem('selectedVideoPlan', JSON.stringify(updatedPlan));
    
    // Update backend if planId exists
    if (planId) {
      try {
        await fetch('/api/video-plans/custom', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: localStorage.getItem('userId') || 'temp-user-id',
            jobId: videoPlan.jobId || 'temp-job-id',
            videos: updatedVideos,
            totalDuration: calculateTotalDuration(updatedVideos),
            jobTitle: videoPlan.jobTitle,
            companyName: videoPlan.companyName
          })
        });
        console.log('✅ Video plan updated in backend');
      } catch (error) {
        console.error('⚠️ Failed to update backend:', error);
      }
    }
    
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

  const calculateEarnings = () => {
    if (!videoPlan || videoPlan.videos.length === 0) return { base: 0, bonus: 0, total: 0 };
    
    const basePayoutPerVideo = 10; // Base $10 per video
    const completedVideos = videoPlan.videos.filter(v => watchedVideos.has(v.url));
    
    let baseEarnings = completedVideos.length * basePayoutPerVideo;
    let bonusEarnings = 0;
    
    completedVideos.forEach(video => {
      const completion = completionData[video.url];
      if (completion && completion.qualityBonus) {
        bonusEarnings += basePayoutPerVideo * completion.qualityBonus;
      }
      if (completion && completion.payoutPenalty) {
        baseEarnings -= basePayoutPerVideo * completion.payoutPenalty;
      }
    });
    
    return {
      base: baseEarnings,
      bonus: bonusEarnings,
      total: baseEarnings + bonusEarnings,
      completedCount: completedVideos.length,
      totalCount: videoPlan.videos.length
    };
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
          
          {/* Active Bet Display */}
          <div className="flex gap-3">
            {activeBet && (
              <Badge variant="secondary" className="px-3 py-1">
                <Coins className="h-4 w-4 mr-1" />
                Active Bet: {activeBet.stakeAmount} EDU
              </Badge>
            )}
          </div>
        </div>

        {/* Betting Interface */}
        {videoPlan && (
          <div className="mb-6">
            {estimatedCompletionTime ? (
              <LearningBetInterface
                courseId={planId || 'local-plan'}
                aiEstimatedTime={estimatedCompletionTime}
                courseDifficulty={1.2}
                onBetPlaced={handleBetPlaced}
              />
            ) : (
              <Card className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Trophy className="h-5 w-5" />
                  <p>Calculating AI estimated completion time...</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Simple Testing Button for Development */}
        {videoPlan && estimatedCompletionTime && activeBet && process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 bg-orange-500 rounded"></div>
              <h3 className="font-bold text-orange-800">Development Testing</h3>
            </div>
            <p className="text-sm text-orange-600 mb-3">
              Current Bet: {activeBet.amount || activeBet.stakeAmount} EDU | Click to instantly complete all videos and get your bet money back (break-even test)
            </p>
            <button
              onClick={() => {
                // Create test completion data
                const testCompletions = {};
                videoPlan.videos.forEach((video, index) => {
                  const videoKey = video.url || `video-${index}`;
                  testCompletions[videoKey] = {
                    totalWatchTime: activeBet.challengeTime * 60, // Use actual challenge time
                    actualProgress: 100,
                    qualityScore: 70, // Break-even quality score
                    forceCompleted: true,
                    devModeBreakEven: true,
                    isEligibleForCompletion: true,
                    completedAt: new Date().toISOString()
                  };
                });
                
                console.log('🧪 Test data created:', testCompletions);
                console.log('💰 Expected payout:', activeBet.amount || activeBet.stakeAmount, 'EDU (break-even)');
                
                handleTestComplete(testCompletions, null);
                
                // Show success message
                alert(`✅ Test Complete!\n\nAll ${videoPlan.videos.length} videos marked as completed.\nExpected payout: ${activeBet.amount || activeBet.stakeAmount} EDU (break-even)\n\nCheck the Payout Calculator below for details.`);
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
            >
              🧪 Break Even Test - Complete All Videos Instantly
            </button>
            <div className="mt-2 text-xs text-orange-600">
              Videos to complete: {videoPlan.videos.length} | Bet: {activeBet.amount || activeBet.stakeAmount} EDU | Timeline: {Math.round(activeBet.challengeTime / 60)}min
            </div>
          </div>
        )}

        {/* Payout Calculator for Active Bet */}
        {activeBet && (
          <div className="mb-6">
            <PayoutCalculator
              stakeAmount={activeBet.amount || activeBet.stakeAmount}
              aiEstimatedTime={estimatedCompletionTime}
              userChallengeTime={activeBet.challengeTime}
              currentQualityScore={calculateOverallQualityScore()}
              actualTime={calculateActualCompletionTime()}
              completionData={Object.values(completionData)[0] || null}
            />
          </div>
        )}

        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Videos Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{videoPlan.videos.length}</div>
              <div className="text-sm text-muted-foreground">Total Videos</div>
            </CardContent>
          </Card>

          {/* Completed Videos Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{watchedVideos.size}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>

          {/* Total Duration Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{formatDuration(videoPlan.totalDuration)}</div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </CardContent>
          </Card>

          {/* Remaining Duration Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{formatDuration(getRemainingDuration())}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </CardContent>
          </Card>

          {/* Earnings Card - Clickable */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-purple-200 hover:border-purple-400"
            onClick={() => router.push('/dashboard/applicant/earnings')}
            title="Click to view earnings history"
          >
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">${calculateEarnings().total.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                Earnings 
                {calculateEarnings().bonus > 0 && (
                  <div className="text-xs text-green-600">+${calculateEarnings().bonus.toFixed(2)} bonus</div>
                )}
                <div className="text-xs text-blue-600 mt-1 flex items-center justify-center gap-1">
                  <span>👆</span> Click for history
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Completion Progress</span>
                <span className="font-medium">{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-3" />
              <div className="text-center text-sm text-muted-foreground">
                {watchedVideos.size} of {videoPlan.videos.length} videos completed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Video Player Section */}
        {selectedVideo && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Smart Learning Player - {selectedVideo.title}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVideo(null)}
                  >
                    Close Player
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SmartVideoTracker
                videoId={getYouTubeVideoId(selectedVideo.url)}
                videoTitle={selectedVideo.title}
                videoDuration={parseDuration(selectedVideo.duration) * 60} // Convert to seconds
                onProgressUpdate={(progressData) => handleVideoProgress(selectedVideo.url, progressData)}
                onVideoCompleted={(completionData) => handleVideoCompleted(selectedVideo.url, completionData)}
                minimumWatchPercentage={75}
                allowedSpeedRange={{ min: 0.75, max: 2.0 }}
                enableAntiCheat={true}
              />
              
              {/* Additional Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                  
                  {videoProgress[selectedVideo.url] && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Quality: {Math.round(videoProgress[selectedVideo.url].qualityScore || 0)}/100
                    </Badge>
                  )}
                </div>
                
                {/* Legacy manual completion (for admin override) */}
                <Button
                  variant={watchedVideos.has(selectedVideo.url) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleVideoWatched(selectedVideo.url)}
                  className={`${
                    watchedVideos.has(selectedVideo.url) 
                      ? "bg-green-600 hover:bg-green-700" 
                      : videoProgress[selectedVideo.url]?.actualProgress >= 75
                        ? "border-green-500 text-green-600"
                        : "border-red-500 text-red-600 opacity-60"
                  } text-xs`}
                  disabled={!watchedVideos.has(selectedVideo.url) && (!videoProgress[selectedVideo.url] || videoProgress[selectedVideo.url].actualProgress < 75)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {watchedVideos.has(selectedVideo.url) 
                    ? "Completed" 
                    : videoProgress[selectedVideo.url]?.actualProgress >= 75
                      ? "Manual Complete"
                      : `Need ${75 - Math.round(videoProgress[selectedVideo.url]?.actualProgress || 0)}% more`
                  }
                </Button>
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
                        <div className="absolute top-1 left-1 flex gap-1">
                          <div className="bg-green-600 text-white rounded-full p-1">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                          {completionData[video.url] && (
                            <div className={`text-white rounded px-1 text-xs ${
                              completionData[video.url].qualityScore >= 75 ? 'bg-green-600' : 
                              completionData[video.url].qualityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              Q: {Math.round(completionData[video.url].qualityScore || 0)}
                            </div>
                          )}
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
                        className={`${
                          watchedVideos.has(video.url) 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : videoProgress[video.url]?.actualProgress >= 75
                              ? "border-green-500 text-green-600 hover:bg-green-50"
                              : "border-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                        }`}
                        disabled={!watchedVideos.has(video.url) && (!videoProgress[video.url] || videoProgress[video.url].actualProgress < 75)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {watchedVideos.has(video.url) 
                          ? "Completed" 
                          : videoProgress[video.url]?.actualProgress >= 75
                            ? "Mark Complete"
                            : `Watch ${75 - Math.round(videoProgress[video.url]?.actualProgress || 0)}% more`
                        }
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
