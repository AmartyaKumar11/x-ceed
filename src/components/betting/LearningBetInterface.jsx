'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Calculator,
  Trophy,
  AlertTriangle,
  Coins
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
  
  const [betAmount, setBetAmount] = useState('0.01');
  const [challengeTime, setChallengeTime] = useState(aiEstimatedTime * 0.8); // 20% faster by default
  const [multiplier, setMultiplier] = useState(1.0);
  const [potentialWinning, setPotentialWinning] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate multiplier and potential winnings when inputs change
  useEffect(() => {
    if (challengeTime < aiEstimatedTime) {
      const newMultiplier = calculateMultiplier(aiEstimatedTime, challengeTime, courseDifficulty);
      setMultiplier(newMultiplier);
      setPotentialWinning(parseFloat(betAmount) * newMultiplier);
      
      // Determine risk level
      if (newMultiplier >= 3.0) {
        setRiskLevel('HIGH');
      } else if (newMultiplier >= 2.0) {
        setRiskLevel('MEDIUM');
      } else {
        setRiskLevel('LOW');
      }
    } else {
      setMultiplier(1.0);
      setPotentialWinning(parseFloat(betAmount));
      setRiskLevel('LOW');
    }
  }, [betAmount, challengeTime, aiEstimatedTime, courseDifficulty]);

  const handlePlaceBet = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place a bet",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
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
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
        {/* Wallet Connection */}
        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {isConnected && (
          <>
            {/* AI Time vs Challenge Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">AI Estimated Time</p>
                <p className="font-bold text-lg">{formatTime(aiEstimatedTime)}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground">Your Challenge</p>
                <p className="font-bold text-lg">{formatTime(challengeTime)}</p>
              </div>
            </div>

            {/* Challenge Time Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Challenge Time (hours)
              </label>
              <Input
                type="number"
                value={challengeTime}
                onChange={(e) => setChallengeTime(parseFloat(e.target.value) || 0)}
                min="0.1"
                max={aiEstimatedTime}
                step="0.1"
                placeholder="Enter your target completion time"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Complete faster than AI estimate to earn higher rewards
              </p>
            </div>

            {/* Bet Amount Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Stake Amount (EDU)
              </label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="0.001"
                max="0.1"
                step="0.001"
                placeholder="0.01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: 0.001 EDU • Maximum: 0.1 EDU
              </p>
            </div>

            {/* Risk Assessment */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Risk Level</span>
              </div>
              <Badge className={getRiskColor(riskLevel)}>
                {riskLevel}
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
              <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded">
                <p className="font-medium mb-1">📋 Betting Terms:</p>
                <ul className="space-y-1">
                  <li>• Complete the course within your challenge time to win</li>
                  <li>• Must watch at least 75% of each video with quality engagement</li>
                  <li>• Anti-cheat system monitors your learning progress</li>
                  <li>• Rewards are automatically distributed upon completion</li>
                </ul>
              </div>

              <Button 
                onClick={handlePlaceBet}
                disabled={!isConnected || isPending || isConfirming || parseFloat(betAmount) <= 0}
                className="w-full"
                size="lg"
              >
                {isPending ? 'Confirming...' : 
                 isConfirming ? 'Processing...' : 
                 `Place Bet: ${betAmount} EDU`}
              </Button>

              {error && (
                <p className="text-sm text-red-600 text-center">
                  {error.message}
                </p>
              )}

              {isConfirmed && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-green-600 font-medium">✅ Bet placed successfully!</p>
                  <p className="text-sm text-muted-foreground">
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
