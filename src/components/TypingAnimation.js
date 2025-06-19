'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pause, Play, SkipForward } from 'lucide-react';

export default function TypingAnimation({ content, speed = 30, onComplete, onPause, isPaused = false, showFullContent = false }) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [internalIsPaused, setInternalIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!content) return;

    // If showFullContent is true, show everything immediately
    if (showFullContent) {
      setDisplayedContent(content);
      setIsTypingComplete(true);
      setCurrentIndex(content.length);
      if (onComplete) onComplete();
      return;
    }

    // Reset state when content changes
    setDisplayedContent('');
    setIsTypingComplete(false);
    setCurrentIndex(0);

    startTyping();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [content, showFullContent]);
  useEffect(() => {
    if (isPaused || internalIsPaused) {
      pauseTyping();
    } else if (!isTypingComplete && currentIndex < content.length) {
      startTyping();
    }
  }, [isPaused, internalIsPaused]);

  const startTyping = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        if (newIndex <= content.length) {
          setDisplayedContent(content.slice(0, newIndex));
          
          if (newIndex >= content.length) {
            setIsTypingComplete(true);
            clearInterval(timerRef.current);
            if (onComplete) onComplete();
          }
          
          return newIndex;
        }
        return prevIndex;
      });
    }, speed);
  };

  const pauseTyping = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (onPause) onPause();
  };

  const skipToEnd = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setDisplayedContent(content);
    setIsTypingComplete(true);
    setCurrentIndex(content.length);
    if (onComplete) onComplete();
  };
  const handlePauseResume = () => {
    setInternalIsPaused(!internalIsPaused);
  };

  const handleSkip = () => {
    skipToEnd();
  };

  return (
    <div className="relative">
      <div className="prose prose-sm max-w-none text-foreground">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({children}) => <h1 className="text-lg font-bold text-foreground mb-3">{children}</h1>,
            h2: ({children}) => <h2 className="text-base font-semibold text-foreground mb-2 mt-4">{children}</h2>,
            h3: ({children}) => <h3 className="text-sm font-semibold text-foreground mb-2 mt-3">{children}</h3>,            p: ({children}) => <p className="text-sm text-foreground mb-2 leading-relaxed">{children}</p>,
            ul: ({children}) => <ul className="list-disc list-inside text-sm text-foreground mb-2 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside text-sm text-foreground mb-2 space-y-1">{children}</ol>,
            li: ({children}) => <li className="text-sm text-foreground">{children}</li>,
            strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({children}) => <em className="italic text-foreground">{children}</em>,            code: ({inline, children}) => 
              inline 
                ? <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>
                : <code className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto text-foreground my-2 whitespace-pre">{children}</code>,
            pre: ({children}) => <div className="my-2">{children}</div>,blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 text-sm text-muted-foreground my-2">{children}</blockquote>,
            a: ({href, children}) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
              >
                {children}
                {href && href.includes('drive.google.com') && (
                  <svg className="h-3 w-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            ),
            hr: () => <hr className="border-border my-4" />,
            table: ({children}) => <table className="w-full border-collapse border border-border text-xs">{children}</table>,
            th: ({children}) => <th className="border border-border px-2 py-1 bg-muted text-foreground font-semibold">{children}</th>,
            td: ({children}) => <td className="border border-border px-2 py-1 text-foreground">{children}</td>,
          }}
        >
          {displayedContent}
        </ReactMarkdown>
        {!isTypingComplete && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1"></span>}
      </div>
      
      {/* Typing Controls - Only show when typing is in progress */}
      {!isTypingComplete && (
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1">
          <button
            onClick={handlePauseResume}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            title={internalIsPaused || isPaused ? "Resume" : "Pause"}
          >
            {internalIsPaused || isPaused ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Skip to end"
          >
            <SkipForward className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
