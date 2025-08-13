'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Calculator,
  Trophy,
  AlertTriangle,
  Coins,
  Shield,
  Wallet,
  Timer,
  Eye,
  UserX
} from 'lucide-react';
import { calculateMultiplier, formatTime, eduToWei } from '@/config/blockchain';
import { LEARNING_BETS_ABI } from '@/config/contracts';

export default function LearningBetInterface({ 
  courseId, 
  aiEstimatedTime, 
  courseDifficulty = 1.0,
  onBetPlaced 
}) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  // User balance checking
  const { data: balance } = useBalance({
    address: address,
  });
  
  const [betAmount, setBetAmount] = useState('0.001');
  const [challengeTime, setChallengeTime] = useState(aiEstimatedTime * 0.8); // 20% faster by default
  const [multiplier, setMultiplier] = useState(1.0);
  const [potentialWinning, setPotentialWinning] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);
  const [durationError, setDurationError] = useState('');
  
  // Calculate minimum allowed duration (cannot be less than 25% of AI estimate)
  const minAllowedDuration = aiEstimatedTime * 0.25;
  const maxAllowedDuration = aiEstimatedTime * 1.2; // Can be 20% longer than AI estimate
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate multiplier and potential winnings when inputs change
  useEffect(() => {
    // Validate duration limits
    if (challengeTime < minAllowedDuration) {
      setDurationError(`Minimum duration is ${formatTime(minAllowedDuration)} (25% of AI estimate)`);
      setMultiplier(1.0);
      setPotentialWinning(parseFloat(betAmount));
      setRiskLevel('INVALID');
      return;
    }
    
    if (challengeTime > maxAllowedDuration) {
      setDurationError(`Maximum duration is ${formatTime(maxAllowedDuration)} (120% of AI estimate)`);
      setMultiplier(1.0);
      setPotentialWinning(parseFloat(betAmount));
      setRiskLevel('INVALID');
      return;
    }
    
    setDurationError('');
    
    if (challengeTime < aiEstimatedTime) {
      const newMultiplier = calculateMultiplier(aiEstimatedTime, challengeTime, courseDifficulty);
      setMultiplier(newMultiplier);
      setPotentialWinning(parseFloat(betAmount) * newMultiplier);
      
      // Determine risk level and show anti-cheat warning for extreme cases
      if (newMultiplier >= 3.0) {
        setRiskLevel('HIGH');
        setShowAntiCheatWarning(true);
      } else if (newMultiplier >= 2.0) {
        setRiskLevel('MEDIUM');
        setShowAntiCheatWarning(newMultiplier >= 2.5);
      } else {
        setRiskLevel('LOW');
        setShowAntiCheatWarning(false);
      }
    } else {
      setMultiplier(1.0);
      setPotentialWinning(parseFloat(betAmount));
      setRiskLevel('LOW');
      setShowAntiCheatWarning(false);
    }
  }, [betAmount, challengeTime, aiEstimatedTime, courseDifficulty, minAllowedDuration, maxAllowedDuration]);

  const handlePlaceBet = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place a bet",
        variant: "destructive",
      });
      return;
    }

    // Check if user has sufficient balance
    const userBalance = balance ? parseFloat(balance.formatted) : 0;
    const betAmountFloat = parseFloat(betAmount);

    if (betAmountFloat > userBalance) {
      toast({
        title: "Insufficient balance",
        description: `You have ${userBalance.toFixed(4)} EDU but trying to bet ${betAmount} EDU`,
        variant: "destructive",
      });
      return;
    }

    if (betAmountFloat <= 0 || betAmountFloat < 0.0001) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid bet amount (minimum 0.0001 EDU)",
        variant: "destructive",
      });
      return;
    }

    // Validate duration
    if (durationError) {
      toast({
        title: "Invalid duration",
        description: durationError,
        variant: "destructive",
      });
      return;
    }

    // Warn about high-risk bets
    if (riskLevel === 'HIGH' && !showAntiCheatWarning) {
      toast({
        title: "High-risk bet detected",
        description: "This extremely aggressive timeline will be closely monitored for cheating. Proceed with caution.",
        variant: "destructive",
      });
    }

    try {
      const stakeWei = eduToWei(betAmount);
      
      await writeContract({
        address: process.env.NEXT_PUBLIC_LEARNING_BETS_CONTRACT,
        abi: LEARNING_BETS_ABI,
        functionName: 'placeBet',
        args: [
          BigInt(Math.floor(aiEstimatedTime)),
          BigInt(Math.floor(challengeTime)),
          courseId
        ],
        value: stakeWei,
      });

      toast({
        title: "Bet placed!",
        description: `You've wagered ${betAmount} EDU on completing this course in ${formatTime(challengeTime)}`,
      });

      if (onBetPlaced) {
        onBetPlaced({
          amount: betAmount,
          challengeTime,
          multiplier,
          potentialWinning
        });
      }
    } catch (err) {
      console.error('Error placing bet:', err);
      toast({
        title: "Transaction failed",
        description: err.message || "Failed to place bet",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all';
      case 'MEDIUM': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all';
      case 'LOW': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all';
      case 'INVALID': return 'bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-lg hover:shadow-xl transition-all';
    }
  };

  return (
    <div className="w-full mx-auto">
      <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl">
        <CardHeader className="bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 border-b border-gray-100 dark:border-slate-600">
          <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold">Learning Performance Bet</div>
              <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1">
                Wager on your commitment to complete this learning plan within your target time
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 bg-white dark:bg-slate-900">
          {/* Wallet Connection and Balance */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-1">
                  <ConnectButton />
                </div>
              </div>
            </div>
          
            {isConnected && balance && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg shadow-md">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">Your Balance</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {parseFloat(balance.formatted).toFixed(4)} 
                      <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400 ml-1">{balance.symbol}</span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Available for betting
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {isConnected && (
          <>
            {/* AI Time vs Challenge Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-slate-400 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center shadow-lg">
                  <div className="inline-flex p-3 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg shadow-md mb-4">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">AI Estimated Time</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatTime(aiEstimatedTime)}</p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center shadow-lg">
                  <div className="inline-flex p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Your Challenge</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatTime(challengeTime)}</p>
                </div>
              </div>
            </div>

            {/* Dynamic Challenge Time Selection */}
            <div className="mt-6">
              <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Challenge Duration: {formatTime(challengeTime)}
              </label>
              
              <div className="space-y-3">
                <Slider
                  value={[challengeTime]}
                  onValueChange={(value) => setChallengeTime(value[0])}
                  min={minAllowedDuration}
                  max={maxAllowedDuration}
                  step={Math.max(1, (maxAllowedDuration - minAllowedDuration) / 100)}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: {formatTime(minAllowedDuration)}</span>
                  <span>AI: {formatTime(aiEstimatedTime)}</span>
                  <span>Max: {formatTime(maxAllowedDuration)}</span>
                </div>
                
                {durationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{durationError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setChallengeTime(aiEstimatedTime * 0.5)}
                    className="text-xs"
                  >
                    50% faster
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setChallengeTime(aiEstimatedTime * 0.75)}
                    className="text-xs"
                  >
                    25% faster
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setChallengeTime(aiEstimatedTime)}
                    className="text-xs"
                  >
                    Same time
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {challengeTime < aiEstimatedTime 
                  ? `${(((aiEstimatedTime - challengeTime) / aiEstimatedTime) * 100).toFixed(1)}% faster than AI estimate`
                  : challengeTime > aiEstimatedTime 
                    ? `${(((challengeTime - aiEstimatedTime) / aiEstimatedTime) * 100).toFixed(1)}% slower than AI estimate`
                    : 'Same as AI estimate'
                }
              </p>
            </div>

            {/* Bet Amount Input with Balance Check */}
            <div className="mt-6">
              <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                <span>Stake Amount (EDU)</span>
                {balance && (
                  <span className="text-xs text-muted-foreground">
                    Max: {parseFloat(balance.formatted).toFixed(4)} EDU
                  </span>
                )}
              </label>
              <div className="space-y-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="0.0001"
                  max={balance ? balance.formatted : "0.1"}
                  step="0.0001"
                  placeholder="0.001"
                  className={parseFloat(betAmount) > (balance ? parseFloat(balance.formatted) : 0) ? 'border-red-500' : ''}
                />
                
                {/* Balance Warning */}
                {balance && parseFloat(betAmount) > parseFloat(balance.formatted) && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You have {parseFloat(balance.formatted).toFixed(4)} EDU
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setBetAmount('0.0001')}
                    className="text-xs"
                  >
                    0.0001 EDU
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setBetAmount('0.001')}
                    className="text-xs"
                  >
                    0.001 EDU
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setBetAmount('0.005')}
                    className="text-xs"
                  >
                    0.005 EDU
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setBetAmount('0.01')}
                    className="text-xs"
                  >
                    0.01 EDU
                  </Button>
                  {balance && parseFloat(balance.formatted) > 0.01 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBetAmount((parseFloat(balance.formatted) * 0.5).toFixed(4))}
                      className="text-xs"
                    >
                      50% Balance
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum: 0.0001 EDU • Maximum: Your balance
                </p>
              </div>
            </div>

            {/* Anti-Cheat Warning for High-Risk Bets */}
            {showAntiCheatWarning && (
              <Alert variant="destructive" className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">⚠️ High-Risk Bet Detected</p>
                    <p className="text-sm">
                      This extremely aggressive timeline will be closely monitored by our anti-cheat system:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li><Eye className="h-3 w-3 inline mr-1" />Real-time video engagement tracking</li>
                      <li><UserX className="h-3 w-3 inline mr-1" />AI-powered cheating detection</li>
                      <li><Shield className="h-3 w-3 inline mr-1" />Manual review for suspicious activity</li>
                    </ul>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Violations result in immediate bet forfeiture and account penalties.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Risk Assessment */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Risk Level</span>
              </div>
              <Badge className={getRiskColor(riskLevel)}>
                {riskLevel === 'INVALID' ? 'INVALID DURATION' : riskLevel}
              </Badge>
            </div>

            {/* Multiplier and Rewards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-6">
              <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
                <Zap className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <p className="text-xs text-muted-foreground">Multiplier</p>
                <p className="font-bold text-purple-600">{multiplier.toFixed(2)}x</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
                <Coins className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs text-muted-foreground">Potential Win</p>
                <p className="font-bold text-green-600">{potentialWinning.toFixed(4)} EDU</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className="font-bold text-green-600">+{(potentialWinning - parseFloat(betAmount)).toFixed(4)} EDU</p>
              </div>
            </div>

            {/* Calculation Details Button */}
            <div className="text-center mt-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                className="text-xs"
              >
                <Calculator className="h-4 w-4 mr-1" />
                {showCalculationDetails ? 'Hide' : 'Show'} Calculation Details
              </Button>
            </div>

            {/* Detailed Calculation Breakdown */}
            {showCalculationDetails && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm mt-6">
                <h4 className="font-medium mb-2">💡 Payout Calculation:</h4>
                <div className="space-y-1 text-xs">
                  <p>• Base Stake: {parseFloat(betAmount).toFixed(4)} EDU</p>
                  <p>• AI Estimated Time: {(aiEstimatedTime / 3600).toFixed(2)} hours</p>
                  <p>• Your Challenge Time: {(challengeTime / 3600).toFixed(2)} hours</p>
                  <p>• Time Improvement: {(((aiEstimatedTime - challengeTime) / aiEstimatedTime) * 100).toFixed(1)}%</p>
                  <p>• Course Difficulty: {courseDifficulty.toFixed(1)}x</p>
                  <p>• Risk Multiplier: {multiplier.toFixed(2)}x</p>
                  <hr className="my-2" />
                  <p className="font-medium">• Total Payout: {parseFloat(betAmount).toFixed(4)} × {multiplier.toFixed(2)} = <span className="text-green-600">{potentialWinning.toFixed(4)} EDU</span></p>
                  <p className="font-medium">• Your Profit: <span className="text-green-600">+{(potentialWinning - parseFloat(betAmount)).toFixed(4)} EDU</span></p>
                </div>
              </div>
            )}

            {/* Progress Bar for Time Challenge */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Time Challenge Progress</span>
                <span>{((aiEstimatedTime - challengeTime) / aiEstimatedTime * 100).toFixed(1)}% faster</span>
              </div>
              <Progress 
                value={((aiEstimatedTime - challengeTime) / aiEstimatedTime * 100)} 
                className="h-2"
              />
            </div>

            {/* Terms and Action */}
            <div className="space-y-6 mt-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Betting Terms & Anti-Cheat Rules</h4>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Complete the course within your challenge time to win</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Must watch at least 75% of each video with quality engagement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Anti-cheat system monitors your learning progress in real-time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><span className="font-semibold text-red-600 dark:text-red-400">Violations:</span> Speed watching, tab switching, external help = zero payout</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><span className="font-semibold text-red-600 dark:text-red-400">Penalties:</span> Multiple violations result in temporary betting suspension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Rewards are automatically distributed upon verified completion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Duration limits: {formatTime(minAllowedDuration)} to {formatTime(maxAllowedDuration)}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={handlePlaceBet}
                disabled={
                  !isConnected || 
                  isPending || 
                  isConfirming || 
                  parseFloat(betAmount) < 0.0001 ||
                  riskLevel === 'INVALID' ||
                  (balance && parseFloat(betAmount) > parseFloat(balance.formatted)) ||
                  !!durationError
                }
                className="w-full"
                size="lg"
              >
                {isPending ? 'Confirming...' : 
                 isConfirming ? 'Processing...' : 
                 riskLevel === 'INVALID' ? 'Invalid Duration' :
                 (balance && parseFloat(betAmount) > parseFloat(balance.formatted)) ? 'Insufficient Balance' :
                 `Place Bet: ${betAmount} EDU`}
              </Button>

              {error && (
                <p className="text-sm text-red-600 text-center">
                  {error.message}
                </p>
              )}

              {isConfirmed && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl blur opacity-25"></div>
                  <div className="relative bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-600 rounded-xl p-6 text-center shadow-lg">
                    <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md mb-4">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">🎉 Bet Placed Successfully!</p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Start your learning challenge now. Good luck! 🍀
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
