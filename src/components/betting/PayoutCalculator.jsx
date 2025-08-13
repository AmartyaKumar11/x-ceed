'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  TrendingUp, 
  Award, 
  Clock, 
  Target,
  DollarSign,
  Percent
} from 'lucide-react';

export default function PayoutCalculator({ 
  stakeAmount, 
  aiEstimatedTime, 
  userChallengeTime, 
  currentQualityScore = 0,
  actualTime = null 
}) {
  const [payout, setPayout] = useState(null);
  const [canComplete, setCanComplete] = useState(false);

  // Calculate payout in real-time
  useEffect(() => {
    if (stakeAmount && aiEstimatedTime && userChallengeTime) {
      const timeReduction = ((aiEstimatedTime - userChallengeTime) * 100) / aiEstimatedTime;
      
      let multiplier;
      if (timeReduction >= 50) {
        multiplier = 3.0;
      } else if (timeReduction >= 30) {
        multiplier = 2.0 + (timeReduction - 30) * 0.05;
      } else if (timeReduction >= 15) {
        multiplier = 1.5 + (timeReduction - 15) * 0.033;
      } else {
        multiplier = 1.05 + timeReduction * 0.03;
      }

      let basePayout = parseFloat(stakeAmount) * multiplier;
      
      // Quality bonus
      const qualityBonus = currentQualityScore >= 80 ? 1.1 : 1.0;
      basePayout *= qualityBonus;
      
      // Platform fee
      const platformFee = basePayout * 0.05;
      const finalPayout = basePayout - platformFee;
      
      setPayout({
        timeReduction: timeReduction.toFixed(1),
        multiplier: multiplier.toFixed(2),
        basePayout: basePayout.toFixed(4),
        qualityBonus: ((qualityBonus - 1) * 100).toFixed(0),
        platformFee: platformFee.toFixed(4),
        finalPayout: finalPayout.toFixed(4),
        profit: (finalPayout - parseFloat(stakeAmount)).toFixed(4)
      });

      // Check completion eligibility
      if (actualTime !== null) {
        const metTime = actualTime <= userChallengeTime;
        const metQuality = currentQualityScore >= 60;
        setCanComplete(metTime && metQuality);
      }
    }
  }, [stakeAmount, aiEstimatedTime, userChallengeTime, currentQualityScore, actualTime]);

  const getRiskLevel = () => {
    if (!payout) return 'UNKNOWN';
    const reduction = parseFloat(payout.timeReduction);
    if (reduction < 15) return 'LOW';
    if (reduction < 30) return 'MEDIUM';
    return 'HIGH';
  };

  const getRiskColor = () => {
    const risk = getRiskLevel();
    switch (risk) {
      case 'LOW': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700';
      case 'HIGH': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!payout) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Enter betting details to see payout calculation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Smart Payout Calculator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Risk Assessment */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Risk Level</span>
          <Badge className={getRiskColor()}>
            {getRiskLevel()} ({payout.timeReduction}% faster)
          </Badge>
        </div>

        {/* Time Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-600 dark:text-blue-300">AI Estimate</p>
            <p className="font-bold text-blue-900 dark:text-blue-100">{formatTime(aiEstimatedTime)}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
            <Target className="h-6 w-6 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-purple-600 dark:text-purple-300">Your Challenge</p>
            <p className="font-bold text-purple-900 dark:text-purple-100">{formatTime(userChallengeTime)}</p>
          </div>
        </div>

        {/* Payout Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payout Breakdown
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Stake Amount:</span>
              <span className="font-mono">{stakeAmount} EDU</span>
            </div>
            
            <div className="flex justify-between">
              <span>Base Multiplier:</span>
              <span className="font-mono text-green-600">{payout.multiplier}x</span>
            </div>
            
            <div className="flex justify-between">
              <span>Quality Bonus:</span>
              <span className="font-mono text-blue-600">
                {payout.qualityBonus > 0 ? `+${payout.qualityBonus}%` : 'None'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Platform Fee:</span>
              <span className="font-mono text-red-600">-{payout.platformFee} EDU</span>
            </div>
            
            <hr className="my-2" />
            
            <div className="flex justify-between font-semibold">
              <span>Final Payout:</span>
              <span className="font-mono text-green-600">{payout.finalPayout} EDU</span>
            </div>
            
            <div className="flex justify-between">
              <span>Your Profit:</span>
              <span className={`font-mono ${parseFloat(payout.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {payout.profit >= 0 ? '+' : ''}{payout.profit} EDU
              </span>
            </div>
          </div>
        </div>

        {/* Quality Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Quality Score</span>
            <span>{currentQualityScore}/100</span>
          </div>
          <Progress 
            value={currentQualityScore} 
            className={`h-2 ${currentQualityScore >= 60 ? 'text-green-600' : 'text-red-600'}`}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 60 required • Bonus at 80+
          </p>
        </div>

        {/* Completion Status */}
        {actualTime !== null && (
          <div className={`p-3 rounded-lg border ${canComplete ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2">
              <Award className={`h-5 w-5 ${canComplete ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <span className={`font-semibold ${canComplete ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {canComplete ? 'Eligible for Payout!' : 'Requirements Not Met'}
              </span>
            </div>
            <div className="mt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Time Challenge:</span>
                <span className={actualTime <= userChallengeTime ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {actualTime <= userChallengeTime ? '✓ PASS' : '✗ FAIL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Quality Requirement:</span>
                <span className={currentQualityScore >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {currentQualityScore >= 60 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ROI Indicator */}
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <TrendingUp className="h-6 w-6 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Return on Investment</p>
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {((parseFloat(payout.profit) / parseFloat(stakeAmount)) * 100).toFixed(1)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
