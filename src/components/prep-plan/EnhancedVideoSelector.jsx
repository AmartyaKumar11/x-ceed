'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  BookOpen,
  Settings,
  BarChart3,
  Timer,
  Award,
  Lightbulb
} from 'lucide-react';

export default function EnhancedVideoSelector({ 
  skills = [],
  onPlanGenerated,
  initialDuration = 4,
  className = "" 
}) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillVideos, setSkillVideos] = useState({});
  const [selectedVideos, setSelectedVideos] = useState({});
  const [customSettings, setCustomSettings] = useState({
    totalWeeks: initialDuration,
    studyHoursPerDay: 2,
    practiceMultiplier: 1.5, // 50% more time for practice
    bufferTime: 20, // 20% buffer for understanding
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('skills');
  const [planPreview, setPlanPreview] = useState(null);

  useEffect(() => {
    if (skills.length > 0) {
      setSelectedSkills(skills.slice(0, 3)); // Auto-select first 3 skills
      fetchVideosForSkills(skills.slice(0, 3));
    }
  }, [skills]);

  useEffect(() => {
    calculatePlanPreview();
  }, [selectedVideos, customSettings]);

  const fetchVideosForSkills = async (skillsToFetch) => {
    setLoading(true);
    try {
      const videosData = {};
      
      for (const skill of skillsToFetch) {
        try {
          const response = await fetch(`/api/youtube/videos?q=${encodeURIComponent(skill + ' tutorial programming')}&maxResults=10&duration=medium`);
          if (response.ok) {
            const data = await response.json();
            videosData[skill] = data.videos || [];
          } else {
            videosData[skill] = [];
          }
        } catch (error) {
          console.error(`Error fetching videos for ${skill}:`, error);
          videosData[skill] = [];
        }
      }
      
      setSkillVideos(videosData);
      
      // Auto-select top 3 videos for each skill
      const autoSelected = {};
      Object.keys(videosData).forEach(skill => {
        autoSelected[skill] = videosData[skill].slice(0, 3);
      });
      setSelectedVideos(autoSelected);
      
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlanPreview = () => {
    const totalVideos = Object.values(selectedVideos).flat().length;
    const totalWatchTime = Object.values(selectedVideos)
      .flat()
      .reduce((sum, video) => sum + (parseDuration(video.duration) || 0), 0);
    
    const totalStudyTime = totalWatchTime * customSettings.practiceMultiplier;
    const totalWithBuffer = totalStudyTime * (1 + customSettings.bufferTime / 100);
    const totalHours = totalWithBuffer / 60;
    const dailyHours = totalHours / (customSettings.totalWeeks * 7);
    
    const feasible = dailyHours <= customSettings.studyHoursPerDay;
    const intensity = calculateIntensity(dailyHours, customSettings.studyHoursPerDay);
    
    setPlanPreview({
      totalVideos,
      totalWatchTime: Math.round(totalWatchTime),
      totalStudyTime: Math.round(totalStudyTime),
      totalHours: Math.round(totalHours * 10) / 10,
      dailyHours: Math.round(dailyHours * 10) / 10,
      feasible,
      intensity,
      skills: Object.keys(selectedVideos).length,
      weeksDistribution: distributeAcrossWeeks()
    });
  };

  const distributeAcrossWeeks = () => {
    const weeks = [];
    const skillKeys = Object.keys(selectedVideos);
    const videosPerWeek = Math.ceil(Object.values(selectedVideos).flat().length / customSettings.totalWeeks);
    
    let currentWeek = 1;
    let videoIndex = 0;
    
    while (currentWeek <= customSettings.totalWeeks && videoIndex < Object.values(selectedVideos).flat().length) {
      const weekVideos = [];
      const weekSkills = new Set();
      
      for (let i = 0; i < videosPerWeek && videoIndex < Object.values(selectedVideos).flat().length; i++) {
        const skillIndex = Math.floor(videoIndex / (Object.values(selectedVideos).flat().length / skillKeys.length));
        const skill = skillKeys[Math.min(skillIndex, skillKeys.length - 1)];
        const video = Object.values(selectedVideos).flat()[videoIndex];
        
        if (video) {
          weekVideos.push(video);
          weekSkills.add(skill);
          videoIndex++;
        }
      }
      
      const weekDuration = weekVideos.reduce((sum, v) => sum + (parseDuration(v.duration) || 0), 0);
      
      weeks.push({
        week: currentWeek,
        videos: weekVideos,
        skills: Array.from(weekSkills),
        duration: weekDuration,
        studyTime: Math.round(weekDuration * customSettings.practiceMultiplier),
        focus: currentWeek <= customSettings.totalWeeks / 3 ? 'Fundamentals' :
               currentWeek <= customSettings.totalWeeks * 2/3 ? 'Application' : 'Mastery'
      });
      
      currentWeek++;
    }
    
    return weeks;
  };

  const calculateIntensity = (required, available) => {
    const ratio = required / available;
    if (ratio <= 0.5) return { level: 'Light', color: 'text-green-600', value: 1 };
    if (ratio <= 0.8) return { level: 'Moderate', color: 'text-blue-600', value: 2 };
    if (ratio <= 1.0) return { level: 'Intensive', color: 'text-orange-600', value: 3 };
    return { level: 'Extreme', color: 'text-red-600', value: 4 };
  };

  const parseDuration = (duration) => {
    if (!duration) return 0;
    
    // Handle MM:SS format
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 60;
      } else if (parts.length === 3) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
      }
    }
    
    // Handle ISO 8601 format (PT12M34S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      return hours * 60 + minutes + seconds / 60;
    }
    
    return 0;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const toggleVideoSelection = (skill, video) => {
    setSelectedVideos(prev => {
      const skillVideos = prev[skill] || [];
      const isSelected = skillVideos.some(v => v.id === video.id);
      
      if (isSelected) {
        return {
          ...prev,
          [skill]: skillVideos.filter(v => v.id !== video.id)
        };
      } else {
        return {
          ...prev,
          [skill]: [...skillVideos, video]
        };
      }
    });
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const generateCustomPlan = async () => {
    if (!planPreview || planPreview.totalVideos === 0) {
      alert('Please select some videos first!');
      return;
    }

    const customPlan = {
      type: 'custom',
      duration: customSettings.totalWeeks,
      totalVideos: planPreview.totalVideos,
      totalHours: planPreview.totalHours,
      dailyCommitment: planPreview.dailyHours,
      intensity: planPreview.intensity,
      skills: Object.keys(selectedVideos),
      selectedVideos: selectedVideos,
      weeklyDistribution: planPreview.weeksDistribution,
      settings: customSettings,
      feasible: planPreview.feasible,
      createdAt: new Date().toISOString()
    };

    if (onPlanGenerated) {
      onPlanGenerated(customPlan);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Custom Video Learning Plan
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select specific videos and customize your timeline for a personalized study experience.
          </p>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 p-1 bg-muted rounded-lg">
            {[
              { id: 'skills', label: 'Select Skills', icon: BookOpen },
              { id: 'videos', label: 'Choose Videos', icon: Youtube },
              { id: 'timeline', label: 'Customize Timeline', icon: Settings },
              { id: 'preview', label: 'Plan Preview', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Skills</h3>
                <Badge variant="secondary">{selectedSkills.length} selected</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.map((skill) => (
                  <Card 
                    key={skill}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedSkills.includes(skill) ? 'ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' : ''
                    }`}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedSkills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{skill}</h4>
                          <p className="text-xs text-muted-foreground">
                            {skillVideos[skill]?.length || 0} videos available
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => {
                    fetchVideosForSkills(selectedSkills);
                    setActiveTab('videos');
                  }}
                  disabled={selectedSkills.length === 0 || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading Videos...
                    </>
                  ) : (
                    <>
                      <Youtube className="h-4 w-4 mr-2" />
                      Load Videos for Selected Skills
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-6">
              {Object.keys(skillVideos).map((skill) => (
                <div key={skill} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{skill}</h3>
                    <Badge variant="secondary">
                      {(selectedVideos[skill] || []).length} / {skillVideos[skill]?.length || 0} selected
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {(skillVideos[skill] || []).map((video) => {
                      const isSelected = (selectedVideos[skill] || []).some(v => v.id === video.id);
                      
                      return (
                        <Card 
                          key={video.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' : ''
                          }`}
                          onClick={() => toggleVideoSelection(skill, video)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                checked={isSelected}
                                onChange={() => toggleVideoSelection(skill, video)}
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
                                      {video.duration}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      {video.viewCount}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Button 
                  onClick={() => setActiveTab('timeline')}
                  disabled={Object.values(selectedVideos).flat().length === 0}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Customize Timeline
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Total Duration (Weeks)
                    </Label>
                    <Input
                      type="number"
                      value={customSettings.totalWeeks}
                      onChange={(e) => setCustomSettings(prev => ({
                        ...prev,
                        totalWeeks: parseInt(e.target.value) || 1
                      }))}
                      min="1"
                      max="52"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      Study Hours Per Day
                    </Label>
                    <Input
                      type="number"
                      value={customSettings.studyHoursPerDay}
                      onChange={(e) => setCustomSettings(prev => ({
                        ...prev,
                        studyHoursPerDay: parseFloat(e.target.value) || 0.5
                      }))}
                      min="0.5"
                      max="12"
                      step="0.5"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4" />
                      Practice Multiplier
                    </Label>
                    <Select 
                      value={customSettings.practiceMultiplier.toString()}
                      onValueChange={(value) => setCustomSettings(prev => ({
                        ...prev,
                        practiceMultiplier: parseFloat(value)
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.2">1.2x (Minimal practice)</SelectItem>
                        <SelectItem value="1.5">1.5x (Balanced practice)</SelectItem>
                        <SelectItem value="2.0">2.0x (Heavy practice)</SelectItem>
                        <SelectItem value="2.5">2.5x (Mastery focus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Timer className="h-4 w-4" />
                      Buffer Time (%)
                    </Label>
                    <Input
                      type="number"
                      value={customSettings.bufferTime}
                      onChange={(e) => setCustomSettings(prev => ({
                        ...prev,
                        bufferTime: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {planPreview && (
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Real-time Calculation
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Videos:</span>
                            <span className="font-mono">{planPreview.totalVideos}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Watch Time:</span>
                            <span className="font-mono">{formatDuration(planPreview.totalWatchTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Study Time:</span>
                            <span className="font-mono">{formatDuration(planPreview.totalStudyTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Hours:</span>
                            <span className="font-mono">{planPreview.totalHours}h</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span>Daily Requirement:</span>
                            <span className={`font-mono ${planPreview.feasible ? 'text-green-600' : 'text-red-600'}`}>
                              {planPreview.dailyHours}h/day
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your Capacity:</span>
                            <span className="font-mono">{customSettings.studyHoursPerDay}h/day</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2">
                              {planPreview.feasible ? (
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
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={planPreview.intensity.color}>
                                {planPreview.intensity.level} Intensity
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => setActiveTab('preview')}
                  disabled={!planPreview || planPreview.totalVideos === 0}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Preview Learning Plan
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && planPreview && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {planPreview.totalVideos}
                    </div>
                    <div className="text-sm text-muted-foreground">Videos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDuration(planPreview.totalStudyTime)}
                    </div>
                    <div className="text-sm text-muted-foreground">Study Time</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {customSettings.totalWeeks}
                    </div>
                    <div className="text-sm text-muted-foreground">Weeks</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className={`text-2xl font-bold ${planPreview.intensity.color}`}>
                      {planPreview.intensity.level}
                    </div>
                    <div className="text-sm text-muted-foreground">Intensity</div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {planPreview.weeksDistribution.map((week) => (
                      <div key={week.week} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">Week {week.week}: {week.focus}</h4>
                          <Badge variant="outline">{formatDuration(week.studyTime)}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-600">Videos:</span>
                            <p>{week.videos.length} videos</p>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Skills:</span>
                            <p>{week.skills.join(', ')}</p>
                          </div>
                          <div>
                            <span className="font-medium text-purple-600">Watch Time:</span>
                            <p>{formatDuration(week.duration)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-600 dark:text-green-400">Ready to Generate</h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    Your custom learning plan is configured. Click below to generate the final prep plan
                    with your selected videos and timing.
                  </p>
                  
                  <Button 
                    onClick={generateCustomPlan}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Generate Custom Prep Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
