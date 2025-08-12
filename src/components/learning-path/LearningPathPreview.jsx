'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Target, 
  Star, 
  Users, 
  BookOpen, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  Play,
  Edit3,
  RotateCcw,
  Save,
  Eye
} from 'lucide-react';
import CustomizationModal from './CustomizationModal';

export default function LearningPathPreview({ 
  prepPlan, 
  prepPlanId, 
  onPathUpdate,
  isCustomizable = true 
}) {
  const [customizations, setCustomizations] = useState({});
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [pathValidation, setPathValidation] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (prepPlan && Object.keys(customizations).length > 0) {
      validateEntirePath();
    }
  }, [customizations]);

  const validateEntirePath = async () => {
    setValidating(true);
    try {
      const response = await fetch('/api/learning-paths/customize', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prepPlanId,
          customizedContent: customizations
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPathValidation(result.data);
      }
    } catch (error) {
      console.error('Error validating path:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleContentReplace = (skill, newContent, validationResult) => {
    setCustomizations(prev => ({
      ...prev,
      [skill]: {
        ...prev[skill],
        replacedContent: newContent,
        validationResult
      }
    }));

    if (onPathUpdate) {
      onPathUpdate(customizations);
    }
  };

  const handleCustomizeSkill = (skill, currentContent) => {
    setSelectedSkill(skill);
    setShowCustomizationModal(true);
  };

  const resetCustomizations = () => {
    setCustomizations({});
    setPathValidation(null);
    if (onPathUpdate) {
      onPathUpdate({});
    }
  };

  const saveCustomizations = async () => {
    // Save customizations to backend
    try {
      const response = await fetch('/api/learning-paths/save-customizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prepPlanId,
          customizations
        })
      });

      if (response.ok) {
        // Show success message
        console.log('Customizations saved successfully');
      }
    } catch (error) {
      console.error('Error saving customizations:', error);
    }
  };

  const calculateTotalTime = () => {
    if (!prepPlan?.phases) return 0;
    
    return prepPlan.phases.reduce((total, phase) => {
      return total + phase.topics.reduce((phaseTotal, topic) => {
        const customContent = customizations[topic.title]?.replacedContent;
        return phaseTotal + (customContent?.estimatedCompletionTime || topic.estimatedHours * 60 || 0);
      }, 0);
    }, 0);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getCustomizationStats = () => {
    const totalTopics = prepPlan?.phases?.reduce((total, phase) => total + phase.topics.length, 0) || 0;
    const customizedTopics = Object.keys(customizations).length;
    
    return {
      totalTopics,
      customizedTopics,
      customizationPercentage: totalTopics > 0 ? Math.round((customizedTopics / totalTopics) * 100) : 0
    };
  };

  if (!prepPlan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No learning plan available</p>
        </CardContent>
      </Card>
    );
  }

  const stats = getCustomizationStats();
  const totalTime = calculateTotalTime();

  return (
    <div className="space-y-6">
      {/* Path Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Learning Path Overview
            </CardTitle>
            {isCustomizable && (
              <div className="flex items-center gap-2">
                {Object.keys(customizations).length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={resetCustomizations}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={saveCustomizations}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalTopics}</div>
              <div className="text-sm text-muted-foreground">Total Topics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.customizedTopics}</div>
              <div className="text-sm text-muted-foreground">Customized</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatTime(totalTime)}</div>
              <div className="text-sm text-muted-foreground">Est. Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{prepPlan.overview?.estimatedTimeWeeks || 0}w</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </div>

          {stats.customizedTopics > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Customization Progress</span>
                <span>{stats.customizationPercentage}%</span>
              </div>
              <Progress value={stats.customizationPercentage} className="h-2" />
            </div>
          )}

          {/* Path Validation Results */}
          {pathValidation && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {pathValidation.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-medium">
                  {pathValidation.isValid ? 'Path Validated' : 'Path Needs Attention'}
                </span>
              </div>

              {pathValidation.coverageAnalysis && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Skills Coverage:</span>
                    <p>{pathValidation.coverageAnalysis.coveragePercentage}%</p>
                  </div>
                  <div>
                    <span className="font-medium">Total Hours:</span>
                    <p>{pathValidation.coverageAnalysis.totalEstimatedHours}h</p>
                  </div>
                  <div>
                    <span className="font-medium">Skills Covered:</span>
                    <p>{pathValidation.coverageAnalysis.skillsCovered}/{pathValidation.coverageAnalysis.requiredSkills}</p>
                  </div>
                </div>
              )}

              {pathValidation.recommendations?.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Recommendations:</span>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    {pathValidation.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Phases */}
      <div className="space-y-4">
        {prepPlan.phases?.map((phase, phaseIndex) => (
          <Card key={phase.id || phaseIndex}>
            <CardHeader>
              <CardTitle className="text-lg">{phase.title}</CardTitle>
              {phase.description && (
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {phase.duration}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {phase.topics.length} topics
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phase.topics.map((topic, topicIndex) => {
                  const isCustomized = customizations[topic.title];
                  const customContent = isCustomized?.replacedContent;
                  
                  return (
                    <div 
                      key={topic.id || topicIndex}
                      className={`border rounded-lg p-4 ${isCustomized ? 'border-purple-200 bg-purple-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{topic.title}</h4>
                            {isCustomized && (
                              <Badge variant="secondary" className="text-xs">
                                Customized
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {topic.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {customContent ? 
                                formatTime(customContent.estimatedCompletionTime) : 
                                `${topic.estimatedHours}h`
                              }
                            </div>
                            {customContent && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {customContent.userStats?.averageRating || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {customContent.userStats?.completionRate || 0}% completion
                                </div>
                              </>
                            )}
                          </div>

                          {/* Show custom content details */}
                          {customContent && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <div className="flex items-center gap-2 mb-2">
                                <Play className="h-4 w-4 text-purple-600" />
                                <span className="font-medium text-sm">{customContent.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {customContent.channelTitle}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {customContent.metadata?.qualityRating || 'Good'}
                                </Badge>
                                {customContent.qualityIndicators?.slice(0, 2).map((indicator, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {indicator}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {isCustomizable && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCustomizeSkill(topic.title, customContent)}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              {isCustomized ? 'Change' : 'Customize'}
                            </Button>
                            {customContent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(customContent.url, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        skill={selectedSkill}
        currentContent={customizations[selectedSkill]?.replacedContent}
        onContentReplace={(newContent, validation) => 
          handleContentReplace(selectedSkill, newContent, validation)
        }
        prepPlanId={prepPlanId}
      />
    </div>
  );
}