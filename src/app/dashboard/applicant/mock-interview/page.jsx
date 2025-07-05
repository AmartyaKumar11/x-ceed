'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  MessageSquare, 
  Brain,
  Clock,
  Award,
  FileText,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import JobDescriptionUpload from "@/components/JobDescriptionUpload";

export default function MockInterviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Video and audio refs
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  
  // State management
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [questionHistory, setQuestionHistory] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [interviewScore, setInterviewScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  
  // Interview settings
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // Backend service status
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'

  const handleJobDescriptionSet = (description) => {
    setJobDescription(description);
  };

  // Check backend service status
  const checkBackendStatus = async () => {
    try {
      const response = await fetch('/api/mock-interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      
      if (response.status === 503) {
        setBackendStatus('offline');
      } else {
        setBackendStatus('online');
      }
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
      
      setRecognition(recognitionInstance);
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
    
    // Check backend service status
    checkBackendStatus();
    
    // Load job description from localStorage or fetch from API
    const savedJobDescription = localStorage.getItem('mockInterviewJobDescription');
    if (savedJobDescription) {
      setJobDescription(savedJobDescription);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      toast({
        title: "Camera and microphone enabled",
        description: "You're ready to start the interview!",
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access to use the mock interview.",
        variant: "destructive",
      });
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const generateQuestion = async () => {
    if (!jobDescription) {
      toast({
        title: "No job description",
        description: "Please upload a job description first to generate relevant questions.",
        variant: "destructive",
      });
      return;
    }

    setIsQuestionLoading(true);
    
    try {
      const response = await fetch('/api/mock-interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          questionHistory: questionHistory.map(q => q.text),
          currentQuestionIndex,
          totalQuestions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 && errorData.fallback) {
          throw new Error(errorData.message || 'Backend service unavailable');
        }
        throw new Error(errorData.error || 'Failed to generate question');
      }

      const data = await response.json();
      
      // Check if we have a valid question
      if (!data.question || typeof data.question !== 'string') {
        throw new Error('Invalid question received from server');
      }
      
      const newQuestion = data.question;
      
      setCurrentQuestion(newQuestion);
      setQuestionHistory(prev => [...prev, { 
        id: Date.now(), 
        text: newQuestion, 
        timestamp: new Date() 
      }]);
      
      // Speak the question if text-to-speech is enabled
      if (isTextToSpeechEnabled && speechSynthesis) {
        speakQuestion(newQuestion);
      }
      
    } catch (error) {
      console.error('Error generating question:', error);
      
      // Provide specific error messages based on the error type
      let errorTitle = "Error generating question";
      let errorDescription = "Please try again.";
      
      if (error.message.includes('Backend service unavailable') || error.message.includes('port 8008')) {
        errorTitle = "Backend service unavailable";
        errorDescription = "The Python backend service is not running. Please start the service using 'npm run job-desc-service' and try again.";
      } else if (error.message.includes('timeout') || error.message.includes('fetch')) {
        errorTitle = "Connection timeout";
        errorDescription = "The backend service is taking too long to respond. Please check if the service is running.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const speakQuestion = (text) => {
    if (speechSynthesis) {
      speechSynthesis.cancel(); // Stop any current speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const startInterview = async () => {
    if (!jobDescription) {
      toast({
        title: "Job description required",
        description: "Please upload a job description to start the interview.",
        variant: "destructive",
      });
      return;
    }

    await startVideo();
    setIsInterviewActive(true);
    setStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setQuestionHistory([]);
    setAnswerHistory([]);
    setTranscript('');
    setInterviewScore(null);
    setAnalysis(null);
    
    // Start speech recognition
    if (recognition) {
      recognition.start();
    }
    
    // Generate first question
    await generateQuestion();
    
    toast({
      title: "Interview started!",
      description: "Your mock interview is now active. Good luck!",
    });
  };

  const stopInterview = async () => {
    setIsInterviewActive(false);
    stopVideo();
    
    if (recognition) {
      recognition.stop();
    }
    
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    // Save current answer if there's a transcript
    if (transcript.trim() && currentQuestion) {
      const newAnswer = {
        id: Date.now(),
        question: currentQuestion,
        answer: transcript.trim(),
        timestamp: new Date()
      };
      setAnswerHistory(prev => [...prev, newAnswer]);
    }
    
    // Analyze the interview
    await analyzeInterview();
  };

  const nextQuestion = async () => {
    // Save current answer
    if (transcript.trim() && currentQuestion) {
      const newAnswer = {
        id: Date.now(),
        question: currentQuestion,
        answer: transcript.trim(),
        timestamp: new Date()
      };
      setAnswerHistory(prev => [...prev, newAnswer]);
      setTranscript('');
    }
    
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    
    if (nextIndex >= totalQuestions) {
      await stopInterview();
    } else {
      await generateQuestion();
    }
  };

  const analyzeInterview = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/mock-interview/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          questionHistory,
          answerHistory,
          interviewDuration: Date.now() - startTime
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503 && errorData.fallback) {
          throw new Error(errorData.message || 'Backend service unavailable');
        }
        throw new Error(errorData.error || 'Failed to analyze interview');
      }

      const data = await response.json();
      
      // Validate the response data
      if (!data.score && !data.analysis) {
        throw new Error('Invalid analysis data received from server');
      }
      
      setInterviewScore(data.score);
      setAnalysis(data.analysis);
      
      toast({
        title: "Interview analysis complete!",
        description: "Check the analysis panel for detailed feedback.",
      });
      
    } catch (error) {
      console.error('Error analyzing interview:', error);
      
      // Provide specific error messages
      let errorTitle = "Analysis failed";
      let errorDescription = "Could not analyze the interview. Please try again.";
      
      if (error.message.includes('Backend service unavailable') || error.message.includes('port 8008')) {
        errorTitle = "Backend service unavailable";
        errorDescription = "The Python backend service is not running. Analysis requires the backend service. Please start it using 'npm run job-desc-service'.";
      } else if (error.message.includes('timeout') || error.message.includes('fetch')) {
        errorTitle = "Analysis timeout";
        errorDescription = "The analysis is taking too long. Please check if the backend service is running properly.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetInterview = () => {
    setIsInterviewActive(false);
    stopVideo();
    setCurrentQuestion('');
    setQuestionHistory([]);
    setAnswerHistory([]);
    setTranscript('');
    setInterviewScore(null);
    setAnalysis(null);
    setCurrentQuestionIndex(0);
    setInterviewDuration(0);
    
    if (recognition) {
      recognition.stop();
    }
    
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Backend Status Indicator */}
        {backendStatus === 'offline' && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <span className="font-medium">Backend service offline:</span> The Python backend service (port 8008) is not running. 
                  Mock interview features will not work. Please start the service using the command: <code className="bg-red-100 px-1 rounded">npm run job-desc-service</code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkBackendStatus}
                  className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
                >
                  Recheck
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {backendStatus === 'online' && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <span className="font-medium">Backend service online:</span> All systems ready for mock interview.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {backendStatus === 'checking' && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  Checking backend service status...
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description Upload */}
            <JobDescriptionUpload onJobDescriptionSet={handleJobDescriptionSet} />
            {/* Video Window */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Interview Camera
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Camera will activate when interview starts</p>
                      </div>
                    </div>
                  )}
                  {isInterviewActive && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge variant={isVideoEnabled ? "default" : "secondary"}>
                        {isVideoEnabled ? "Video ON" : "Video OFF"}
                      </Badge>
                      <Badge variant={isAudioEnabled ? "default" : "secondary"}>
                        {isAudioEnabled ? "Audio ON" : "Audio OFF"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Current Question
                  {isSpeaking && <Volume2 className="h-4 w-4 animate-pulse text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentQuestion ? (
                  <div className="space-y-4">
                    <p className="text-lg text-foreground">{currentQuestion}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </Badge>
                      {isTextToSpeechEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speakQuestion(currentQuestion)}
                          disabled={isSpeaking}
                        >
                          {isSpeaking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                          Replay
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {isQuestionLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating question...
                      </div>
                    ) : (
                      "No question active"
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Transcript */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Live Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[120px] p-4 bg-muted rounded-lg">
                  {transcript ? (
                    <p className="text-foreground">{transcript}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      {isInterviewActive ? "Start speaking to see your transcript..." : "Transcript will appear here during the interview"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interview Controls */}
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  {!isInterviewActive ? (
                    <Button
                      onClick={startInterview}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <Play className="h-4 w-4" />
                      Start Interview
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={toggleVideo}
                        variant={isVideoEnabled ? "default" : "secondary"}
                        className="flex items-center gap-2"
                      >
                        {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        {isVideoEnabled ? "Video" : "Video Off"}
                      </Button>
                      
                      <Button
                        onClick={toggleAudio}
                        variant={isAudioEnabled ? "default" : "secondary"}
                        className="flex items-center gap-2"
                      >
                        {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        {isAudioEnabled ? "Audio" : "Audio Off"}
                      </Button>
                      
                      <Button
                        onClick={nextQuestion}
                        disabled={!currentQuestion || currentQuestionIndex >= totalQuestions - 1}
                        className="flex items-center gap-2"
                      >
                        Next Question
                      </Button>
                      
                      <Button
                        onClick={stopInterview}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Square className="h-4 w-4" />
                        End Interview
                      </Button>
                    </>
                  )}
                  
                  <Button
                    onClick={resetInterview}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Progress */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Questions Completed</span>
                      <span>{currentQuestionIndex} / {totalQuestions}</span>
                    </div>
                    <Progress value={(currentQuestionIndex / totalQuestions) * 100} />
                  </div>
                  
                  {isInterviewActive && startTime && (
                    <div className="text-sm text-muted-foreground">
                      Duration: {Math.floor((Date.now() - startTime) / 1000)}s
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interview Score */}
            {interviewScore && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Interview Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {interviewScore.overall}%
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Communication</span>
                        <span>{interviewScore.communication}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Technical Knowledge</span>
                        <span>{interviewScore.technical}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence</span>
                        <span>{interviewScore.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis */}
            {analysis && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detailed Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Strengths</h4>
                        <ul className="text-sm space-y-1">
                          {analysis.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold mb-2">Areas for Improvement</h4>
                        <ul className="text-sm space-y-1">
                          {analysis.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <p className="text-sm">{analysis.recommendations}</p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Text-to-Speech</span>
                    <Button
                      variant={isTextToSpeechEnabled ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setIsTextToSpeechEnabled(!isTextToSpeechEnabled)}
                    >
                      {isTextToSpeechEnabled ? "ON" : "OFF"}
                    </Button>
                  </div>
                  
                  <div>
                    <label className="text-sm">Number of Questions</label>
                    <select
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      disabled={isInterviewActive}
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 