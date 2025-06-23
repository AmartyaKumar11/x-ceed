'use client';

import { useState } from 'react';
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Award, 
  BookOpen,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AIShortlistButton = ({ job, onShortlistComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shortlistResults, setShortlistResults] = useState(null);
  const [error, setError] = useState(null);

  const handleAIShortlist = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/ai/shortlist-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: job._id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze candidates');
      }

      const data = await response.json();
      setShortlistResults(data);
      setShowResults(true);
      
      if (onShortlistComplete) {
        onShortlistComplete(data);
      }

    } catch (error) {
      console.error('AI Shortlisting Error:', error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation.includes('HIGHLY_RECOMMENDED')) return 'text-green-600 bg-green-50';
    if (recommendation.includes('RECOMMENDED')) return 'text-blue-600 bg-blue-50';
    if (recommendation.includes('CONSIDER')) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>      <Button
        onClick={handleAIShortlist}
        disabled={isAnalyzing}
        variant="outline"
        className="flex items-center gap-1"
      >        {isAnalyzing ? (
          <>
            <Clock className="h-3 w-3 animate-spin" />
            AI Analyzing...
          </>
        ) : (
          <>
            <Brain className="h-3 w-3" />
            AI Shortlist
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Candidate Shortlist - {job?.title}
            </DialogTitle>
            <DialogDescription>
              AI has analyzed {shortlistResults?.metadata?.totalCandidates || 0} candidates based on multiple criteria
            </DialogDescription>
          </DialogHeader>

          {shortlistResults && (
            <div className="space-y-6">
              {/* Analysis Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Analysis Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {shortlistResults.metadata.totalCandidates}
                      </div>
                      <div className="text-sm text-gray-600">Total Candidates</div>
                    </div>                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {shortlistResults.shortlist.filter(c => c.overall_score >= 70).length}
                      </div>
                      <div className="text-sm text-gray-600">Strong Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {shortlistResults.shortlist.length > 0 ? 
                          Math.round(shortlistResults.shortlist.reduce((sum, c) => sum + c.overall_score, 0) / shortlistResults.shortlist.length) 
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        <Zap className="h-6 w-6 inline" />
                      </div>
                      <div className="text-sm text-gray-600">AI Powered</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Analysis Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {shortlistResults.criteria.map((criterion, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{criterion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ranked Candidates */}
              <div className="space-y-4">                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Ranked Candidates
                </h3>

                {shortlistResults.shortlist.map((candidate, index) => (
                  <Card key={candidate.candidate_id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            #{index + 1} {candidate.candidate_name}
                          </CardTitle>
                          <CardDescription>
                            Overall Match Score: {' '}
                            <span className={`font-bold ${getScoreColor(candidate.overall_score)}`}>
                              {candidate.overall_score.toFixed(1)}%
                            </span>
                          </CardDescription>
                        </div>
                        <Badge 
                          className={getRecommendationColor(candidate.recommendation)}
                          variant="secondary"
                        >
                          {candidate.recommendation.includes('HIGHLY') ? 'Highly Recommended' :
                           candidate.recommendation.includes('RECOMMENDED') ? 'Recommended' :
                           candidate.recommendation.includes('CONSIDER') ? 'Consider' : 'Review Needed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Skills Match</div>
                          <div className="flex items-center gap-2">
                            <Progress value={candidate.skill_match_score} className="flex-1" />
                            <span className="text-sm font-bold">{candidate.skill_match_score.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Experience</div>
                          <div className="flex items-center gap-2">
                            <Progress value={candidate.experience_score} className="flex-1" />
                            <span className="text-sm font-bold">{candidate.experience_score.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Education</div>
                          <div className="flex items-center gap-2">
                            <Progress value={candidate.education_score} className="flex-1" />
                            <span className="text-sm font-bold">{candidate.education_score.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Overall</div>
                          <div className="flex items-center gap-2">
                            <Progress value={candidate.overall_score} className="flex-1" />
                            <span className="text-sm font-bold">{candidate.overall_score.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Strengths and Weaknesses */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {candidate.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Growth Areas
                          </h4>
                          <ul className="space-y-1">
                            {candidate.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <XCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-2">AI Recommendation</h4>
                        <p className="text-sm text-gray-700">{candidate.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {shortlistResults.shortlist.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Candidates Found</h3>
                    <p className="text-gray-500">No applications have been submitted for this job yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIShortlistButton;
