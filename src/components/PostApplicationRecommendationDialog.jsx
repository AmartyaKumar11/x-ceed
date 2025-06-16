'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin, DollarSign, Clock, Building, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function PostApplicationRecommendationDialog({ 
  isOpen, 
  onClose, 
  appliedJobId, 
  appliedJobTitle,
  onRecommendedJobClick 
}) {
  const [recommendedJob, setRecommendedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobSummary, setJobSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (isOpen && appliedJobId) {
      fetchSimilarJob();
    }
  }, [isOpen, appliedJobId]);

  const fetchSimilarJob = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/jobs/similar?jobId=${appliedJobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch similar job');
      }

      setRecommendedJob(result.data);
      
      // Summarize the job description if it exists and is long
      if (result.data?.description && result.data.description.length > 200) {
        await summarizeJobDescription(result.data.description);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching similar job:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeJobDescription = async (description) => {
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ description })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setJobSummary(result.summary);
      } else {
        // If summarization fails, use truncated description
        setJobSummary(description.substring(0, 150) + '...');
      }
    } catch (err) {
      console.error('Error summarizing job description:', err);
      // Fallback to truncated description
      setJobSummary(description.substring(0, 150) + '...');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleViewDetails = () => {
    if (recommendedJob && onRecommendedJobClick) {
      onRecommendedJobClick(recommendedJob);
    }
    onClose();
  };

  const formatSalary = (min, max, currency = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    } else if (min) {
      return `${formatter.format(min)}+`;
    } else if (max) {
      return `Up to ${formatter.format(max)}`;
    }
    return 'Salary not specified';
  };

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-green-600">
            🎉 Application Submitted Successfully!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Compact Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">
              Your application for <span className="font-bold">{appliedJobTitle}</span> has been submitted successfully.
            </p>
          </div>

          {/* Recommendation Section */}
          <div className="border-t pt-4">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              You might also like this job
            </h3>

            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Finding similar jobs...</span>
              </div>
            )}

            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  We couldn't find similar jobs at the moment. Check back later for more opportunities!
                </p>
              </div>
            )}

            {recommendedJob && !isLoading && (
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  {/* Landscape Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left Column - Job Header */}
                    <div className="md:col-span-1">
                      <h4 className="text-base font-semibold text-foreground mb-1">
                        {recommendedJob.title}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <Building className="h-3 w-3" />
                        {recommendedJob.companyName || 'Company'}
                      </p>
                      
                      {/* Compact Job Details Grid */}
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{recommendedJob.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{recommendedJob.jobType || 'Full-time'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs">{formatSalary(recommendedJob.salaryMin, recommendedJob.salaryMax, recommendedJob.currency)}</span>
                        </div>
                      </div>
                      
                      {/* Compact Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recommendedJob.department && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-2 py-0">
                            {recommendedJob.department}
                          </Badge>
                        )}
                        {recommendedJob.level && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 px-2 py-0">
                            {recommendedJob.level}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Middle Column - Description */}
                    <div className="md:col-span-1">
                      <h5 className="text-sm font-medium mb-2">Job Description</h5>
                      {isSummarizing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs text-muted-foreground">Summarizing...</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {showFullDescription ? (
                            <div>
                              <p className="whitespace-pre-wrap">{recommendedJob.description}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFullDescription(false)}
                                className="h-6 px-2 mt-1 text-xs text-primary hover:text-primary/80"
                              >
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <p>{jobSummary || (recommendedJob.description?.substring(0, 120) + '...') || 'No description available'}</p>
                              {recommendedJob.description && recommendedJob.description.length > 120 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowFullDescription(true)}
                                  className="h-6 px-2 mt-1 text-xs text-primary hover:text-primary/80"
                                >
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  View Full Description
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column - Action */}
                    <div className="md:col-span-1 flex flex-col justify-center">
                      <Button 
                        onClick={handleViewDetails}
                        className="w-full flex items-center gap-2 text-sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Details & Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!recommendedJob && !isLoading && !error && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-600 text-sm">
                  No similar jobs available at the moment. Check back later for more opportunities!
                </p>
              </div>
            )}
          </div>

          {/* Compact Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              size="sm"
            >
              Close
            </Button>
            {recommendedJob && (
              <Button
                onClick={handleViewDetails}
                size="sm"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
