'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Target,
  Send,
  Bot,
  User,
  Brain,
  Sparkles,
  MessageSquare,
  Award,
  Briefcase,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Loader2,
  ArrowLeft
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function ResumeMatchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatEndRef = useRef(null);
  
  // URL parameters
  const jobId = searchParams.get('jobId');
  const resumeId = searchParams.get('resumeId');
  const resumeFilename = searchParams.get('resumeFilename');
  const resumeName = searchParams.get('resumeName');
  
  // State management
  const [job, setJob] = useState(null);
  const [userResume, setUserResume] = useState(null);
  const [ragAnalysis, setRagAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Resume Match Page Debug:', {
      jobId,
      resumeId,
      resumeFilename,
      resumeName,
      job,
      userResume,
      ragAnalysis,
      loading,
      analyzing
    });
  }, [jobId, resumeId, resumeFilename, resumeName, job, userResume, ragAnalysis, loading, analyzing]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [jobId]);

  useEffect(() => {
    if (chatEndRef.current && chatMessages.length > 0) {
      // Only scroll if there are messages and user hasn't scrolled up
      setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [chatMessages]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch job data
      let jobData = null;
      if (jobId) {
        console.log('📋 Fetching job data for:', jobId);
        const jobResponse = await fetch(`/api/jobs/${jobId}`);
        if (jobResponse.ok) {
          jobData = await jobResponse.json();
          setJob(jobData);
          console.log('✅ Job data loaded:', jobData.title);
        }
      }

      // Handle resume data
      let resumeData = null;
      if (resumeFilename) {
        resumeData = {
          filename: resumeFilename,
          name: resumeName || resumeFilename,
          resumePath: `/uploads/temp-resumes/${resumeFilename}`
        };
        setUserResume(resumeData);
        console.log('📄 Using uploaded resume:', resumeData);
      }

      // Start RAG analysis
      if (jobData && resumeData) {
        console.log('🤖 Starting RAG analysis...');
        await performRagAnalysis(jobData, resumeData);
      } else {
        console.warn('⚠️ Cannot start analysis - Missing data:', {
          hasJob: !!jobData,
          hasResume: !!resumeData,
          jobTitle: jobData?.title,
          resumeFilename: resumeData?.filename
        });
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };  const performRagAnalysis = async (jobData, resumeData) => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token status:', token ? 'Found' : 'Missing');
      
      console.log('🤖 Starting analysis with data:', { jobTitle: jobData.title, resumePath: resumeData.resumePath });
      
      // Try Python-powered RAG service first
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
        const requestBody = {
        action: 'analyze',  // Add the required action parameter
        jobId: jobData._id,
        jobTitle: jobData.title,
        jobDescription: jobData.description,
        requirements: jobData.requirements || [],
        resumePath: resumeData.resumePath
      };
      
      console.log('📤 Sending request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/resume-rag-python', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('📊 API Response status:', response.status);
      console.log('📊 API Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Full response from API:', result);
          // Handle both structured and text-based analysis
        const analysisData = result.data?.analysis || result.data || result;
        console.log('📈 Extracted analysis data:', analysisData);
        
        if (analysisData?.structuredAnalysis) {
          // Use structured analysis from Python service (preferred)
          console.log('✅ Using Python structured analysis');
          setRagAnalysis({
            structuredAnalysis: analysisData.structuredAnalysis,
            pythonPowered: true,
            timestamp: analysisData.timestamp || new Date().toISOString()
          });
        } else if (analysisData?.comprehensiveAnalysis) {
          // Fallback to text-based comprehensive analysis from Python service
          console.log('✅ Using Python comprehensive analysis (fallback)');
          setRagAnalysis({
            comprehensiveAnalysis: analysisData.comprehensiveAnalysis,
            pythonPowered: true,
            timestamp: analysisData.timestamp || new Date().toISOString()
          });
        } else {
          // Fallback to any other structured analysis
          console.log('⚠️ Using fallback analysis format');
          setRagAnalysis(analysisData);
        }
        
        setChatInitialized(true);
        
        // Add welcome message
        setChatMessages([{
          role: 'assistant',
          content: `Hello! I've analyzed your resume against the "${jobData.title}" position. I can answer questions about your match, skills, experience, and provide interview tips. What would you like to know?`,
          timestamp: new Date().toISOString()
        }]);
          console.log('✅ RAG analysis completed successfully');
      } else {
        console.error('❌ RAG analysis failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Error details:', errorData);
        
        // Set a fallback message for the user
        setRagAnalysis({
          overallMatch: {
            score: 0,            level: "Analysis Failed",
            summary: `API Error: ${response.status} - ${errorData.message || response.statusText}`
          },
          error: true,
          errorDetails: errorData
        });
      }
    } catch (error) {
      console.error('❌ RAG analysis error:', error);
      
      // Set error state with fallback content
      setRagAnalysis({
        error: true,
        errorMessage: error.message || 'Analysis failed',
        comprehensiveAnalysis: `❌ Analysis Error: ${error.message || 'Unable to analyze resume'}\n\nPlease try again or check your connection.`,
        pythonPowered: false,
        timestamp: new Date().toISOString()
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatInitialized) return;

    const userMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
        const response = await fetch('/api/resume-rag-python', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          action: 'chat',
          question: userMessage.content,
          sessionId: 'default',
          conversationHistory: chatMessages,
          analysisContext: ragAnalysis ? {
            jobTitle: job?.title,
            jobDescription: job?.description,
            analysisResult: ragAnalysis.comprehensiveAnalysis || ragAnalysis.overallMatch?.summary,
            timestamp: new Date().toISOString()
          } : null
        })
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: result.data?.response || result.response || 'I apologize, but I encountered an issue processing your question.',
          timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };
  // Loading state
  if (loading) {
    return (
      <div className="bg-background flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div>
            <h3 className="font-semibold">Loading Analysis</h3>
            <p className="text-muted-foreground text-sm">Preparing your resume analysis...</p>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Resume Analysis</h1>
                <p className="text-muted-foreground mt-1">
                  {job?.title && `Analyzing your fit for: ${job.title}`}
                </p>
              </div>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI analyzing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-6">
          {/* Analysis Results - Takes 2 columns on xl screens */}<div className="xl:col-span-2">
            {ragAnalysis ? (
              <div className="space-y-6">
                {/* Check if we have structured analysis */}
                {ragAnalysis.structuredAnalysis ? (
                  /* Structured Analysis Cards */
                  <>
                    {/* Overall Match Score */}
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            Overall Match
                          </CardTitle>
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                            🐍 AI Powered
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-3xl font-bold text-green-600">
                            {ragAnalysis.structuredAnalysis.overallMatch?.score || 0}%
                          </div>
                          <div>
                            <Badge variant={
                              ragAnalysis.structuredAnalysis.overallMatch?.level === 'Excellent' ? 'default' :
                              ragAnalysis.structuredAnalysis.overallMatch?.level === 'Good' ? 'secondary' :
                              ragAnalysis.structuredAnalysis.overallMatch?.level === 'Fair' ? 'outline' : 'destructive'
                            }>
                              {ragAnalysis.structuredAnalysis.overallMatch?.level || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={ragAnalysis.structuredAnalysis.overallMatch?.score || 0} className="mb-4" />
                        <p className="text-muted-foreground">
                          {ragAnalysis.structuredAnalysis.overallMatch?.summary || 'No summary available'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Key Strengths */}
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          Key Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {ragAnalysis.structuredAnalysis.keyStrengths?.map((strength, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{strength}</span>
                            </div>
                          )) || <p className="text-muted-foreground">No strengths identified</p>}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skills Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Matching Skills */}
                      <Card className="border-0 shadow-sm bg-card">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            Matching Skills
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {ragAnalysis.structuredAnalysis.matchingSkills?.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 mr-2 mb-2">
                                {skill}
                              </Badge>
                            )) || <p className="text-muted-foreground text-sm">No matching skills found</p>}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Missing Skills */}
                      <Card className="border-0 shadow-sm bg-card">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            Missing Skills
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {ragAnalysis.structuredAnalysis.missingSkills?.length > 0 ? 
                              ragAnalysis.structuredAnalysis.missingSkills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300 mr-2 mb-2">
                                  {skill}
                                </Badge>
                              )) : 
                              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-300">All required skills are present!</span>
                              </div>
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Experience Analysis */}
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          Experience Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Relevant Experience</h4>
                            <p className="text-sm text-muted-foreground">
                              {ragAnalysis.structuredAnalysis.experienceAnalysis?.relevantExperience || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">Experience Gaps</h4>
                            <p className="text-sm text-muted-foreground">
                              {ragAnalysis.structuredAnalysis.experienceAnalysis?.experienceGaps || 'None identified'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Improvement Suggestions */}
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          Improvement Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {ragAnalysis.structuredAnalysis.improvementSuggestions?.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                              <div className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-sm">{suggestion}</span>
                            </div>
                          )) || <p className="text-muted-foreground">No suggestions available</p>}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Competitive Advantages & Interview Prep Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Competitive Advantages */}
                      <Card className="border-0 shadow-sm bg-card">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Competitive Advantages
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {ragAnalysis.structuredAnalysis.competitiveAdvantages?.map((advantage, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{advantage}</span>
                              </div>
                            )) || <p className="text-muted-foreground text-sm">No advantages identified</p>}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Interview Preparation */}
                      <Card className="border-0 shadow-sm bg-card">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                              <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            Interview Prep
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-teal-700 dark:text-teal-300 mb-2 text-sm">Strengths to Highlight</h4>
                              <div className="space-y-1">
                                {ragAnalysis.structuredAnalysis.interviewPreparation?.strengthsToHighlight?.map((strength, index) => (
                                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                                    <span className="text-teal-500 mt-1">•</span>
                                    <span>{strength}</span>
                                  </div>
                                )) || <p className="text-muted-foreground text-sm">None specified</p>}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2 text-sm">Areas to Address</h4>
                              <div className="space-y-1">
                                {ragAnalysis.structuredAnalysis.interviewPreparation?.areasToAddress?.map((area, index) => (
                                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>{area}</span>
                                  </div>
                                )) || <p className="text-muted-foreground text-sm">None specified</p>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : ragAnalysis.comprehensiveAnalysis ? (
                  /* Fallback to Original Text Analysis */
                  <Card className="border-0 shadow-sm bg-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          Comprehensive Analysis
                        </CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                          🐍 AI Powered
                        </Badge>
                      </div>
                    </CardHeader>                    <CardContent className="pt-0">
                      <div className="bg-muted/30 rounded-lg p-6">
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: ragAnalysis.comprehensiveAnalysis
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em class="text-muted-foreground">$1</em>')
                              .replace(/^- (.*?)$/gm, '<div class="flex items-start gap-2 my-2"><span class="text-blue-500 mt-1 text-lg">•</span><span>$1</span></div>')
                              .replace(/^(\d+)\. (.*?)$/gm, '<div class="flex items-start gap-2 my-2"><span class="text-green-600 font-semibold min-w-[1.5rem]">$1.</span><span>$2</span></div>')
                              .replace(/\n\n/g, '<div class="my-4"></div>')
                              .replace(/\n/g, '<br>')
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>) : (
                  // Fallback - try to find analysis in different formats
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      {ragAnalysis.analysis ? (
                        // If there's an 'analysis' property
                        <div>
                          <h3 className="font-semibold mb-4">Analysis Results</h3>
                          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
                            {JSON.stringify(ragAnalysis.analysis, null, 2)}
                          </pre>
                        </div>
                      ) : ragAnalysis.overallMatch ? (
                        // If there's structured data
                        <div>
                          <h3 className="font-semibold mb-4">Match Analysis</h3>
                          <p>Overall Match: {ragAnalysis.overallMatch.score}%</p>
                          <p>Level: {ragAnalysis.overallMatch.level}</p>
                          <p>Summary: {ragAnalysis.overallMatch.summary}</p>
                        </div>
                      ) : ragAnalysis.error ? (
                        // If there's an error
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <h3 className="font-semibold mb-2 text-red-700">Analysis Error</h3>
                          <p className="text-muted-foreground text-sm">{ragAnalysis.errorMessage || 'Unknown error occurred'}</p>
                        </div>
                      ) : (
                        // Unknown format
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold mb-2">Unknown Analysis Format</h3>
                          <p className="text-muted-foreground text-sm mb-4">Received data in unexpected format</p>
                          <details className="text-left">
                            <summary className="cursor-pointer text-sm font-medium">View Raw Data</summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                              {JSON.stringify(ragAnalysis, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Empty state
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12">
                  <div className="text-center">
                    <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                    <p className="text-muted-foreground mb-6">
                      {analyzing ? 'AI is analyzing your resume...' : 
                       loading ? 'Loading job and resume data...' :
                       !job ? 'Job data not available' :
                       !userResume ? 'Resume data not available' :
                       'Click below to start your AI-powered resume analysis'}
                    </p>
                    
                    {!analyzing && !loading && job && userResume && (
                      <Button 
                        onClick={() => performRagAnalysis(job, userResume)}
                        className="px-8"
                        disabled={analyzing}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Start AI Analysis
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>          {/* AI Chat Assistant - Takes 1 column */}
          <div className="xl:col-span-1">
            <Card className="border-0 shadow-sm flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  AI Career Assistant
                </CardTitle>
                <CardDescription className="text-sm">
                  Ask questions about your resume, the job, or get interview tips
                </CardDescription>
              </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                {/* Chat Messages */}
                <div className="flex-1 p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full flex-shrink-0">
                            <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                          <div
                          className={`rounded-lg px-4 py-2 max-w-[85%] ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-12'
                              : 'bg-muted text-foreground mr-12'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <div 
                              className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{
                                __html: message.content
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                  .replace(/^- (.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-blue-500 mt-1">•</span><span>$1</span></div>')
                                  .replace(/^(\d+)\. (.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-green-600 font-semibold min-w-[1.5rem]">$1.</span><span>$2</span></div>')
                                  .replace(/\n\n/g, '<div class="my-2"></div>')
                                  .replace(/\n/g, '<br>')
                              }}
                            />
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {chatLoading && (
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>                    )}
                    
                    <div ref={chatEndRef} />
                  </div>
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t bg-muted/20 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder={chatInitialized ? "Ask me anything about your resume analysis..." : "Please wait for analysis to complete..."}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={!chatInitialized || chatLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendChatMessage}
                      disabled={!chatInitialized || !chatInput.trim() || chatLoading}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {!chatInitialized && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Chat will be available after analysis is complete
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
