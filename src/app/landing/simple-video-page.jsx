'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ScrollVideoBackground from '@/components/ScrollVideoBackground';
import { motion } from 'framer-motion';

export default function SimpleVideoLanding() {
  const router = useRouter();
  // Use a relative path that matches the public directory structure
  const videoSrc = '/videos/Video_Ready_Resume_Error.mp4';

  return (
    <ScrollVideoBackground videoSrc={videoSrc}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Hero Section with just the title and buttons */}
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">
            <span className="text-[#2260FF]">X-</span>CEED
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Land Your Dream Job with <span className="text-[#2260FF] font-semibold">AI-Powered Resume Analysis</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => router.push('/auth')} 
              size="lg" 
              className="bg-[#2260FF] hover:bg-[#1a4cd1] text-white px-8"
            >
              Sign Up
            </Button>
            <Button 
              onClick={() => router.push('/auth')} 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white/10"
            >
              Login
            </Button>
          </div>
        </motion.div>
        
        {/* Empty space to allow scrolling */}
        <div className="h-[200vh]"></div>
      </div>
    </ScrollVideoBackground>
  );
}