'use client';

import { useState } from 'react';
// Let's test without Card components first
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
import { Flask } from 'lucide-react';

export default function BettingTestingPanelSimple({ 
  videos = [], 
  betAmount, 
  onTestComplete 
}) {
  const [isVisible, setIsVisible] = useState(false);

  // Don't show in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const runBreakEvenTest = () => {
    // Simple test completion
    const testCompletions = {};
    
    videos.forEach((video, index) => {
      const videoKey = video.url || `video-${index}`;
      testCompletions[videoKey] = {
        totalWatchTime: 300, // 5 minutes
        actualProgress: 100,
        qualityScore: 70,
        forceCompleted: true,
        devModeBreakEven: true,
        completedAt: new Date().toISOString()
      };
    });

    const testPayout = {
      basePayout: parseFloat(betAmount),
      platformFee: 0,
      finalPayout: parseFloat(betAmount),
      multiplier: 1.0,
      profit: 0,
      isTestMode: true
    };

    if (onTestComplete) {
      onTestComplete(testCompletions, testPayout);
    }
  };

  return (
    <div className="border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-lg p-4">
      <div className="flex items-center gap-3 text-orange-800 mb-4">
        <Flask className="h-5 w-5" />
        <h3 className="font-bold">Betting Testing Panel (Minimal)</h3>
      </div>
      
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? 'Hide' : 'Show'} Testing
      </button>
      
      {isVisible && (
        <div className="space-y-4">
          <p className="text-sm text-orange-600">
            Development mode testing - Click to complete all videos instantly
          </p>
          
          <button
            onClick={runBreakEvenTest}
            disabled={!betAmount}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Break Even Test (Get Your Money Back)
          </button>
          
          {!betAmount && (
            <p className="text-xs text-red-600">
              Place a bet first to enable testing
            </p>
          )}
        </div>
      )}
    </div>
  );
}
