'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Award, 
  Target,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Mail,
  Calendar,
  FileText,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIShortlistPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [shortlistResults, setShortlistResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (params.id) {
      fetchJobAndAnalyze();
    }
  }, [params.id]);

  const fetchJobAndAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${params.id}`);
      if (!jobResponse.ok) {
        throw new Error('Job not found');
      }
      const jobData = await jobResponse.json();
      setJob(jobData.job || jobData);

      // Start AI analysis
      await performAIAnalysis(params.id);

    } catch (error) {
      console.error('Error fetching job:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const performAIAnalysis = async (jobId) => {
    try {
      setAnalyzing(true);
      
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/shortlist-candidates', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ jobId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to analyze candidates');
      }

      const data = await response.json();
      setShortlistResults(data);

    } catch (error) {
      console.error('AI Analysis Error:', error);
      setError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateApplicationStatus = async (candidateId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [candidateId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/applications/${candidateId}/status`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setShortlistResults(prev => ({
        ...prev,
        data: {
          ...prev.data,
          shortlist: prev.data.shortlist.map(candidate => 
            candidate.candidate_id === candidateId 
              ? { ...candidate, application_status: newStatus }
              : candidate
          )
        }
      }));

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation?.includes('HIGHLY_RECOMMENDED')) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
    if (recommendation?.includes('RECOMMENDED')) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
    if (recommendation?.includes('CONSIDER')) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'interviewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredCandidates = shortlistResults?.data?.shortlist?.filter(candidate => {
    if (filter === 'all') return true;
    if (filter === 'high') return candidate.overall_score >= 70;
    if (filter === 'medium') return candidate.overall_score >= 50 && candidate.overall_score < 70;
    if (filter === 'low') return candidate.overall_score < 50;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={fetchJobAndAnalyze}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.back()} 
                variant="outline" 
                size="sm"
                className="border-border"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Brain className="h-8 w-8 text-blue-500" />
                  AI Candidate Analysis
                </h1>
                <p className="text-muted-foreground">
                  {job?.title} - Intelligent candidate ranking and insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchJobAndAnalyze} variant="outline" disabled={analyzing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
            </div>
          </div>
        </div>

        {analyzing && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800">
            <CardContent className="py-8">
              <div className="text-center">
                <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Analysis in Progress</h3>
                <p className="text-muted-foreground mb-4">
                  Analyzing candidate resumes and matching against job requirements...
                </p>
                <div className="w-full max-w-xs mx-auto">
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {shortlistResults?.data && (
          <>
            {/* Analysis Overview */}
            <Card className="mb-6 border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Analysis Overview</CardTitle>
                <CardDescription>
                  {shortlistResults.data.summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {shortlistResults.data.totalCandidates}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Candidates</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {shortlistResults.data.shortlist?.filter(c => c.overall_score >= 70).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Strong Matches</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {shortlistResults.data.shortlist?.filter(c => c.overall_score >= 50 && c.overall_score < 70).length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Potential Matches</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Analysis Date</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Ranked Candidates ({filteredCandidates.length})
                </h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter: {filter === 'all' ? 'All' : filter === 'high' ? 'High Score' : filter === 'medium' ? 'Medium Score' : 'Low Score'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilter('all')}>All Candidates</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('high')}>High Score (70%+)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('medium')}>Medium Score (50-69%)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('low')}>Low Score (&lt;50%)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>

            {/* Candidates List */}
            {filteredCandidates.length > 0 ? (
              <div className="space-y-6">
                {filteredCandidates.map((candidate, index) => (
                  <Card key={candidate.candidate_id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-3 text-foreground">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                              #{shortlistResults.data.shortlist.findIndex(c => c.candidate_id === candidate.candidate_id) + 1}
                            </div>
                            {candidate.applicant_name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {candidate.applicant_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(candidate.application_date).toLocaleDateString()}
                            </span>
                            {candidate.resume_filename && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                Resume Available
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-4">
                            <div className={`text-3xl font-bold ${getScoreColor(candidate.overall_score)}`}>
                              {candidate.overall_score}%
                            </div>
                            <div className="text-sm text-muted-foreground">Overall Match</div>
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={getRecommendationColor(candidate.recommendation)}
                          >
                            {candidate.recommendation?.split('_')[0] || 'REVIEW'}
                          </Badge>

                          {/* Status Update Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={updatingStatus[candidate.candidate_id]}
                                className={getStatusColor(candidate.application_status || 'pending')}
                              >
                                {updatingStatus[candidate.candidate_id] ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    {candidate.application_status || 'pending'}
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                  </>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem 
                                onClick={() => updateApplicationStatus(candidate.candidate_id, 'under_review')}
                              >
                                Under Review
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateApplicationStatus(candidate.candidate_id, 'shortlisted')}
                              >
                                Shortlisted
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateApplicationStatus(candidate.candidate_id, 'interviewed')}
                              >
                                Interviewed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateApplicationStatus(candidate.candidate_id, 'rejected')}
                                className="text-red-600 dark:text-red-400"
                              >
                                Rejected
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Score Breakdown */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.skills_score || 0}%</div>
                          <div className="text-sm text-muted-foreground">Skills Match</div>
                          <Progress value={candidate.skills_score || 0} className="mt-2 h-2" />
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{candidate.experience_score || 0}%</div>
                          <div className="text-sm text-muted-foreground">Experience</div>
                          <Progress value={candidate.experience_score || 0} className="mt-2 h-2" />
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{candidate.projects_score || 0}%</div>
                          <div className="text-sm text-muted-foreground">Projects</div>
                          <Progress value={candidate.projects_score || 0} className="mt-2 h-2" />
                        </div>
                      </div>

                      {/* Strengths and Weaknesses */}
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Key Strengths
                          </h4>
                          <ul className="space-y-2">
                            {candidate.strengths?.length > 0 ? candidate.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{strength}</span>
                              </li>
                            )) : (
                              <li className="text-sm text-muted-foreground">No strengths listed</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Areas for Growth
                          </h4>
                          <ul className="space-y-2">
                            {candidate.weaknesses?.length > 0 ? candidate.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{weakness}</span>
                              </li>
                            )) : (
                              <li className="text-sm text-muted-foreground">No growth areas listed</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                          <Brain className="h-4 w-4 text-blue-500" />
                          AI Recommendation
                        </h4>
                        <p className="text-sm text-foreground">{candidate.detailed_analysis || candidate.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Candidates Found</h3>
                  <p className="text-muted-foreground">
                    {filter === 'all' 
                      ? 'No applications have been submitted for this job yet.' 
                      : `No candidates match the selected filter criteria.`
                    }
                  </p>
                  {filter !== 'all' && (
                    <Button 
                      onClick={() => setFilter('all')} 
                      variant="outline" 
                      className="mt-4"
                    >
                      View All Candidates
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
