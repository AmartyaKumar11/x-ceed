'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PayoutCalculator({ 
  stakeAmount, 
  aiEstimatedTime, 
  userChallengeTime, 
  currentQualityScore = 0,
  actualTime = null,
  completionData = null
}) {
  // Helper function to format time
  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Simple test version to isolate the error
  if (!stakeAmount) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <p className="font-medium">Enter betting details to see payout calculation</p>
            <p className="text-xs mt-2">Place a bet first to see detailed payout breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl">
      <CardHeader>
        <CardTitle>Payout Calculator - Test Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="text-2xl font-bold text-emerald-700">{stakeAmount || '0'}</div>
            <div className="text-xs text-emerald-600">STAKE (EDU)</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{formatTime(userChallengeTime)}</div>
            <div className="text-xs text-blue-600">YOUR TARGET</div>
          </div>
        </div>
        <div className="text-center">
          <p>Basic payout calculator working!</p>
          <p>Stake: {stakeAmount} EDU</p>
          <p>Target: {formatTime(userChallengeTime)}</p>
          <p>AI Estimate: {formatTime(aiEstimatedTime)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
