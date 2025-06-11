'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  FileText, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ResumeMatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');
  const resumeId = searchParams.get('resumeId');
  const resumeFilename = searchParams.get('resumeFilename');
  const resumeName = searchParams.get('resumeName');
  
  const [job, setJob] = useState(null);
  const [userResume, setUserResume] = useState(null);
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfHighlights, setPdfHighlights] = useState([]);
    useEffect(() => {
    console.log('🔍 Resume Match Page - URL Parameters:');
    console.log('- jobId:', jobId);
    console.log('- resumeId:', resumeId);
    console.log('- resumeFilename:', resumeFilename);
    console.log('- resumeName:', resumeName);
    
    if (jobId) {
      fetchJobAndAnalyze();
    }
  }, [jobId]);const fetchJobAndAnalyze = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting data fetch for jobId:', jobId);
      console.log('📄 Resume ID:', resumeId, 'Filename:', resumeFilename, 'Name:', resumeName);
      
      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      console.log('📋 Job response status:', jobResponse.status);
      
      let jobData = null;
      if (jobResponse.ok) {
        const jobResult = await jobResponse.json();
        console.log('📋 Job data:', jobResult);
        jobData = jobResult.data;
        setJob(jobData);
      } else {
        console.error('❌ Failed to fetch job:', jobResponse.status);
      }      // Handle uploaded resume vs user profile resume
      let resumeData = null;
      if (resumeId && resumeFilename) {
        // Use uploaded resume - create resume data object
        resumeData = {
          id: resumeId,
          filename: resumeFilename,
          originalName: resumeName || resumeFilename,
          uploadedAt: new Date().toISOString(),
          isUploaded: true,
          viewUrl: `/api/resume/view/${resumeFilename}`,
          downloadUrl: `/uploads/temp-resumes/${resumeFilename}`
        };
        setUserResume(resumeData);
        console.log('📄 Using uploaded resume:', resumeData);
        console.log('🔗 PDF will be loaded from:', resumeData.viewUrl);
      } else {
        // Fallback to user's profile resume
        const token = localStorage.getItem('token');
        console.log('🔑 Token available:', !!token);
        
        if (token) {
          const resumeResponse = await fetch('/api/profile/resume', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('📄 Resume response status:', resumeResponse.status);
          
          if (resumeResponse.ok) {
            const resumeResult = await resumeResponse.json();
            console.log('📄 Resume data:', resumeResult);
            resumeData = resumeResult.data;
            setUserResume(resumeData);
          } else {
            console.error('❌ Failed to fetch resume:', resumeResponse.status);
          }
        }
      }

      // Start analysis if both data are available
      if (jobData && resumeData) {
        console.log('🎯 Starting analysis...');
        await performMatchAnalysis(jobData, resumeData);
      } else {
        console.warn('⚠️ Missing data - Job:', !!jobData, 'Resume:', !!resumeData);
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performMatchAnalysis = async (jobData, resumeData) => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume-match/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: jobData._id,
          jobDescription: jobData.description,
          jobTitle: jobData.title,
          jobRequirements: jobData.requirements || [],
          resumePath: resumeData.resumePath,
          userSkills: resumeData.skills || []
        })
      });

      if (response.ok) {
        const analysisData = await response.json();
        setMatchAnalysis(analysisData.data);
        setPdfHighlights(analysisData.data.highlights || []);
      }
    } catch (error) {
      console.error('Error performing analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading resume match analysis...</p>
        </div>
      </div>
    );
  }

  if (!job || !userResume) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Unable to load data</h3>
          <p className="text-muted-foreground mt-2">Job or resume data not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Resume Match Analysis</h1>
                <p className="text-muted-foreground">{job.title} at {job.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => performMatchAnalysis(job, userResume)}
                disabled={analyzing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            </div>
          </div>
        </div>
      </div>      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left Side - PDF Viewer (3 columns) */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Resume
                  {userResume.filename && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({userResume.filename})
                    </span>
                  )}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"                  onClick={() => {
                    if (userResume.isUploaded && userResume.downloadUrl) {
                      // Download uploaded file
                      const link = document.createElement('a');
                      link.href = userResume.downloadUrl;
                      link.download = userResume.originalName || userResume.filename;
                      link.click();
                    } else if (userResume.resumePath) {
                      // Download profile resume
                      window.open(`/api/download/resume?path=${encodeURIComponent(userResume.resumePath)}`, '_blank');
                    }
                  }}
                  disabled={!userResume.resumePath && !userResume.downloadUrl}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </CardHeader>              <CardContent className="flex-1 p-0">
                <div className="h-full min-h-[700px] bg-gray-50 dark:bg-gray-900 rounded-b-lg">                  {(userResume.resumePath || userResume.viewUrl) ? (
                    <div className="w-full h-full min-h-[700px] overflow-hidden rounded-b-lg relative">
                      {/* Direct iframe with proper PDF headers */}
                      <iframe
                        src={userResume.isUploaded 
                          ? userResume.viewUrl
                          : `/api/view-pdf?path=${encodeURIComponent(userResume.resumePath)}&highlights=${encodeURIComponent(JSON.stringify(pdfHighlights))}`
                        }
                        className="w-full h-full border-0 rounded-b-lg"
                        title="Resume PDF"
                        style={{ 
                          minHeight: '700px',
                          height: '100%',
                          border: 'none',
                          borderRadius: '0 0 0.5rem 0.5rem'
                        }}
                        onLoad={(e) => {
                          console.log('✅ PDF iframe loaded successfully for:', userResume.filename);
                        }}
                        onError={(e) => {
                          console.error('❌ PDF iframe failed to load for:', userResume.filename);
                        }}
                      />
                      
                      {/* Debug info overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
                        <p>📄 {userResume.isUploaded ? 'Uploaded' : 'Profile'} Resume</p>
                        <p>🔗 URL: {userResume.isUploaded ? userResume.viewUrl : userResume.resumePath}</p>
                        <p>📁 File: {userResume.filename}</p>
                      </div>
                      
                      {/* Fallback buttons for when PDF doesn't load in iframe */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = userResume.isUploaded ? userResume.viewUrl : userResume.resumePath;
                            window.open(url, '_blank');
                          }}
                          className="bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm"
                        >
                          📄 Open PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Force reload iframe
                            const iframe = document.querySelector('iframe[title="Resume PDF"]');
                            if (iframe) {
                              const currentSrc = iframe.src;
                              iframe.src = '';
                              setTimeout(() => iframe.src = currentSrc, 100);
                            }
                          }}
                          className="bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm"
                        >
                          🔄 Reload
                        </Button>
                      </div>
                    </div>) : (
                    <div className="flex items-center justify-center h-full min-h-[700px]">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No resume uploaded</h3>
                        <p className="text-muted-foreground mb-4">
                          Upload a resume to see the match analysis
                        </p>
                        {/* Debug info if we have resume data but can't display */}
                        {userResume && (
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-4">
                            <p>Debug: Resume data exists but no viewUrl or resumePath</p>
                            <p>IsUploaded: {userResume.isUploaded ? 'Yes' : 'No'}</p>
                            <p>ViewUrl: {userResume.viewUrl || 'None'}</p>
                            <p>ResumePath: {userResume.resumePath || 'None'}</p>
                          </div>
                        )}
                        <Button 
                          onClick={() => router.push('/dashboard/applicant/jobs')} 
                          className="mt-4"
                          variant="outline"
                        >
                          Browse Jobs
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Analysis (2 columns) */}
          <div className="lg:col-span-2 flex flex-col">
            <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Overall Match Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyzing ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Analyzing resume match...</span>
                      </div>
                    ) : matchAnalysis ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          {getScoreIcon(matchAnalysis.overallScore)}
                          <span className={`text-3xl font-bold ${getScoreColor(matchAnalysis.overallScore)}`}>
                            {matchAnalysis.overallScore}%
                          </span>
                        </div>
                        <Progress value={matchAnalysis.overallScore} className="w-full" />
                        <p className="text-sm text-muted-foreground">
                          {matchAnalysis.overallSummary}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Analysis not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detailed Analysis Tabs */}
                {matchAnalysis && (
                  <Tabs defaultValue="skills" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="skills">Skills</TabsTrigger>
                      <TabsTrigger value="experience">Experience</TabsTrigger>
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                      <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="skills" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Skills Analysis</CardTitle>
                          <CardDescription>
                            Match Score: {matchAnalysis.skillsScore}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Matched Skills */}
                          <div>
                            <h4 className="font-medium text-green-600 mb-2">✓ Matched Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {matchAnalysis.matchedSkills?.map((skill, index) => (
                                <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Missing Skills */}
                          <div>
                            <h4 className="font-medium text-red-600 mb-2">✗ Missing Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {matchAnalysis.missingSkills?.map((skill, index) => (
                                <Badge key={index} variant="outline" className="border-red-200 text-red-600">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="experience" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Experience Analysis</CardTitle>
                          <CardDescription>
                            Match Score: {matchAnalysis.experienceScore}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {matchAnalysis.experienceAnalysis?.map((item, index) => (
                              <div key={index} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  {item.matched ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="font-medium">{item.requirement}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.analysis}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="keywords" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Keyword Analysis</CardTitle>
                          <CardDescription>
                            Match Score: {matchAnalysis.keywordScore}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">High-Impact Keywords Found</h4>
                              <div className="flex flex-wrap gap-2">
                                {matchAnalysis.foundKeywords?.map((keyword, index) => (
                                  <Badge key={index} variant="default">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Missing Important Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {matchAnalysis.missingKeywords?.map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="border-orange-200 text-orange-600">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="suggestions" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Improvement Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {matchAnalysis.suggestions?.map((suggestion, index) => (
                              <div key={index} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="font-medium">{suggestion.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {suggestion.description}
                                </p>
                                {suggestion.priority && (
                                  <Badge 
                                    variant="outline" 
                                    className={`mt-2 ${
                                      suggestion.priority === 'high' 
                                        ? 'border-red-200 text-red-600' 
                                        : suggestion.priority === 'medium'
                                        ? 'border-yellow-200 text-yellow-600'
                                        : 'border-green-200 text-green-600'
                                    }`}
                                  >
                                    {suggestion.priority} priority
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
