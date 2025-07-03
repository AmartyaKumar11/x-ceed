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
  ArrowLeft,
  Square,
  GraduationCap
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
  const jobDesc = searchParams.get('jobDesc');
  const requirementsParam = searchParams.get('requirements');
  const companyNameParam = searchParams.get('companyName');
  const jobTypeParam = searchParams.get('jobType');
  
  // State management
  const [job, setJob] = useState(null);
  const [userResume, setUserResume] = useState(null);
  const [ragAnalysis, setRagAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [prepPlanCreated, setPrepPlanCreated] = useState(false);
    // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');  const [chatLoading, setChatLoading] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);  const [typingMessageIndex, setTypingMessageIndex] = useState(-1);
  const [abortController, setAbortController] = useState(null);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const partialContentRef = useRef('');// Typewriter effect component
  const TypewriterText = ({ text, speed = 30, onComplete, onPartialUpdate }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
      if (!isTyping) return;

      let index = 0;
      const timer = setInterval(() => {
        if (index < text.length) {
          const newText = text.slice(0, index + 1);
          setDisplayedText(newText);
          // Report partial update for stopping functionality
          if (onPartialUpdate) {
            onPartialUpdate(newText);
          }
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
          // Hide cursor after a short delay
          setTimeout(() => setShowCursor(false), 500);
          if (onComplete) onComplete();
        }
      }, speed);

      return () => clearInterval(timer);
    }, [text, speed, isTyping, onComplete, onPartialUpdate]);// Blinking cursor effect
    useEffect(() => {
      if (!isTyping && !showCursor) return;
      
      const cursorTimer = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 600); // Slightly slower blink for more natural feel

      return () => clearInterval(cursorTimer);
    }, [isTyping]);

    return (
      <div className="relative">
        <div 
          className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{
            __html: displayedText
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
              .replace(/^- (.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-blue-500 mt-1">•</span><span>$1</span></div>')
              .replace(/^(\d+)\. (.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-green-600 font-semibold min-w-[1.5rem]">$1.</span><span>$2</span></div>')
              .replace(/\n\n/g, '<div class="my-2"></div>')
              .replace(/\n/g, '<br>')
          }}
        />        {(isTyping || showCursor) && (
          <span className="inline-block w-0.5 h-4 bg-gray-700 dark:bg-gray-300 ml-0.5" />
        )}
      </div>
    );
  };

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
  }, [jobId, resumeId, resumeFilename, resumeName, job, userResume, ragAnalysis, loading, analyzing]);  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [jobId]);

  // Check for existing prep plan when job data is loaded
  useEffect(() => {
    if (job) {
      checkPrepPlanExists();
    }
  }, [job]);// Ensure page is scrollable on mount
  useEffect(() => {
    // Fix scrolling issues that might be caused by CSS constraints
    const fixScrolling = () => {
      // Only fix document scrolling, don't touch specific elements
      document.body.style.height = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
      
      // Fix main content container but be very specific to avoid sidebar
      const mainContent = document.querySelector('main');
      if (mainContent && !mainContent.closest('.sidebar')) {
        mainContent.style.height = 'auto';
        mainContent.style.maxHeight = 'none';
        mainContent.style.overflow = 'visible';
      }
    };

    // Apply immediately and after a short delay
    fixScrolling();
    const timer = setTimeout(fixScrolling, 100);

    return () => clearTimeout(timer);
  }, []);

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
      if (jobDesc) {
        // External job: use jobDesc and requirements from query params
        jobData = {
          _id: jobId || 'external',
          title: searchParams.get('jobTitle') || 'External Job',
          description: decodeURIComponent(jobDesc),
          requirements: requirementsParam ? JSON.parse(requirementsParam) : [],
          companyName: companyNameParam || '',
          jobType: jobTypeParam || '',
        };
        setJob(jobData);
        console.log('🌐 Using external job data:', jobData);
      } else if (jobId) {
        // Internal job: fetch from API
        console.log('📋 Fetching job data for:', jobId);
        const jobResponse = await fetch(`/api/jobs/${jobId}`);
        if (jobResponse.ok) {
          const jobResponseData = await jobResponse.json();
          // API returns { job: jobObject }, so extract the job
          jobData = jobResponseData.job || jobResponseData;
          setJob(jobData);
          console.log('✅ Job data loaded:', jobData.title);
          console.log('📋 Job details:', {
            title: jobData.title,
            description: jobData.description ? `${jobData.description.substring(0, 100)}...` : 'No description',
            requirements: jobData.requirements ? `${jobData.requirements.length} requirements` : 'No requirements'
          });
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
      console.log('📊 API Response ok:', response.ok);      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Full response from API:', result);
        console.log('📄 Resume text in response:', result.data?.resumeText ? `${result.data.resumeText.length} characters` : 'Missing');
        
        // Handle both structured and text-based analysis
        const analysisData = result.data?.analysis || result.data || result;
        console.log('📈 Extracted analysis data:', analysisData);
          if (analysisData?.structuredAnalysis) {
          // Use structured analysis from Python service (preferred)
          console.log('✅ Using Python structured analysis');
          setRagAnalysis({
            structuredAnalysis: analysisData.structuredAnalysis,
            resumeText: result.data?.resumeText, // Store the extracted resume text
            pythonPowered: true,
            timestamp: analysisData.timestamp || new Date().toISOString()
          });} else if (analysisData?.comprehensiveAnalysis) {
          // Fallback to text-based comprehensive analysis from Python service
          console.log('✅ Using Python comprehensive analysis (fallback)');
          
          // Parse the JSON string if it's a string
          let parsedAnalysis = analysisData.comprehensiveAnalysis;
          if (typeof parsedAnalysis === 'string') {
            try {
              parsedAnalysis = JSON.parse(parsedAnalysis);
              console.log('✅ Successfully parsed JSON analysis:', parsedAnalysis);
            } catch (parseError) {
              console.warn('⚠️ Could not parse analysis JSON, using as string:', parseError);
            }
          }
            setRagAnalysis({
            structuredAnalysis: typeof parsedAnalysis === 'object' ? parsedAnalysis : null,
            comprehensiveAnalysis: analysisData.comprehensiveAnalysis,
            resumeText: result.data?.resumeText, // Store the extracted resume text 
            pythonPowered: true,
            timestamp: analysisData.timestamp || new Date().toISOString()
          });
        } else {          // Fallback to any other structured analysis
          console.log('⚠️ Using fallback analysis format');
          // Ensure we include resumeText even in fallback case
          const fallbackAnalysis = {
            ...analysisData,
            resumeText: result.data?.resumeText // Store the extracted resume text
          };
          setRagAnalysis(fallbackAnalysis);
        }
        
        setChatInitialized(true);
          // Add welcome message
        const welcomeMessage = {
          role: 'assistant',
          content: `Hello! I've analyzed your resume against the "${jobData.title}" position. I can answer questions about your match, skills, experience, and provide interview tips. What would you like to know?`,
          timestamp: new Date().toISOString(),
          isTyping: true
        };
        
        setChatMessages([welcomeMessage]);
        setTypingMessageIndex(0);
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
  };  const sendChatMessage = async () => {
    console.log('🔍 sendChatMessage called:', {
      chatInput: chatInput.trim(),
      chatInitialized,
      chatLoading,
      isTypingResponse,
      typingMessageIndex
    });
    
    if (!chatInput.trim() || !chatInitialized || chatLoading || isTypingResponse) {
      console.log('❌ Message blocked by validation');
      return;
    }

    console.log('✅ Message validation passed, sending...');

    // Cancel any ongoing request
    if (abortController) {
      console.log('🛑 Cancelling previous request');
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    const userMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }      const requestBody = {
        action: 'chat',
        question: userMessage.content,
        sessionId: 'default',
        conversationHistory: chatMessages,
        analysisContext: ragAnalysis ? {
          jobTitle: job?.title,
          jobDescription: job?.description,
          jobRequirements: job?.requirements || [],
          resumePath: userResume?.resumePath,
          resumeText: ragAnalysis.resumeText || ragAnalysis.resumeContent, // Include resume content
          analysisResult: ragAnalysis.comprehensiveAnalysis || ragAnalysis.overallMatch?.summary,
          structuredAnalysis: ragAnalysis.structuredAnalysis, // Include detailed analysis
          timestamp: new Date().toISOString()
        } : {
          jobTitle: job?.title,
          jobDescription: job?.description,
          jobRequirements: job?.requirements || [],
          resumePath: userResume?.resumePath
        }
      };
      
      console.log('💬 Sending chat request:', {
        question: userMessage.content,
        hasAnalysisContext: !!ragAnalysis,
        resumeTextLength: ragAnalysis?.resumeText?.length || 0,
        contextKeys: ragAnalysis ? Object.keys(requestBody.analysisContext) : []
      });

      const response = await fetch('/api/resume-rag-python', {
        method: 'POST',
        headers: headers,
        signal: newAbortController.signal,
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: result.data?.response || result.response || 'I apologize, but I encountered an issue processing your question.',
          timestamp: new Date().toISOString(),
          isTyping: true
        };    // Add the message and start typewriter effect
        setChatMessages(prev => {
          const newMessages = [...prev, assistantMessage];
          setTypingMessageIndex(newMessages.length - 1);
          setIsTypingResponse(true);
          partialContentRef.current = ''; // Reset partial content
          console.log('🎬 Starting typewriter effect:', {
            messageIndex: newMessages.length - 1,
            isTypingResponse: true
          });
          return newMessages;
        });

        // Check if the user's message was asking for prep plan creation
        checkForPrepPlanRequest(userMessage.content);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      console.error('❌ Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
      setAbortController(null);
    }
  };  const checkForPrepPlanRequest = (userMessage) => {
    const prepPlanKeywords = [
      'prep plan', 'preparation plan', 'learning plan', 'study plan',
      'how to prepare', 'how can i prepare', 'what should i learn', 'skills to develop',
      'create prep plan', 'make a plan', 'learning path', 'study guide',
      'skills should i develop', 'what skills', 'prepare for this', 'get ready for'
    ];

    const lowerMessage = userMessage.toLowerCase();
    const containsPrepPlanKeyword = prepPlanKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (containsPrepPlanKeyword) {
      console.log('🎯 Detected prep plan request in user message');
      
      // Add a simple response directing to the button
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `To create a personalized learning plan for this job, simply click the "Create Learning Plan for This Job" button above. It will analyze the job requirements and generate a customized study plan for you! 📚`,
          timestamp: new Date().toISOString(),
          isTyping: true
        }]);
      }, 1000);
    }
  };const stopResponse = () => {
    // Stop current request
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // Save partial content and stop typing animation
    if (typingMessageIndex !== -1) {
      setChatMessages(prev => 
        prev.map((msg, i) => 
          i === typingMessageIndex ? { 
            ...msg, 
            isTyping: false,
            content: partialContentRef.current || msg.content
          } : msg
        )
      );
      setTypingMessageIndex(-1);
      partialContentRef.current = '';
    }
    
    // Reset states
    setIsTypingResponse(false);
    setChatLoading(false);
  };  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('⌨️ Enter key pressed:', {
        chatLoading,
        isTypingResponse,
        canSend: !chatLoading && !isTypingResponse
      });
      if (!chatLoading && !isTypingResponse) {
        sendChatMessage();
      } else {
        console.log('🚫 Enter key blocked - chat is busy');
      }
    }
  };  const createPrepPlan = async () => {
    console.log('🎯 createPrepPlan function called');
    console.log('📊 Current state:', {
      job: job ? { id: job._id, title: job.title } : null,
      ragAnalysis: !!ragAnalysis,
      prepPlanCreated,
      token: !!localStorage.getItem('token')
    });

    if (!job) {
      console.error('❌ No job data available for prep plan creation');
      alert('Error: No job data available. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('🎯 Creating prep plan for job:', job.title);
      
      // Show loading state (you could add a loading state here if needed)
      console.log('⏳ Calling createPrepPlanRecord...');
      
      // Create prep plan record
      const prepPlanData = await createPrepPlanRecord(job);
      console.log('📋 createPrepPlanRecord result:', prepPlanData);
        
      if (prepPlanData) {
        console.log('✅ Prep plan created successfully! You can view it in the Prep Plans section.');
        setPrepPlanCreated(true);
          // Add a success message to the chat
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `🎉 **Learning plan created successfully!** 

I've added "${job.title}" ${job.companyName || job.company ? `at ${job.companyName || job.company}` : ''} to your prep plans. You can now:

• **View it anytime** in the "Prep Plans" section from the sidebar
• **Track your progress** as you learn new skills
• **Access personalized learning materials** based on this job's requirements

The prep plan is ready and waiting for you! 🚀`,
          timestamp: new Date().toISOString(),
          isTyping: true,
          isPrepPlanSuccess: true
        }]);
        
        // Auto-scroll to the new message
        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        
      } else {
        console.log('⚠️ No prep plan data returned, but no error occurred');
        alert('The prep plan creation completed, but there may have been an issue. Please check the Prep Plans section.');
      }
      
    } catch (error) {
      console.error('❌ Error creating prep plan:', error);
      alert(`Error creating prep plan: ${error.message}. Please try again.`);
    }
  };
  const createPrepPlanRecord = async (jobData) => {
    console.log('📝 createPrepPlanRecord called with:', {
      jobId: jobData._id,
      jobTitle: jobData.title,
      companyName: jobData.companyName
    });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No authentication token available');
        throw new Error('Authentication required. Please log in and try again.');
      }

      console.log('🔐 Token found, making API request...');
        const requestBody = {
        jobId: jobData._id,
        jobTitle: jobData.title,
        companyName: jobData.companyName || jobData.company || 'Company Not Specified',
        jobDescription: jobData.description || jobData.jobDescriptionText,
        requirements: jobData.requirements,
        location: jobData.location,
        salaryRange: jobData.salaryRange || `${jobData.salaryMin || 0}-${jobData.salaryMax || 0} ${jobData.currency || 'USD'}`,
        jobType: jobData.jobType,
        department: jobData.department,
        level: jobData.level,
        workMode: jobData.workMode,
        source: 'resume-match'
      };
      
      console.log('📡 API request body:', requestBody);

      const response = await fetch('/api/prep-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Prep plan created successfully:', result.data);
        return result.data;
      } else if (response.status === 409) {
        // Prep plan already exists, that's fine
        console.log('ℹ️ Prep plan already exists for this job');
        setPrepPlanCreated(true);
        return { existing: true };
      } else if (response.status === 401) {
        console.error('❌ Authentication failed');
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 403) {
        console.error('❌ Access forbidden');
        throw new Error('Access denied. Make sure you have the right permissions.');
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Error details:', errorData);
        throw new Error(`Failed to create prep plan: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error in createPrepPlanRecord:', error);
      throw error; // Re-throw to be handled by the calling function
    }
  };
  const viewPrepPlan = () => {
    if (!job) return;
    
    const jobParam = encodeURIComponent(JSON.stringify(job));
    router.push(`/dashboard/applicant/prep-plan?job=${jobParam}`);
  };

  const checkPrepPlanExists = async () => {
    if (!job) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/prep-plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const prepPlans = result.data || [];
        
        // Check if a prep plan exists for this job
        const existingPlan = prepPlans.find(plan => 
          plan.jobId === job._id || 
          (plan.jobTitle === job.title && plan.companyName === job.companyName)
        );
        
        if (existingPlan) {
          setPrepPlanCreated(true);
        }
      }
    } catch (error) {
      console.error('Error checking prep plan existence:', error);
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
    <div className="bg-background" style={{ minHeight: '100vh', overflow: 'auto' }}>
      <div className="container mx-auto px-4 py-6 max-w-7xl" style={{ minHeight: 'auto', height: 'auto' }}>
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
                <h1 className="text-3xl font-bold tracking-tight mb-2">AI Resume Analysis</h1>
                {job && (
                  <div className="text-muted-foreground text-base mb-6">
                    {job.companyName && <span className="font-semibold">{job.companyName}</span>}
                    {job.jobType && <span className="ml-2">({job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1).replace('_', ' ')})</span>}
                  </div>
                )}
              </div>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI analyzing...</span>
              </div>
            )}
          </div>        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20" style={{ minHeight: 'auto', height: 'auto' }}>
          {/* Analysis Results - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2" style={{ height: 'auto', overflow: 'visible' }}>{ragAnalysis ? (
              <div className="space-y-6">
                {/* Check if we have structured analysis */}
                {ragAnalysis.structuredAnalysis ? (
                  /* Structured Analysis Cards */
                  <>
                    {/* Overall Match Score */}
                    <Card className="border border-border rounded-lg shadow-md bg-card">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>                            Overall Match
                          </CardTitle>
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                            Analysis
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
                    <Card className="border border-border rounded-lg shadow-md bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          Key Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">                        <div className="space-y-3">
                          {ragAnalysis.structuredAnalysis.keyStrengths?.map((strength, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 border-border">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-foreground">{strength}</span>
                            </div>
                          )) || <p className="text-muted-foreground">No strengths identified</p>}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skills Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Matching Skills */}
                      <Card className="border border-border rounded-lg shadow-md bg-card">
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
                      <Card className="border border-border rounded-lg shadow-md bg-card">
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
                                </Badge>                              )) :                              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20 border-border">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-foreground">All required skills are present!</span>
                              </div>
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Experience Analysis */}
                    <Card className="border border-border rounded-lg shadow-md bg-card">
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
                    <Card className="border border-border rounded-lg shadow-md bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          Improvement Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">                        <div className="space-y-3">                          {ragAnalysis.structuredAnalysis.improvementSuggestions?.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 border-border">
                              <div className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-sm text-foreground">{suggestion}</span>
                            </div>
                          )) || <p className="text-muted-foreground">No suggestions available</p>}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Competitive Advantages & Interview Prep Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Competitive Advantages */}
                      <Card className="border border-border rounded-lg shadow-md bg-card">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Competitive Advantages
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">                          <div className="space-y-2">                            {ragAnalysis.structuredAnalysis.competitiveAdvantages?.map((advantage, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 rounded border bg-muted/20 border-border">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-foreground">{advantage}</span>
                              </div>
                            )) || <p className="text-muted-foreground text-sm">No advantages identified</p>}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Interview Preparation */}
                      <Card className="border border-border rounded-lg shadow-md bg-card">
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
                  <Card className="border border-border rounded-lg shadow-md bg-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          Comprehensive Analysis
                        </CardTitle>                        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                          Analysis
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
                  <Card className="border border-border rounded-lg shadow-md">
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
              <Card className="border border-border rounded-lg shadow-md">
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
            <Card className="border border-border rounded-lg shadow-md flex flex-col">
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
              {job && (
                <div className="px-4 pb-2 space-y-2">
                  {!prepPlanCreated ? (<Button
                      onClick={async () => {
                        console.log('🎯 Create Learning Plan button clicked');
                        console.log('Button state:', { job: !!job, ragAnalysis: !!ragAnalysis, prepPlanCreated });
                        try {
                          await createPrepPlan();
                        } catch (error) {
                          console.error('❌ Error in button click handler:', error);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-border hover:bg-accent hover:text-accent-foreground"
                      disabled={!job}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Create Learning Plan for This Job
                    </Button>
                  ) : (
                    <div className="space-y-2">                      <Button
                        onClick={() => {
                          console.log('🎯 View Prep Plan button clicked');
                          viewPrepPlan();
                        }}
                        size="sm"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        View Prep Plan
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
                        )}                        <div
                          className={`rounded-lg px-4 py-2 max-w-[85%] ${                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-12'
                              : message.isPrepPlanSuccess
                              ? 'bg-accent text-accent-foreground border border-border mr-12'
                              : 'bg-muted text-foreground mr-12'
                          }`}
                        >{message.role === 'assistant' ? (
                            index === typingMessageIndex && message.isTyping ? (                              <TypewriterText 
                                text={message.content}
                                speed={20}
                                onPartialUpdate={(partialText) => {
                                  partialContentRef.current = partialText;
                                }}
                                onComplete={() => {
                                  setTypingMessageIndex(-1);
                                  setIsTypingResponse(false);
                                  partialContentRef.current = '';
                                  setChatMessages(prev => 
                                    prev.map((msg, i) => 
                                      i === index ? { ...msg, isTyping: false } : msg
                                    )
                                  );
                                }}
                              />
                            ) : (
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
                            )
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
                  <div className="flex gap-2">                    <Input
                      placeholder={chatInitialized ? "Ask me anything about your resume analysis..." : "Please wait for analysis to complete..."}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={!chatInitialized || chatLoading || isTypingResponse}
                      className="flex-1"
                    />
                    
                    {/* Show pause button when response is being typed or loading */}
                    {(chatLoading || isTypingResponse) ? (
                      <Button
                        onClick={stopResponse}
                        variant="outline"
                        size="sm"
                        className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={sendChatMessage}
                        disabled={!chatInitialized || !chatInput.trim()}
                        size="sm"
                        className="px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {!chatInitialized && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Chat will be available after analysis is complete
                    </p>
                  )}
                  {/* Status indicator */}
                  {(chatLoading || isTypingResponse) && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {chatLoading ? 'Processing your question...' : 'AI is responding...'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
