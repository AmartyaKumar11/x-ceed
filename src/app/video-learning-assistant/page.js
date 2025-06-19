'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Bookmark, 
  Scissors, 
  Camera,
  Download,
  StickyNote,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  MessageSquare,
  FileText,
  Folder,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function VideoLearningAssistantContent() {
  const searchParams = useSearchParams();
  
  // Get video and skill data from URL params
  const [videoData, setVideoData] = useState(null);
  const [skillName, setSkillName] = useState('');
  
  // Video player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  
  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  
  // Learning materials state
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [clips, setClips] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
    // Refs
  const playerRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  // Initialize from URL params
  useEffect(() => {
    const videoParam = searchParams.get('video');
    const skillParam = searchParams.get('skill');
    
    if (videoParam) {
      try {
        const parsedVideo = JSON.parse(decodeURIComponent(videoParam));
        setVideoData(parsedVideo);
      } catch (error) {
        console.error('Error parsing video data:', error);
      }
    }
    
    if (skillParam) {
      setSkillName(decodeURIComponent(skillParam));
    }
  }, [searchParams]);

  // Initialize YouTube player
  useEffect(() => {
    if (!videoData) return;

    const initYouTubePlayer = () => {
      if (typeof window !== 'undefined' && window.YT) {
        initializePlayer();
      } else {
        // Load YouTube API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
          initializePlayer();
        };
      }
    };

    initYouTubePlayer();

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [videoData]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      setSpeechRecognition(recognition);
    }
  }, []);
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // Send welcome message when ready
  useEffect(() => {
    if (playerReady && videoData && skillName && messages.length === 0) {
      addAiMessage(`🎯 Welcome to your AI Learning Session!

I'm here to help you master **${skillName}** while watching "${videoData.title}".

Here's what I can do:
• 📝 Take smart notes as you watch
• 🔖 Bookmark important moments
• ✂️ Save video clips for review
• 📸 Capture screenshots of key concepts
• 💬 Answer questions about the content
• 🧠 Create quizzes to test your knowledge

Just ask me anything or use voice commands like "Save this clip" or "Explain this concept"!`);
    }
  }, [playerReady, videoData, skillName, messages.length]);

  const initializePlayer = () => {
    if (!videoData?.id && !videoData?.url) return;
    
    const videoId = videoData.id || extractVideoId(videoData.url);
    
    playerRef.current = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        fs: 1,
        cc_load_policy: 1,
        iv_load_policy: 3,
        autohide: 0
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event) => {
    setPlayerReady(true);
    setDuration(event.target.getDuration());
    
    // Start time tracking
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000);
  };

  const onPlayerStateChange = (event) => {
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Chat functions
  const addAiMessage = (message, actions = null) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      message,
      timestamp: currentTime,
      actions,
      time: new Date().toLocaleTimeString()
    }]);
  };

  const addUserMessage = (message) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message,
      timestamp: currentTime,
      time: new Date().toLocaleTimeString()
    }]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addUserMessage(userMessage);
    setInputMessage('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/ai/video-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          videoContext: {
            videoId: videoData?.id || extractVideoId(videoData?.url),
            currentTime,
            duration,
            skill: skillName,
            videoTitle: videoData?.title,
            videoChannel: videoData?.channel,
            sessionId
          },
          chatHistory: messages.slice(-5),
          learningMaterials: {
            bookmarks: bookmarks.length,
            notes: notes.length,
            clips: clips.length
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        addAiMessage(data.response, data.actions);
        
        // Execute AI-suggested actions
        if (data.actions) {
          handleAiActions(data.actions);
        }
      } else {
        addAiMessage("I'm having trouble connecting right now. Please try again in a moment.");
      }
    } catch (error) {
      console.error('Chat error:', error);
      addAiMessage("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleAiActions = (actions) => {
    actions.forEach(action => {
      switch (action.type) {
        case 'bookmark':
          addBookmark(action.title, action.description);
          break;
        case 'save_clip':
          saveClip(action.startTime, action.endTime, action.title);
          break;
        case 'take_note':
          addNote(action.content);
          break;
        case 'screenshot':
          takeScreenshot(action.title);
          break;
        case 'jump_to':
          jumpToTime(action.timestamp);
          break;
      }
    });
  };

  // Learning material functions
  const addBookmark = (title, description = '') => {
    const bookmark = {
      id: Date.now(),
      timestamp: currentTime,
      title: title || `Important moment at ${formatTime(currentTime)}`,
      description,
      skill: skillName,
      videoTitle: videoData?.title,
      created: new Date().toISOString()
    };
    
    setBookmarks(prev => [...prev, bookmark]);
  };

  const addNote = (content) => {
    const note = {
      id: Date.now(),
      content,
      timestamp: currentTime,
      skill: skillName,
      videoTitle: videoData?.title,
      created: new Date().toISOString()
    };
    
    setNotes(prev => [...prev, note]);
  };

  const saveClip = (startTime = null, endTime = null, title = '') => {
    const clipStart = startTime || Math.max(0, currentTime - 30);
    const clipEnd = endTime || Math.min(duration, currentTime + 30);
    
    const clip = {
      id: Date.now(),
      startTime: clipStart,
      endTime: clipEnd,
      title: title || `Clip: ${formatTime(clipStart)} - ${formatTime(clipEnd)}`,
      videoId: videoData?.id || extractVideoId(videoData?.url),
      videoTitle: videoData?.title,
      skill: skillName,
      created: new Date().toISOString()
    };
    
    setClips(prev => [...prev, clip]);
  };

  const takeScreenshot = (title = '') => {
    const screenshot = {
      id: Date.now(),
      timestamp: currentTime,
      title: title || `Screenshot at ${formatTime(currentTime)}`,
      videoTitle: videoData?.title,
      skill: skillName,
      created: new Date().toISOString()
    };
    
    setScreenshots(prev => [...prev, screenshot]);
  };

  // Utility functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToTime = (timestamp) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(timestamp);
    }
  };

  const toggleVoiceInput = () => {
    if (speechRecognition) {
      if (isListening) {
        speechRecognition.stop();
        setIsListening(false);
      } else {
        speechRecognition.start();
        setIsListening(true);
      }
    }
  };

  const exportLearningMaterials = async () => {
    const materials = {
      session: {
        skill: skillName,
        video: videoData,
        duration: formatTime(currentTime),
        date: new Date().toISOString()
      },
      bookmarks,
      notes,
      clips,
      screenshots,
      chatHistory: messages
    };

    try {
      const response = await fetch('/api/learning/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materials)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skillName}_learning_session.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your AI learning session...</p>
        </div>
      </div>
    );
  }  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.close()} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Close
            </Button>
            <div>
              <h1 className="text-xl font-bold text-card-foreground">{videoData.title}</h1>
              <p className="text-sm text-muted-foreground">
                Learning: <span className="font-medium text-primary">{skillName}</span> • {videoData.channel} • {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportLearningMaterials} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Session
            </Button>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Bot className="h-3 w-3 mr-1" />
              AI Learning Assistant
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Player Section */}
        <div className="flex-1 p-6 bg-background">
          <div className="bg-black rounded-lg overflow-hidden h-full relative shadow-lg">
            <div id="youtube-player" className="w-full h-full"></div>
            
            {/* Quick Action Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addBookmark()}
                  className="bg-black/75 text-white hover:bg-black/90 backdrop-blur-sm"
                  variant="secondary"
                >
                  <Bookmark className="h-4 w-4 mr-1" />
                  Bookmark
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveClip()}
                  className="bg-black/75 text-white hover:bg-black/90 backdrop-blur-sm"
                  variant="secondary"
                >
                  <Scissors className="h-4 w-4 mr-1" />
                  Save Clip
                </Button>
                <Button
                  size="sm"
                  onClick={() => takeScreenshot()}
                  className="bg-black/75 text-white hover:bg-black/90 backdrop-blur-sm"
                  variant="secondary"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Screenshot
                </Button>
              </div>
              
              <Badge className="bg-black/75 text-white backdrop-blur-sm" variant="secondary">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            </div>
          </div>
        </div>        {/* AI Assistant Sidebar */}
        <div className="w-96 bg-card border-l flex flex-col shadow-lg h-full overflow-hidden">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-2 bg-muted">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="materials" className="text-xs">
                <FileText className="h-4 w-4 mr-1" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="session" className="text-xs">
                <Folder className="h-4 w-4 mr-1" />
                Session
              </TabsTrigger>
            </TabsList>            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 h-full overflow-hidden">
              <div className="p-4 border-b bg-primary/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm text-card-foreground">AI Learning Assistant</h3>
                    <p className="text-xs text-muted-foreground">Ask me anything about this video</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 bg-background scrollbar-thin"
                >
                  <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {message.type === 'ai' && <Bot className="h-3 w-3 text-primary" />}
                          {message.type === 'user' && <User className="h-3 w-3" />}
                          <span>{message.time}</span>
                          <span>•</span>
                          <span>{formatTime(message.timestamp)}</span>
                        </div>
                        
                        <div className={`p-3 rounded-lg text-sm ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted border'
                        }`}>
                          <div className="whitespace-pre-wrap">{message.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isAiTyping && (
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <div className="bg-muted border p-3 rounded-lg">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}                  
                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-card flex-shrink-0">
                <div className="flex gap-2 mb-3">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about this video..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleVoiceInput}
                    className={isListening ? 'bg-destructive/10 border-destructive/20 text-destructive' : ''}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" onClick={sendMessage} disabled={!inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInputMessage("Explain this concept")}
                    className="text-xs py-1 h-8"
                  >
                    Explain This
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInputMessage("Create a summary")}
                    className="text-xs py-1 h-8"
                  >
                    Summarize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInputMessage("Save important clips")}
                    className="text-xs py-1 h-8"
                  >
                    Save Key Parts
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInputMessage("Quiz me on this")}
                    className="text-xs py-1 h-8"
                  >
                    Quiz Me
                  </Button>
                </div>
              </div>
            </TabsContent>            {/* Materials Tab */}
            <TabsContent value="materials" className="flex-1 p-4 bg-background">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* Bookmarks */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-card-foreground">
                      <Bookmark className="h-4 w-4 text-primary" />
                      Bookmarks ({bookmarks.length})
                    </h4>
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="p-3 border rounded-lg bg-card text-sm">
                          <div className="font-medium text-card-foreground">{bookmark.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(bookmark.timestamp)}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => jumpToTime(bookmark.timestamp)}
                              className="h-6 px-2 text-xs hover:bg-primary/10"
                            >
                              Jump to
                            </Button>
                          </div>
                          {bookmark.description && (
                            <div className="text-xs mt-1 text-muted-foreground">{bookmark.description}</div>
                          )}
                        </div>
                      ))}
                      {bookmarks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No bookmarks yet</p>
                          <p className="text-xs">Click the bookmark button to save important moments</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-card-foreground">
                      <StickyNote className="h-4 w-4 text-primary" />
                      Notes ({notes.length})
                    </h4>
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="p-3 border rounded-lg bg-card text-sm">
                          <div className="text-card-foreground">{note.content}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3" />
                            {formatTime(note.timestamp)}
                          </div>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notes yet</p>
                          <p className="text-xs">Ask the AI to help you take notes</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clips */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-card-foreground">
                      <Scissors className="h-4 w-4 text-primary" />
                      Saved Clips ({clips.length})
                    </h4>
                    <div className="space-y-2">
                      {clips.map((clip) => (
                        <div key={clip.id} className="p-3 border rounded-lg bg-card text-sm">
                          <div className="font-medium text-card-foreground">{clip.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => jumpToTime(clip.startTime)}
                              className="h-6 px-2 text-xs hover:bg-primary/10"
                            >
                              Play
                            </Button>
                          </div>
                        </div>
                      ))}
                      {clips.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No clips saved yet</p>
                          <p className="text-xs">Save important video segments for review</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Session Tab */}
            <TabsContent value="session" className="flex-1 p-4 bg-background">
              <div className="space-y-4">
                <div className="text-center p-6 bg-primary/5 rounded-lg border">
                  <Bot className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-card-foreground mb-4">Learning Session Stats</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="font-semibold text-lg text-primary">{bookmarks.length}</div>
                      <div className="text-muted-foreground">Bookmarks</div>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="font-semibold text-lg text-green-600">{notes.length}</div>
                      <div className="text-muted-foreground">Notes</div>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="font-semibold text-lg text-purple-600">{clips.length}</div>
                      <div className="text-muted-foreground">Clips</div>
                    </div>
                    <div className="p-3 bg-card rounded-lg border">
                      <div className="font-semibold text-lg text-orange-600">{messages.length}</div>
                      <div className="text-muted-foreground">Messages</div>
                    </div>
                  </div>
                </div>

                <Button onClick={exportLearningMaterials} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Learning Session
                </Button>

                <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-1">
                    <p><span className="font-medium">Skill:</span> {skillName}</p>
                    <p><span className="font-medium">Video:</span> {videoData.title}</p>
                    <p><span className="font-medium">Channel:</span> {videoData.channel}</p>
                    <p><span className="font-medium">Progress:</span> {formatTime(currentTime)} / {formatTime(duration)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function VideoLearningAssistant() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your AI learning session...</p>
        </div>
      </div>
    }>
      <VideoLearningAssistantContent />
    </Suspense>
  );
}
