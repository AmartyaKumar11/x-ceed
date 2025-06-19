'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  MessageSquare, 
  Bookmark, 
  Scissors, 
  Camera, 
  Save,
  Bot,
  User,
  Clock,
  Download,
  StickyNote,
  Loader2,
  Send,
  Mic,
  MicOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function VideoLearningAssistant({ video, skill, onClose }) {
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  
  // Learning state
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [clips, setClips] = useState([]);
  const [transcript, setTranscript] = useState([]);
  
  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
    // Refs
  const playerRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  // Initialize YouTube player
  useEffect(() => {
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

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

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

  // Initialize YouTube player
  const initializePlayer = () => {
    const videoId = extractVideoId(video.url);
    
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
    setVideoReady(true);
    setDuration(event.target.getDuration());
    
    // Start tracking time
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000);

    // Send initial AI message
    addAiMessage(`Hi! I'm your AI learning assistant for "${skill}". I'll help you take notes, save important clips, and answer questions about this video. What would you like to learn?`);
  };

  const onPlayerStateChange = (event) => {
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
  };

  const extractVideoId = (url) => {
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
            videoId: extractVideoId(video.url),
            currentTime,
            duration,
            skill,
            videoTitle: video.title,
            videoChannel: video.channel
          },
          chatHistory: messages.slice(-5) // Last 5 messages for context
        })
      });

      if (response.ok) {
        const data = await response.json();
        addAiMessage(data.response, data.actions);
        
        // Execute suggested actions
        if (data.actions) {
          handleAiActions(data.actions);
        }
      } else {
        addAiMessage("Sorry, I'm having trouble connecting right now. Please try again.");
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
          takeScreenshot();
          break;
      }
    });
  };

  // Learning functions
  const addBookmark = (title, description = '') => {
    const bookmark = {
      id: Date.now(),
      timestamp: currentTime,
      title: title || `Bookmark at ${formatTime(currentTime)}`,
      description,
      time: new Date().toLocaleTimeString()
    };
    
    setBookmarks(prev => [...prev, bookmark]);
    addAiMessage(`✅ Bookmarked: "${bookmark.title}" at ${formatTime(currentTime)}`);
  };

  const saveClip = (startTime = null, endTime = null, title = '') => {
    const clipStart = startTime || Math.max(0, currentTime - 30);
    const clipEnd = endTime || Math.min(duration, currentTime + 30);
    
    const clip = {
      id: Date.now(),
      startTime: clipStart,
      endTime: clipEnd,
      title: title || `Clip from ${formatTime(clipStart)}`,
      videoId: extractVideoId(video.url),
      skill,
      time: new Date().toLocaleTimeString()
    };
    
    setClips(prev => [...prev, clip]);
    addAiMessage(`✅ Saved clip: "${clip.title}" (${formatTime(clipStart)} - ${formatTime(clipEnd)})`);
  };

  const addNote = (content) => {
    const note = {
      id: Date.now(),
      content,
      timestamp: currentTime,
      skill,
      time: new Date().toLocaleTimeString()
    };
    
    setNotes(prev => [...prev, note]);
    addAiMessage(`📝 Note added at ${formatTime(currentTime)}`);
  };

  const takeScreenshot = () => {
    // This would capture the current video frame
    const screenshot = {
      id: Date.now(),
      timestamp: currentTime,
      title: `Screenshot at ${formatTime(currentTime)}`,
      skill,
      time: new Date().toLocaleTimeString()
    };
    
    addAiMessage(`📸 Screenshot saved at ${formatTime(currentTime)}`);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{video.title}</h2>
                <p className="text-sm text-gray-600">{video.channel} • Learning: {skill}</p>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-black relative">
            <div id="youtube-player" className="w-full h-full"></div>
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-black bg-opacity-75 text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
              
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addBookmark()}
                  className="bg-black bg-opacity-75 text-white hover:bg-opacity-90"
                >
                  <Bookmark className="h-4 w-4 mr-1" />
                  Bookmark
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => saveClip()}
                  className="bg-black bg-opacity-75 text-white hover:bg-opacity-90"
                >
                  <Scissors className="h-4 w-4 mr-1" />
                  Save Clip
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={takeScreenshot}
                  className="bg-black bg-opacity-75 text-white hover:bg-opacity-90"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Screenshot
                </Button>
              </div>
            </div>
          </div>
        </div>        {/* AI Assistant Sidebar */}
        <div className="w-96 border-l flex flex-col bg-gray-50">          {/* Chat Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Learning Assistant</h3>
              <Badge variant="outline" className="ml-auto">
                {messages.length} messages
              </Badge>
            </div>
          </div>{/* Chat Messages - Fixed height container with internal scrolling */}
          <div className="flex flex-col" style={{ height: '400px' }}>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'ai' && <Bot className="h-4 w-4 text-blue-600" />}
                      {message.type === 'user' && <User className="h-4 w-4 text-gray-600" />}
                      <span className="text-xs text-gray-500">
                        {message.time} • {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isAiTyping && (
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </div>          {/* Chat Input - Fixed at bottom */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about this video..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              
              <Button
                size="sm"
                variant="outline"
                onClick={toggleVoiceInput}
                className={isListening ? 'bg-red-50 border-red-200' : ''}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button size="sm" onClick={sendMessage} disabled={!inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions - Fixed at bottom */}
          <div className="p-4 border-t bg-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMessage("Explain this concept")}
                className="text-xs"
              >
                Explain This
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMessage("Create a summary")}
                className="text-xs"
              >
                Summarize
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMessage("Save important parts")}
                className="text-xs"
              >
                Save Key Parts
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMessage("Quiz me on this")}
                className="text-xs"
              >
                Quiz Me
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
