'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Loader2, Download, Scissors, Camera, FolderPlus, Bot, Video, MessageSquare } from 'lucide-react';

export default function VideoAIAssistant() {
  const searchParams = useSearchParams();
  const [videoId, setVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoChannel, setVideoChannel] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setVideoId(searchParams.get('videoId') || '');
    setVideoTitle(decodeURIComponent(searchParams.get('title') || ''));
    setVideoChannel(decodeURIComponent(searchParams.get('channel') || ''));      // Add welcome message
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: `Hi! I'm your AI video assistant. I can help you:

• Create detailed notes and summaries
• Clip specific sections of the video
• Take screenshots of key moments
• Save content to Google Drive
• Answer questions about the video content

What would you like me to help you with?`,
        timestamp: new Date()
      }
    ]);
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          actions: data.actions || []
        };
        setMessages(prev => [...prev, aiMessage]);
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
  const quickActions = [
    { icon: <Download className="h-4 w-4" />, text: "Create Notes", action: "Create detailed notes for this video" },
    { icon: <Scissors className="h-4 w-4" />, text: "Clip Video", action: "Help me clip a specific part of this video" },
    { icon: <Camera className="h-4 w-4" />, text: "Screenshot", action: "Take a screenshot of the current video frame" },
    { icon: <FolderPlus className="h-4 w-4" />, text: "Save to Drive", action: "Save this video content to my Google Drive" }
  ];  return (
    <div className="h-screen flex bg-background">
      {/* Left Panel - Video Player */}
      <div className="w-1/2 flex flex-col bg-card border-r border-border">
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
          </div>
        </div>
      </div>

      {/* Right Panel - AI Chat */}
      <div className="w-1/2 flex flex-col bg-card">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Video Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by Gemini AI</p>
            </div>
          </div>
        </div>        {/* Quick Actions */}
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
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.type === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground border border-border rounded-bl-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          className="block w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                        >
                          {action.text}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted text-foreground p-4 rounded-2xl rounded-bl-md border border-border flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border bg-card">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this video..."
                className="w-full p-4 pr-12 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground transition-all"
                rows="2"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 font-medium"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
