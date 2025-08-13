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
      case 'HIGH': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700';
      case 'LOW': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700';
      case 'INVALID': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Learning Performance Bet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Wager on your commitment to complete this learning plan within your target time
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Connection and Balance */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <ConnectButton />
          </div>
          
          {isConnected && balance && (
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Your Balance</span>
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Available for betting
              </div>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            {/* AI Time vs Challenge Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-300">AI Estimated Time</p>
                <p className="font-bold text-lg text-blue-900 dark:text-blue-100">{formatTime(aiEstimatedTime)}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-orange-600 dark:text-orange-300">Your Challenge</p>
                <p className="font-bold text-lg text-orange-900 dark:text-orange-100">{formatTime(challengeTime)}</p>
              </div>
            </div>

            {/* Dynamic Challenge Time Selection */}
            <div>
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
            <div>
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
              <Alert variant="destructive">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Risk Level</span>
              </div>
              <Badge className={getRiskColor(riskLevel)}>
                {riskLevel === 'INVALID' ? 'INVALID DURATION' : riskLevel}
              </Badge>
            </div>

            {/* Multiplier and Rewards */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Zap className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <p className="text-xs text-muted-foreground">Multiplier</p>
                <p className="font-bold text-purple-600">{multiplier.toFixed(2)}x</p>
              </div>
              <div>
                <Coins className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs text-muted-foreground">Potential Win</p>
                <p className="font-bold text-green-600">{potentialWinning.toFixed(4)} EDU</p>
              </div>
              <div>
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className="font-bold text-blue-600">+{(potentialWinning - parseFloat(betAmount)).toFixed(4)} EDU</p>
              </div>
            </div>

            {/* Calculation Details Button */}
            <div className="text-center">
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
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
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
                  <p className="font-medium">• Your Profit: <span className="text-blue-600">+{(potentialWinning - parseFloat(betAmount)).toFixed(4)} EDU</span></p>
                </div>
              </div>
            )}

            {/* Progress Bar for Time Challenge */}
            <div>
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
            <div className="space-y-4">
              <div className="text-xs text-blue-700 dark:text-blue-300 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">📋 Betting Terms & Anti-Cheat Rules:</p>
                <ul className="space-y-1">
                  <li>• Complete the course within your challenge time to win</li>
                  <li>• Must watch at least 75% of each video with quality engagement</li>
                  <li>• Anti-cheat system monitors your learning progress in real-time</li>
                  <li>• <span className="font-medium">Violations:</span> Speed watching, tab switching, external help = zero payout</li>
                  <li>• <span className="font-medium">Penalties:</span> Multiple violations result in temporary betting suspension</li>
                  <li>• Rewards are automatically distributed upon verified completion</li>
                  <li>• Duration limits: {formatTime(minAllowedDuration)} to {formatTime(maxAllowedDuration)}</li>
                </ul>
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
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-600 dark:text-green-400 font-medium">✅ Bet placed successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Start your learning challenge now. Good luck! 🍀
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
