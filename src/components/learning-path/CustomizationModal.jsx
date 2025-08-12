'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Star, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Play,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Zap,
  Eye,
  ThumbsUp,
  MessageCircle,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';

export default function CustomizationModal({ 
  isOpen, 
  onClose, 
  skill, 
  currentContent, 
  onContentReplace,
  prepPlanId 
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('any');
  const [contentTypeFilter, setContentTypeFilter] = useState('any');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedContent, setSelectedContent] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (isOpen && skill) {
      fetchRecommendations();
    }
  }, [isOpen, skill, difficultyFilter, contentTypeFilter]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skill: skill,
        difficulty: difficultyFilter !== 'any' ? difficultyFilter : 'intermediate',
        contentType: contentTypeFilter !== 'any' ? contentTypeFilter : 'structured-course',
        limit: '15'
      });

      const response = await fetch(`/api/learning-paths/customize?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRecommendations(result.data.recommendations || []);
      } else {
        console.error('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelect = async (content) => {
    setSelectedContent(content);
    setValidating(true);
    
    try {
      // Validate content substitution
      const response = await fetch('/api/learning-paths/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prepPlanId,
          skillId: skill,
          originalContentId: currentContent?.id,
          newContentId: content.id,
          newContentData: content,
          customizationReason: 'User preference - better fit'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result.data.validationResult);
      }
    } catch (error) {
      console.error('Error validating content:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmReplacement = () => {
    if (selectedContent && validationResult?.isValid) {
      onContentReplace(selectedContent, validationResult);
      onClose();
    }
  };

  const filteredRecommendations = recommendations.filter(content => {
    if (searchTerm && !content.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'quality':
        return b.qualityScore - a.qualityScore;
      case 'popularity':
        return b.viewCount - a.viewCount;
      case 'rating':
        return parseFloat(b.userStats.averageRating) - parseFloat(a.userStats.averageRating);
      case 'duration':
        return a.duration - b.duration;
      default: // relevance
        return b.relevanceScore - a.relevanceScore;
    }
  });

  const getQualityColor = (rating) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Very Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Fair': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
    return count.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Customize Learning Content for {skill}
          </DialogTitle>
          <DialogDescription>
            Choose alternative content that better fits your learning style and preferences.
            All content is AI-analyzed for quality and relevance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="browse" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Alternatives</TabsTrigger>
              <TabsTrigger value="preview" disabled={!selectedContent}>
                Preview Selection
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 overflow-hidden">
              {/* Search and Filters */}
              <div className="space-y-4 mb-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchRecommendations}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Difficulty</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Content Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Type</SelectItem>
                      <SelectItem value="crash-course">Crash Course</SelectItem>
                      <SelectItem value="comprehensive-course">Comprehensive</SelectItem>
                      <SelectItem value="structured-course">Structured</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="rating">User Rating</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Finding the best content for you...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecommendations.map((content) => (
                      <Card 
                        key={content.id} 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedContent?.id === content.id ? 'ring-2 ring-purple-500' : ''
                        }`}
                        onClick={() => handleContentSelect(content)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <Badge 
                              variant="outline" 
                              className={getQualityColor(content.metadata.qualityRating)}
                            >
                              {content.metadata.qualityRating}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {content.userStats.averageRating}
                            </div>
                          </div>
                          <CardTitle className="text-sm line-clamp-2">
                            {content.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="text-xs text-muted-foreground">
                            {content.channelTitle}
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(content.duration)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {formatViewCount(content.viewCount)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {content.userStats.completionRate}%
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="font-medium">Why recommended:</span>
                              <p className="text-muted-foreground mt-1">
                                {content.metadata.recommendationReason}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {content.qualityIndicators.slice(0, 2).map((indicator, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="text-xs text-muted-foreground">
                              Est. {formatDuration(content.metadata.estimatedLearningTime)} total
                            </div>
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              <Play className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              {selectedContent && (
                <div className="space-y-6">
                  {/* Selected Content Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Selected Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold">{selectedContent.title}</h3>
                        <p className="text-sm text-muted-foreground">{selectedContent.channelTitle}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p>{formatDuration(selectedContent.duration)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Quality:</span>
                          <p>{selectedContent.metadata.qualityRating}</p>
                        </div>
                        <div>
                          <span className="font-medium">Difficulty:</span>
                          <p>{selectedContent.metadata.difficultyLevel}</p>
                        </div>
                        <div>
                          <span className="font-medium">Rating:</span>
                          <p>{selectedContent.userStats.averageRating}/5.0</p>
                        </div>
                      </div>

                      <div>
                        <span className="font-medium">Learning Outcomes:</span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {selectedContent.metadata.learningOutcomes.map((outcome, index) => (
                            <li key={index}>{outcome}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-medium">Prerequisites:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedContent.metadata.prerequisites.map((prereq, index) => (
                            <Badge key={index} variant="outline">{prereq}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validation Results */}
                  {validating ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">Validating content compatibility...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : validationResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {validationResult.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          Compatibility Check
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {validationResult.errors.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-600 mb-2">Issues Found:</h4>
                            <ul className="list-disc list-inside text-sm text-red-600">
                              {validationResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validationResult.warnings.length > 0 && (
                          <div>
                            <h4 className="font-medium text-yellow-600 mb-2">Considerations:</h4>
                            <ul className="list-disc list-inside text-sm text-yellow-600">
                              {validationResult.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Difficulty Change:</span>
                            <p className={validationResult.difficultyChange > 0 ? 'text-red-600' : 'text-green-600'}>
                              {validationResult.difficultyChange > 0 ? '+' : ''}{validationResult.difficultyChange.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Time Change:</span>
                            <p>{validationResult.estimatedTimeChange > 0 ? '+' : ''}{validationResult.estimatedTimeChange} min</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmReplacement}
            disabled={!selectedContent || !validationResult?.isValid || validating}
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Replace Content
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}