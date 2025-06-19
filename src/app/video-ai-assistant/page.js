'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Loader2, Download, Scissors, Camera, FolderPlus, Bot, Video, MessageSquare, FileText, Clock, Play, ExternalLink, Pause, Square, SkipForward, Trash } from 'lucide-react';
import TypingAnimation from '@/components/TypingAnimation';
import GoogleIntegration from '@/components/GoogleIntegration';

export default function VideoAIAssistant() {
  const searchParams = useSearchParams();
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoChannel, setVideoChannel] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pausedMessages, setPausedMessages] = useState(new Set());
  const [completedMessages, setCompletedMessages] = useState(new Set());
  const [showFullContent, setShowFullContent] = useState(new Set());
  const [pendingNotes, setPendingNotes] = useState(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showDocumentNameDialog, setShowDocumentNameDialog] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [showProjectSetupDialog, setShowProjectSetupDialog] = useState(false);
  const [projectFolder, setProjectFolder] = useState(null);
  const [projectFolderName, setProjectFolderName] = useState('');  const [existingDoc, setExistingDoc] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);

  // Persist chat state to localStorage
  const saveToLocalStorage = (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };
  const loadFromLocalStorage = (key, defaultValue = null) => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // If loading messages, convert timestamp strings back to Date objects
          if (key.includes('_messages') && Array.isArray(parsed)) {
            return parsed.map(message => ({
              ...message,
              timestamp: new Date(message.timestamp)
            }));
          }
          
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return defaultValue;
  };  useEffect(() => {
    const currentVideoId = searchParams.get('videoId') || '';
    const currentVideoTitle = decodeURIComponent(searchParams.get('title') || '');
    const currentVideoChannel = decodeURIComponent(searchParams.get('channel') || '');
    
    setVideoId(currentVideoId);
    setVideoTitle(currentVideoTitle);
    setVideoChannel(currentVideoChannel);

    // Load saved panel width
    const savedPanelWidth = loadFromLocalStorage('panelWidth', 50);
    setLeftPanelWidth(savedPanelWidth);

    // Create a unique key for this video's chat
    const chatKey = `chat_${currentVideoId}_${btoa(currentVideoTitle).slice(0, 10)}`;
    
    // Load persisted chat data
    const savedMessages = loadFromLocalStorage(`${chatKey}_messages`);
    const savedProjectFolder = loadFromLocalStorage(`${chatKey}_projectFolder`);
    const savedCompletedMessages = loadFromLocalStorage(`${chatKey}_completedMessages`);
    const savedShowFullContent = loadFromLocalStorage(`${chatKey}_showFullContent`);

    if (savedMessages && savedMessages.length > 0) {
      // Restore saved chat
      setMessages(savedMessages);
      setProjectFolder(savedProjectFolder);
      setCompletedMessages(new Set(savedCompletedMessages || []));
      setShowFullContent(new Set(savedShowFullContent || []));
    } else {
      // Create new welcome message
      const welcomeMessage = {
        id: 1,
        type: 'ai',
        content: `Hi! I'm your AI video assistant. I can help you:

• Create detailed notes and summaries
• Clip specific sections of the video
• Take screenshots of key moments
• Save content to Google Drive
• Answer questions about the video content

**Want to stay organized?** I can create a dedicated Google Drive folder for this video project.

What would you like me to help you with?`,
        timestamp: new Date(),
        isWelcome: true,
        showProjectSetup: true
      };
      
      setMessages([welcomeMessage]);
      setCompletedMessages(new Set([1]));
      setShowFullContent(new Set([1]));
    }
  }, [searchParams]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };  useEffect(() => {
    scrollToBottom();
    
    // Save chat state whenever messages change
    if (videoId && messages.length > 0) {
      const chatKey = `chat_${videoId}_${btoa(videoTitle).slice(0, 10)}`;
      saveToLocalStorage(`${chatKey}_messages`, messages);
      saveToLocalStorage(`${chatKey}_projectFolder`, projectFolder);
      saveToLocalStorage(`${chatKey}_completedMessages`, Array.from(completedMessages));
      saveToLocalStorage(`${chatKey}_showFullContent`, Array.from(showFullContent));
    }
  }, [messages, projectFolder, completedMessages, showFullContent, videoId, videoTitle]);

  // Save panel width when it changes
  useEffect(() => {
    saveToLocalStorage('panelWidth', leftPanelWidth);
  }, [leftPanelWidth]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/video-ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          videoId: videoId,
          videoTitle: videoTitle,
          videoChannel: videoChannel,
          conversationHistory: messages
        }),
      });

      const data = await response.json();      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          actions: data.actions || [],
          clips: data.clips,
          notes: data.notes
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Check if AI generated notes and show document management dialog
        if (data.notes && data.notes.length > 0) {
          setPendingNotes({
            notes: data.notes,
            messageId: aiMessage.id
          });
          setShowDocumentDialog(true);
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const togglePause = (messageId) => {
    setPausedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const skipToEnd = (messageId) => {
    setShowFullContent(prev => new Set([...prev, messageId]));
    setPausedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
    setCompletedMessages(prev => new Set([...prev, messageId]));
  };

  const handleTypingComplete = (messageId) => {
    setCompletedMessages(prev => new Set([...prev, messageId]));
    setPausedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  // Handler Functions
  const handleSaveToGoogleDrive = (content) => {
    setPendingNotes(content);
    setShowDocumentDialog(true);
  };

  const handleDocumentChoice = async (choice) => {
    setShowDocumentDialog(false);
    
    if (!pendingNotes) return;
    
    try {
      switch (choice) {
        case 'new':
          // Show document name dialog for new document
          setShowDocumentNameDialog(true);
          setExistingDoc(null);
          break;
        case 'existing':
          // Add to existing document
          await addToExistingDocument();
          break;
        case 'select':
          // Show document selector
          await showDocumentSelector();
          break;
      }
    } catch (error) {
      console.error('Error handling document choice:', error);
      alert('Failed to process document choice. Please try again.');
    }
  };
  const addToExistingDocument = async () => {
    try {
      const response = await fetch('/api/google-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_docs_in_folder',
          data: {
            folderId: projectFolder?.id
          }
        }),
      });

      const data = await response.json();
      
      if (data.success && data.docs && data.docs.length > 0) {
        setExistingDoc(data.docs[0]); // Use the first document
        setShowDocumentNameDialog(true);
      } else {
        // No existing docs, create new one
        setShowDocumentNameDialog(true);
        setExistingDoc(null);
      }
    } catch (error) {
      console.error('Error listing documents:', error);
      // Fallback to creating new document
      setShowDocumentNameDialog(true);
      setExistingDoc(null);
    }
  };

  const showDocumentSelector = async () => {
    // For now, just add to existing document
    await addToExistingDocument();
  };
  const handleSaveNotes = async () => {
    try {
      let response;
      
      if (existingDoc) {
        // Add to existing document
        response = await fetch('/api/google-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'add_notes_to_doc',
            data: {
              documentId: existingDoc.id,
              notes: pendingNotes,
              videoTitle: videoTitle,
              videoId: videoId,
              videoChannel: videoChannel
            }
          }),
        });      } else {        // Create new document
        const action = projectFolder?.id ? 'create_doc_in_folder' : 'create_doc_for_video';
        const data = projectFolder?.id ? {
          videoTitle: videoTitle,
          videoChannel: videoChannel,
          videoId: videoId,
          folderId: projectFolder.id,
          docTitle: documentName.trim(),
          userEmail: null,
          notes: pendingNotes
        } : {
          videoTitle: videoTitle,
          videoChannel: videoChannel,
          videoId: videoId,
          docTitle: documentName.trim(),
          userEmail: null,
          notes: pendingNotes
        };
        
        response = await fetch('/api/google-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: action,            data: data
          }),
        });
      }const data = await response.json();
      
      if (data.success) {
        setShowDocumentNameDialog(false);
        setDocumentName('');
        setExistingDoc(null);
        setPendingNotes(null);        // Add a system message to confirm save
        const systemMessage = {
          id: Date.now(),
          type: 'ai',
          content: `✅ Notes ${existingDoc ? 'added to' : 'saved in'} "${existingDoc ? existingDoc.name : documentName.trim()}". Document created successfully!

📄 [Open Document](${data.doc?.documentUrl || data.doc?.documentUrl || '#'})${projectFolder ? `\n\n📁 [View Project Folder](${projectFolder.folderUrl || projectFolder.webViewLink})` : ''}

*Note: Documents are set to be accessible with the link for easy sharing.*`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
        setCompletedMessages(prev => new Set([...prev, systemMessage.id]));
        setShowFullContent(prev => new Set([...prev, systemMessage.id]));
      } else {
        throw new Error(data.error || data.message || 'Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      
      // Provide more specific error message to user
      let userMessage = 'Failed to save notes. ';
      if (error.message.includes('share')) {
        userMessage += 'Document was created but sharing failed.';
      } else if (error.message.includes('folder')) {
        userMessage += 'Please create a project folder first.';
      } else {
        userMessage += 'Please try again.';
      }
      
      alert(userMessage + '\n\nError details: ' + error.message);
    }
  };
  const handleCreateProjectFolder = async () => {
    try {
      const folderName = projectFolderName.trim() || `${videoTitle} - Notes`;
      
      const response = await fetch('/api/google-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          action: 'create_project_folder',
          data: {
            projectName: folderName,
            videoTitle: videoTitle,
            userEmail: null // Don't try to share with a fake email
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProjectFolder(data.folder);
        setShowProjectSetupDialog(false);
        setProjectFolderName('');        // Add a system message to confirm folder creation
        const systemMessage = {
          id: Date.now(),
          type: 'ai',
          content: `✅ Created project folder "${folderName}" in your Google Drive. All future notes will be saved here.

📁 [Open Project Folder](${data.folder.folderUrl || data.folder.webViewLink})

*Note: The folder is set to be accessible with the link. You can edit permissions in Google Drive if needed.*`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
        setCompletedMessages(prev => new Set([...prev, systemMessage.id]));
        setShowFullContent(prev => new Set([...prev, systemMessage.id]));
      } else {
        throw new Error(data.error || 'Failed to create folder');
      }    } catch (error) {
      console.error('Error creating project folder:', error);
      alert('Failed to create project folder. Please try again.');
    }
  };

  const clearChatHistory = () => {
    if (confirm('Are you sure you want to clear the chat history? This will remove all messages and start fresh.')) {
      const chatKey = `chat_${videoId}_${btoa(videoTitle).slice(0, 10)}`;
      
      // Clear localStorage
      localStorage.removeItem(`${chatKey}_messages`);
      localStorage.removeItem(`${chatKey}_projectFolder`);
      localStorage.removeItem(`${chatKey}_completedMessages`);
      localStorage.removeItem(`${chatKey}_showFullContent`);
      
      // Reset state
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hi! I'm your AI video assistant. I can help you:

• Create detailed notes and summaries
• Clip specific sections of the video
• Take screenshots of key moments
• Save content to Google Drive
• Answer questions about the video content

**Want to stay organized?** I can create a dedicated Google Drive folder for this video project.

What would you like me to help you with?`,
        timestamp: new Date(),
        isWelcome: true,
        showProjectSetup: true
      };
      
      setMessages([welcomeMessage]);
      setCompletedMessages(new Set([welcomeMessage.id]));
      setShowFullContent(new Set([welcomeMessage.id]));
      setProjectFolder(null);
      setPendingNotes(null);
    }
  };
  const quickActions = [
    { icon: <Download className="h-4 w-4" />, text: "Create Notes", action: "Create detailed notes for this video" },
    { icon: <Scissors className="h-4 w-4" />, text: "Clip Video", action: "Help me clip a specific part of this video" },
    { icon: <Camera className="h-4 w-4" />, text: "Screenshot", action: "Take a screenshot of the current video frame" },
    { icon: <FolderPlus className="h-4 w-4" />, text: "Save to Drive", action: "Save this video content to my Google Drive" }
  ];

  // Resizable panel handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.split-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain the width between 20% and 80%
    const constrainedWidth = Math.min(80, Math.max(20, newLeftWidth));
    setLeftPanelWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="h-screen flex bg-background split-container">
      {/* Left Panel - Video Player */}
      <div 
        className="flex flex-col bg-card border-r border-border transition-all duration-200 ease-out"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {/* Video Header */}
        <div className="px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Video className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{videoTitle}</h2>
              <p className="text-sm text-muted-foreground truncate">{videoChannel}</p>
            </div>
          </div>
        </div>
        
        {/* Video Player Container */}
        <div className="flex-1 flex items-center justify-center bg-black p-6">
          {videoId ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="aspect-video w-full max-w-none h-full max-h-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=1`}
                  title={videoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg shadow-lg"
                ></iframe>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No video selected</p>
              <p className="text-sm opacity-70 mt-2">Select a video to get started</p>
            </div>
          )}
        </div>        {/* Video Info */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Use the AI assistant to create notes, clips, and analyze this video content
            </p>
          </div>        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors duration-200 relative group ${
          isDragging ? 'bg-primary' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="w-1 h-8 bg-muted-foreground/30 rounded-full group-hover:bg-primary/70 transition-colors duration-200" />
        </div>
      </div>

      {/* Right Panel - AI Chat */}
      <div 
        className="flex flex-col bg-card transition-all duration-200 ease-out"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >{/* Header */}
        <div className="px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-xl">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Video Assistant</h1>
                <p className="text-sm text-muted-foreground">Powered by Gemini AI</p>
              </div>
            </div>            <button
              onClick={clearChatHistory}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
              title="Clear chat history"
            >
              <Trash className="h-4 w-4" />
              Clear History
            </button>
          </div>
        </div>{/* Quick Actions */}
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(action.action)}
                className="flex items-center gap-3 p-3 text-sm bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
              >
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {action.icon}
                </div>
                <span className="font-medium text-foreground">
                  {action.text}
                </span>
              </button>
            ))}
          </div>
        </div>        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.type === 'ai' && (
                  <div className="flex-shrink-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground border border-border rounded-bl-sm'
                  }`}
                >                  {message.type === 'ai' ? (
                    <div className="relative">
                      <TypingAnimation 
                        content={message.content} 
                        speed={15} 
                        isPaused={pausedMessages.has(message.id)}
                        showFullContent={showFullContent.has(message.id)}
                        onComplete={() => handleTypingComplete(message.id)}
                      />
                        {/* Typing Controls - Only show while typing and not for welcome message */}
                      {!completedMessages.has(message.id) && !message.isWelcome && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={() => togglePause(message.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 border border-border rounded transition-colors"
                            title={pausedMessages.has(message.id) ? "Resume typing" : "Pause typing"}
                          >
                            {pausedMessages.has(message.id) ? (
                              <>
                                <Play className="h-3 w-3" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="h-3 w-3" />
                                Pause
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => skipToEnd(message.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 border border-border rounded transition-colors"
                            title="Show full response"
                          >
                            <SkipForward className="h-3 w-3" />
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed">{message.content}</div>
                  )}

                  {/* Display Video Clips */}
                  {message.clips && message.clips.length > 0 && (
                    <div className="mt-4 p-4 bg-background border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Scissors className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Suggested Clips ({message.clips.length})</span>
                      </div>
                      <div className="space-y-3">
                        {message.clips.map((clip, clipIndex) => (
                          <div key={clipIndex} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                              <Play className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground truncate">{clip.title}</h4>
                                <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded text-xs font-mono text-primary">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{clip.description}</p>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    const startTime = clip.start_time;
                                    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}&t=${startTime}s`;
                                    window.open(youtubeUrl, '_blank');
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Watch Clip
                                </button>
                                <span className="text-xs text-muted-foreground">• {clip.value}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          className="block w-full text-left p-2 text-xs bg-background/20 rounded border border-border hover:bg-background/40 transition-colors"
                        >
                          {action.text}
                        </button>
                      ))}
                    </div>
                  )}                  {/* Save to Google Drive button - Show for AI messages with notes */}
                  {message.type === 'ai' && completedMessages.has(message.id) && message.content && (
                    message.content.toLowerCase().includes('notes') || 
                    message.content.toLowerCase().includes('summary') ||
                    message.content.length > 500 // Show for long responses
                  ) && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleSaveToGoogleDrive(message.content)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FolderPlus className="h-4 w-4" />
                        Save to Google Drive
                      </button>
                    </div>
                  )}                  {/* Project Setup Button - Show only in welcome message */}
                  {message.isWelcome && message.showProjectSetup && !projectFolder && (
                    <div className="mt-4 p-4 bg-muted/30 border border-border rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Stay Organized</h4>
                      <p className="text-sm text-muted-foreground mb-3">Create a dedicated Google Drive folder for this video project to keep all your notes and content organized.</p>
                      <button
                        onClick={() => setShowProjectSetupDialog(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <FolderPlus className="h-4 w-4" />
                        Create Project Folder
                      </button>
                    </div>
                  )}                  {/* Project Folder Link - Show when folder exists */}
                  {message.isWelcome && projectFolder && (
                    <div className="mt-4 p-4 bg-accent/30 border border-border rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">📁 Project Folder</h4>
                      <p className="text-sm text-muted-foreground mb-3">Your notes are being saved to:</p>
                      <a
                        href={projectFolder.folderUrl || projectFolder.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        <FolderPlus className="h-4 w-4" />
                        Open Project Folder
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}                  <div className="text-xs opacity-60 mt-1">
                    {message.timestamp instanceof Date 
                      ? message.timestamp.toLocaleTimeString() 
                      : new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>          ))}          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center mt-1">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="bg-muted text-foreground px-3 py-2 rounded-lg rounded-bl-sm border border-border flex items-center gap-2 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this video..."
                className="w-full p-2.5 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground transition-all text-sm"
                rows="1"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-3 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all duration-200 text-sm font-medium"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>          </div>
        </div>
      </div>      {/* Document Management Dialog */}
      {showDocumentDialog && pendingNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Save Notes to Google Docs</h3>
            <p className="text-muted-foreground mb-6">
              I've generated detailed notes for you! Where would you like to save them?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDocumentChoice('new')}
                className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Create New Document</div>
                    <div className="text-sm text-muted-foreground">Create a new Google Doc in your project folder</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleDocumentChoice('existing')}
                className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Add to Existing Document</div>
                    <div className="text-sm text-muted-foreground">Append to your current video notes document</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleDocumentChoice('select')}
                className="w-full p-3 text-left border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderPlus className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Select Document</div>
                    <div className="text-sm text-muted-foreground">Choose from existing documents in your project</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDocumentDialog(false)}
                className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}      {/* Document Name Dialog */}
      {showDocumentNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {existingDoc ? 'Add to Document' : 'Create New Document'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {existingDoc ? 'These notes will be appended to the selected document.' : 'Enter a name for your new Google Doc.'}
            </p>
            
            {!existingDoc && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Video Notes"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDocumentNameDialog(false);
                  setDocumentName('');
                  setExistingDoc(null);
                  setPendingNotes(null);
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={!existingDoc && !documentName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {existingDoc ? 'Add Notes' : 'Create & Save'}
              </button>
            </div>
          </div>
        </div>
      )}      {/* Project Setup Dialog */}
      {showProjectSetupDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Project Folder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a dedicated Google Drive folder to organize all content for this video project.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={projectFolderName}
                onChange={(e) => setProjectFolderName(e.target.value)}
                placeholder={`${videoTitle} - Notes`}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowProjectSetupDialog(false);
                  setProjectFolderName('');
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleCreateProjectFolder}
                disabled={!projectFolderName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Folder
              </button>
            </div>          </div>        </div>
      )}
    </div>
  );
}
