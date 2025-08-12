'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Clock, 
  CheckCircle, 
  Plus,
  Minus,
  Calculator,
  Target,
  Zap,
  Eye,
  Star,
  Users,
  Calendar,
  TrendingUp,
  Loader2,
  Youtube,
  BookOpen
} from 'lucide-react';

export default function VideoSelectionManager({ 
  skill, 
  availableVideos = [], 
  onSelectionChange,
  onDurationCalculated,
  className = "" 
}) {
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [customTimeline, setCustomTimeline] = useState(7); // days
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(1);
  const [loading, setLoading] = useState(false);

  // Calculate totals whenever selection changes
  useEffect(() => {
    calculateTotals();
  }, [selectedVideos, customTimeline, studyHoursPerDay]);

  const calculateTotals = () => {
    const totalWatchTime = selectedVideos.reduce((sum, video) => {
      return sum + (video.duration || 0);
    }, 0);

    const totalStudyTime = totalWatchTime * 1.5; // Add practice time (50% more)
    const totalHours = totalStudyTime / 60; // Convert to hours
    const dailyRequirement = totalHours / customTimeline;
    const feasible = dailyRequirement <= studyHoursPerDay;

    const totals = {
      selectedCount: selectedVideos.length,
      totalWatchTime: Math.round(totalWatchTime),
      totalStudyTime: Math.round(totalStudyTime),
      totalHours: Math.round(totalHours * 10) / 10,
      customTimeline,
      studyHoursPerDay,
      dailyRequirement: Math.round(dailyRequirement * 10) / 10,
      feasible,
      difficulty: calculateDifficulty(),
      selectedVideos: selectedVideos
    };

    if (onDurationCalculated) {
      onDurationCalculated(totals);
    }

    if (onSelectionChange) {
      onSelectionChange(selectedVideos, totals);
    }
  };

  const calculateDifficulty = () => {
    if (selectedVideos.length === 0) return 1;

    // Base difficulty on video count, duration, and timeline
    const avgDuration = selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0) / selectedVideos.length;
    const timelineFactor = Math.max(1, 14 / customTimeline); // Shorter timeline = higher difficulty
    const contentFactor = Math.min(3, selectedVideos.length / 3); // More videos = higher difficulty
    const durationFactor = Math.min(2, avgDuration / 20); // Longer videos = higher difficulty

    return Math.min(10, Math.round((timelineFactor + contentFactor + durationFactor) * 1.5));
  };

  const toggleVideoSelection = (video) => {
    setSelectedVideos(prev => {
      const isSelected = prev.some(v => v.id === video.id);
      if (isSelected) {
        return prev.filter(v => v.id !== video.id);
      } else {
        return [...prev, video];
      }
    });
  };

  const selectAllVideos = () => {
    setSelectedVideos([...availableVideos]);
  };

  const clearSelection = () => {
    setSelectedVideos([]);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toString() || '0';
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty <= 3) return 'text-green-600 bg-green-50 border-green-200';
    if (difficulty <= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getFeasibilityColor = (feasible) => {
    return feasible ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Custom Learning Plan for {skill}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select videos and customize your timeline to create a personalized study plan with dynamic betting.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="selection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="selection">Video Selection</TabsTrigger>
              <TabsTrigger value="timeline">Timeline Setup</TabsTrigger>
              <TabsTrigger value="summary">Plan Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="selection" className="space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllVideos}>
                    <Plus className="h-4 w-4 mr-2" />
                    Select All ({availableVideos.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <Minus className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
                <Badge variant="secondary">
                  {selectedVideos.length} selected
                </Badge>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {availableVideos.map((video) => {
                  const isSelected = selectedVideos.some(v => v.id === video.id);
                  
                  return (
                    <Card 
                      key={video.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                      }`}
                      onClick={() => toggleVideoSelection(video)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => toggleVideoSelection(video)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 mb-2">
                              {video.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {video.channelTitle}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(video.duration)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {formatViewCount(video.viewCount)}
                                </div>
                              </div>
                              {video.userStats?.averageRating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {video.userStats.averageRating}
                                </div>
                              )}
                            </div>

                            {video.qualityIndicators && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {video.qualityIndicators.slice(0, 2).map((indicator, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {indicator}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {availableVideos.length === 0 && (
                <div className="text-center py-8">
                  <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No videos available for this skill</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Completion Timeline (Days)
                    </Label>
                    <Input
                      type="number"
                      value={customTimeline}
                      onChange={(e) => setCustomTimeline(parseInt(e.target.value) || 1)}
                      min="1"
                      max="365"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many days do you want to complete this plan?
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      Study Hours Per Day
                    </Label>
                    <Input
                      type="number"
                      value={studyHoursPerDay}
                      onChange={(e) => setStudyHoursPerDay(parseFloat(e.target.value) || 0.5)}
                      min="0.5"
                      max="12"
                      step="0.5"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many hours can you study per day?
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Real-time Feasibility Check */}
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm mb-3">Feasibility Check</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Study Time:</span>
                          <span className="font-mono">
                            {formatDuration(selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0) * 1.5)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Requirement:</span>
                          <span className={`font-mono ${getFeasibilityColor(
                            (selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0) * 1.5 / 60 / customTimeline) <= studyHoursPerDay
                          )}`}>
                            {((selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0) * 1.5 / 60 / customTimeline) || 0).toFixed(1)}h/day
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Your Capacity:</span>
                          <span className="font-mono">{studyHoursPerDay}h/day</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {((selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0) * 1.5 / 60 / customTimeline) || 0) <= studyHoursPerDay ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">Feasible Plan</span>
                              </>
                            ) : (
                              <>
                                <Target className="h-4 w-4 text-red-600" />
                                <span className="text-red-600 font-medium">Challenging Plan</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Difficulty Indicator */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm mb-3">Plan Difficulty</h4>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`${getDifficultyColor(calculateDifficulty())} font-mono`}
                        >
                          {calculateDifficulty()}/10
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {calculateDifficulty() <= 3 ? 'Easy' : 
                           calculateDifficulty() <= 6 ? 'Moderate' : 'Challenging'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on content volume, timeline, and daily commitment
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              {selectedVideos.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedVideos.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Videos</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatDuration(selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Watch Time</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {customTimeline}
                        </div>
                        <div className="text-sm text-muted-foreground">Days</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className={`text-2xl font-bold ${getDifficultyColor(calculateDifficulty()).split(' ')[0]}`}>
                          {calculateDifficulty()}/10
                        </div>
                        <div className="text-sm text-muted-foreground">Difficulty</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Selected Videos List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Selected Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedVideos.map((video, index) => (
                          <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{video.title}</h4>
                              <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono">{formatDuration(video.duration)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatViewCount(video.viewCount)} views
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ready for Betting */}
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-600">Ready for Demo Betting</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your custom learning plan is ready. You can now place a virtual bet on completing 
                        this plan within your chosen timeline.
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Time:</span>
                          <div className="font-mono text-green-600">
                            {formatDuration(selectedVideos.reduce((sum, v) => sum + (v.duration || 0), 0) * 1.5)}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Timeline:</span>
                          <div className="font-mono text-green-600">{customTimeline} days</div>
                        </div>
                        <div>
                          <span className="font-medium">Difficulty:</span>
                          <div className="font-mono text-green-600">{calculateDifficulty()}/10</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select videos to see your plan summary</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}