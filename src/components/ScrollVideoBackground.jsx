'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ScrollVideoBackground({ videoSrc, children }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle video metadata loaded
  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;
    
    const handleMetadataLoaded = () => {
      setIsVideoReady(true);
      // Ensure video is initially paused at the first frame
      video.currentTime = 0;
      video.pause();
    };
    
    video.addEventListener('loadedmetadata', handleMetadataLoaded);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleMetadataLoaded);
    };
  }, []);

  // Handle scroll events to play/pause video
  useEffect(() => {
    if (!isVideoReady) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const video = videoRef.current;
      
      if (!video) return;
      
      // Detect if user is actively scrolling
      if (currentScrollY !== lastScrollY) {
        setIsScrolling(true);
        // Play video while scrolling
        if (video.paused) {
          video.play().catch(err => console.error('Error playing video:', err));
        }
        
        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set a timeout to detect when scrolling stops
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          if (!video.paused) {
            video.pause();
          }
        }, 150); // Adjust timeout as needed for smoothness
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isVideoReady, lastScrollY]);

  // Add state for video loading error
  const [videoError, setVideoError] = useState(false);

  // Handle video error
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleError = () => {
      console.error('Video failed to load:', videoSrc);
      setVideoError(true);
    };
    
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen">
      {/* Video background or fallback */}
      <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden">
        {!videoError ? (
          <video 
            ref={videoRef}
            src={videoSrc}
            className="absolute w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            onError={() => setVideoError(true)}
            style={{ filter: 'contrast(1.2) brightness(1.2) saturate(1.1)' }}
          />
        ) : (
          // Fallback gradient background
          <div className="absolute w-full h-full bg-gradient-to-b from-black via-navy-900 to-indigo-900"></div>
        )}
        {/* Minimal overlay for text readability */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 min-h-[300vh]">
        {children}
      </div>
    </div>
  );
}