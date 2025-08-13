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
  Percent,
  Flask,
  Trophy
} from 'lucide-react';
import { calculateTestPayout, shouldPayoutBreakEven, isDevelopmentMode } from '@/utils/testingUtils';

export default function PayoutCalculator({ 
  stakeAmount, 
  aiEstimatedTime, 
  userChallengeTime, 
  currentQualityScore = 0,
  actualTime = null,
  completionData = null // Add completion data for testing scenarios
}) {
  const [payout, setPayout] = useState(null);
  const [canComplete, setCanComplete] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // Debug logging to see what props we're receiving
  console.log('🔍 PayoutCalculator Props Debug:', {
    stakeAmount,
    aiEstimatedTime, 
    userChallengeTime,
    currentQualityScore,
    actualTime,
    completionData,
    hasAllRequiredProps: !!(stakeAmount && aiEstimatedTime && userChallengeTime)
  });

  // Helper function to format time from minutes to human readable
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate payout in real-time
  useEffect(() => {
    console.log('📊 PayoutCalculator useEffect triggered:', {
      stakeAmount,
      aiEstimatedTime,
      userChallengeTime,
      completionData,
      hasCompletionData: !!completionData
    });
    
    if (stakeAmount && aiEstimatedTime && userChallengeTime) {
      // Check if this is a test scenario first
      if (completionData && shouldPayoutBreakEven(completionData)) {
        console.log('🧪 Test mode detected! Calculating break-even payout...');
        const testPayout = calculateTestPayout(
          stakeAmount, 
          completionData, 
          aiEstimatedTime, 
          userChallengeTime
        );
        
        if (testPayout) {
          console.log('💰 Test payout calculated:', testPayout);
          setPayout(testPayout);
          setIsTestMode(true);
          setCanComplete(true);
          return;
        }
      }
      
      setIsTestMode(false);
      
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
        basePayout,
        qualityBonus,
        platformFee,
        finalPayout,
        multiplier,
        timeReduction: Math.round(timeReduction * 10) / 10,
        roi: Math.round(((finalPayout - parseFloat(stakeAmount)) / parseFloat(stakeAmount)) * 100)
      });

      // Check if completion is still possible
      setCanComplete(userChallengeTime >= aiEstimatedTime * 0.3);
    }
  }, [stakeAmount, aiEstimatedTime, userChallengeTime, currentQualityScore, completionData]);

  const getRiskLevel = () => {
    if (!payout || !payout.timeReduction) return 'UNKNOWN';
    if (payout.timeReduction >= 50) return 'EXTREME';
    if (payout.timeReduction >= 30) return 'HIGH';
    if (payout.timeReduction >= 15) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskColor = () => {
    const risk = getRiskLevel();
    switch (risk) {
      case 'EXTREME': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg';
      case 'HIGH': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg';
      case 'MEDIUM': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg';
      case 'LOW': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-lg';
    }
  };

  if (!payout) {
    return (
      <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-xl mb-4">
              <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="font-medium">Enter betting details to see payout calculation</p>
            <p className="text-xs mt-2">Place a bet first to see detailed payout breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl">
      <CardHeader className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border-b border-gray-100 dark:border-slate-600">
        <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
          <div className={`p-2 rounded-lg shadow-md ${isTestMode ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
            {isTestMode ? <Flask className="h-5 w-5 text-white" /> : <Calculator className="h-5 w-5 text-white" />}
          </div>
          <div>
            <div className="text-xl font-bold">
              {isTestMode ? 'Test Mode Payout Calculator' : 'Smart Payout Calculator'}
            </div>
            {isTestMode && (
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Development Testing Mode - Break Even Scenario
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6 bg-white dark:bg-slate-900">
        {/* Stake.com Style Betting Summary */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Active Learning Bet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your performance challenge details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stakeAmount}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">STAKE (EDU)</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatTime(userChallengeTime)}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">YOUR TARGET</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{(payout.multiplier || 1.0).toFixed(2)}x</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">MULTIPLIER</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{(payout.finalPayout || 0).toFixed(4)}</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">POTENTIAL WIN (EDU)</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">AI Estimate:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatTime(aiEstimatedTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Time Saved:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{(payout.timeReduction || 0).toFixed(1)}% faster</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Potential Profit:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{((payout.finalPayout || 0) - parseFloat(stakeAmount || 0)).toFixed(4)} EDU</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">ROI:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{(payout.roi || 0) >= 0 ? '+' : ''}{(payout.roi || 0)}%</span>
              </div>
            </div>
          </div>
        </div>
        {/* Risk Assessment */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {isTestMode ? 'Test Scenario' : 'Risk Level'}
          </span>
          {isTestMode ? (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg">
              BREAK EVEN TEST
            </Badge>
          ) : (
            <Badge className={getRiskColor()}>
              {getRiskLevel()} ({(payout.timeReduction || 0).toFixed(1)}% faster)
            </Badge>
          )}
        </div>

        {/* Test Mode Success Message */}
        {isTestMode && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl blur opacity-25"></div>
            <div className="relative bg-white dark:bg-slate-800 border border-green-200 dark:border-green-600 rounded-xl p-6 text-center shadow-lg">
              <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md mb-4">
                <Award className="h-6 w-6 text-white" />
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">🎉 Test Completed Successfully!</p>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">
                Break-even test result: You get exactly your bet money back
              </p>
              <div className="grid grid-cols-3 gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border">
                <div className="text-center">
                  <p className="text-xs text-green-600 dark:text-green-400">You Bet</p>
                  <p className="font-bold text-green-800 dark:text-green-200">{stakeAmount} EDU</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-600 dark:text-green-400">You Get</p>
                  <p className="font-bold text-green-800 dark:text-green-200">{(payout.finalPayout || 0).toFixed(4)} EDU</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-600 dark:text-green-400">Profit/Loss</p>
                  <p className="font-bold text-green-800 dark:text-green-200">0.0000 EDU</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Comparison */}
        <div className="grid grid-cols-2 gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center shadow-lg">
              <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">AI Estimated</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatTime(aiEstimatedTime)}</p>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center shadow-lg">
              <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Your Challenge</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatTime(userChallengeTime)}</p>
            </div>
          </div>
        </div>

        {/* Payout Breakdown */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
          <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Payout Breakdown</h4>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Base Stake:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{stakeAmount} EDU</span>
              </div>
              {!isTestMode && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Time Multiplier ({(payout.multiplier || 1.0).toFixed(2)}x):</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{((payout.basePayout || 0) - parseFloat(stakeAmount || 0)).toFixed(4)} EDU</span>
                  </div>
                  {currentQualityScore >= 80 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Quality Bonus (10%):</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{((payout.basePayout || 0) * 0.1).toFixed(4)} EDU</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Platform Fee (5%):</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">-{(payout.platformFee || 0).toFixed(4)} EDU</span>
                  </div>
                </>
              )}
              {isTestMode && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Test Mode Adjustment:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">Break Even Override</span>
                </div>
              )}
              <hr className="border-slate-200 dark:border-slate-600" />
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-slate-900 dark:text-slate-100">Total Payout:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{(payout.finalPayout || 0).toFixed(4)} EDU</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Display */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center shadow-lg">
            <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg shadow-md mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Return on Investment</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {(payout.roi || 0) >= 0 ? '+' : ''}{(payout.roi || 0)}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Profit: {((payout.finalPayout || 0) - parseFloat(stakeAmount || 0)).toFixed(4)} EDU
              </p>
            </div>
          </div>
        </div>

        {/* Quality Score Progress */}
        {currentQualityScore > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Learning Quality Score</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{currentQualityScore}%</span>
            </div>
            <Progress value={currentQualityScore} className="h-3" />
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              {currentQualityScore >= 80 ? '✅ Quality bonus unlocked!' : '⚡ Reach 80% for quality bonus'}
            </p>
          </div>
        )}

        {/* Completion Warning */}
        <div className={`relative rounded-xl p-6 text-center shadow-lg ${canComplete 
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700' 
          : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-700'
        }`}>
          <div className="inline-flex p-3 rounded-lg shadow-md mb-4" style={{
            background: canComplete 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          }}>
            {canComplete ? (
              <Award className="h-6 w-6 text-white" />
            ) : (
              <Target className="h-6 w-6 text-white" />
            )}
          </div>
          <p className={`text-lg font-bold mb-2 ${canComplete ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
            {canComplete 
              ? 'Challenge Achievable - Good Luck!' 
              : '⚠️ Extremely Ambitious Timeline'
            }
          </p>
          <p className={`text-sm ${canComplete ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {canComplete 
              ? 'This timeline looks realistic for success' 
              : 'Consider extending your timeline for better chances'
            }
          </p>
        </div>

        {/* Actual vs Target (if course is in progress) */}
        {actualTime && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
            <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Current Progress</h5>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Time spent:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatTime(actualTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Remaining:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatTime(Math.max(0, userChallengeTime - actualTime))}</span>
                </div>
                <Progress 
                  value={(actualTime / userChallengeTime) * 100} 
                  className="mt-3 h-3" 
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
