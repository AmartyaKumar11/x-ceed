/**
 * Testing utilities for the betting system
 * Provides development mode overrides and testing features
 */

// Check if we're in development mode
export const isDevelopmentMode = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development' || 
           process.env.NEXT_PUBLIC_ENABLE_DEV_MODE === 'true';
  }
  return false;
};

// Calculate a "break-even" quality score that returns exactly the bet amount
export const calculateBreakEvenScore = (betAmount, aiEstimatedTime, challengeTime) => {
  // For break-even, we need a quality score that results in 1.0x multiplier
  // This means no time bonus, no quality bonus, just return the original bet amount
  
  const baseMultiplier = calculateBaseMultiplier(aiEstimatedTime, challengeTime);
  
  // If the time-based multiplier is already close to 1.0, use a moderate score
  if (baseMultiplier <= 1.1) {
    return 70; // Decent score but no quality bonus
  }
  
  // If time-based multiplier is higher, we need a lower quality score to offset it
  // We want: (baseMultiplier * qualityMultiplier) ≈ 1.0
  const targetQualityMultiplier = 1.0 / baseMultiplier;
  
  // Quality multiplier formula: score >= 80 ? 1.1 : 1.0
  // So we need score < 80 to get 1.0x quality multiplier
  // Then adjust for platform fee (5%) to still get break-even
  
  if (targetQualityMultiplier >= 0.95) {
    return 75; // Good score but below bonus threshold
  } else {
    return 65; // Lower score to offset high time multiplier
  }
};

// Calculate base time multiplier (same logic as in your betting system)
const calculateBaseMultiplier = (aiEstimatedTime, challengeTime) => {
  if (challengeTime >= aiEstimatedTime) {
    return 1.0; // No bonus for same or longer time
  }
  
  const timeReduction = ((aiEstimatedTime - challengeTime) * 100) / aiEstimatedTime;
  
  if (timeReduction >= 50) {
    return 3.0;
  } else if (timeReduction >= 30) {
    return 2.0 + (timeReduction - 30) * 0.05;
  } else if (timeReduction >= 15) {
    return 1.5 + (timeReduction - 15) * 0.033;
  } else {
    return 1.05 + timeReduction * 0.03;
  }
};

// Generate mock completion data for testing that results in break-even payout
export const generateBreakEvenCompletionData = (betAmount, aiEstimatedTime, challengeTime) => {
  const qualityScore = calculateBreakEvenScore(betAmount, aiEstimatedTime, challengeTime);
  
  return {
    totalWatchTime: challengeTime * 60, // Convert to seconds
    actualProgress: 100, // Fully watched
    watchedSegments: new Set(Array.from({length: Math.floor(challengeTime * 60)}, (_, i) => i)),
    playbackSpeed: 1.0,
    averageSpeed: 1.0,
    focusTime: challengeTime * 60 * 0.95, // 95% focus time
    blurTime: challengeTime * 60 * 0.05, // 5% blur time
    seekCount: 2, // Minimal seeking
    pauseCount: 3, // Minimal pausing
    isEligibleForCompletion: true,
    qualityScore: qualityScore,
    forceCompleted: true,
    devModeBreakEven: true, // Flag to indicate this is a dev mode break-even
    completedAt: new Date().toISOString(),
    warnings: [], // No warnings
    watchHistory: [
      {
        timestamp: Date.now() - (challengeTime * 60 * 1000),
        duration: challengeTime * 60,
        startPos: 0,
        endPos: challengeTime * 60,
        speed: 1.0
      }
    ]
  };
};

// Test different scenarios
export const getTestScenarios = () => {
  return {
    breakEven: {
      name: "Break Even (Dev)",
      description: "Returns exactly your bet amount - no profit, no loss",
      qualityScoreRange: [65, 75],
      expectedMultiplier: "~1.0x",
      expectedProfit: "0 EDU"
    },
    smallProfit: {
      name: "Small Profit Test",
      description: "Small profit for testing positive outcomes",
      qualityScoreRange: [80, 85],
      expectedMultiplier: "~1.1-1.3x",
      expectedProfit: "0.0001-0.003 EDU"
    },
    smallLoss: {
      name: "Small Loss Test", 
      description: "Small loss for testing penalty scenarios",
      qualityScoreRange: [45, 59],
      expectedMultiplier: "~0.8-0.9x",
      expectedProfit: "-0.0001--0.002 EDU"
    },
    highQuality: {
      name: "High Quality Test",
      description: "Perfect completion with bonus",
      qualityScoreRange: [90, 100],
      expectedMultiplier: "Full + 50% bonus",
      expectedProfit: "Maximum possible"
    }
  };
};

// Create test completion data for specific scenarios
export const generateTestCompletionData = (scenario, betAmount, aiEstimatedTime, challengeTime) => {
  const scenarios = getTestScenarios();
  const config = scenarios[scenario];
  
  if (!config) {
    return generateBreakEvenCompletionData(betAmount, aiEstimatedTime, challengeTime);
  }
  
  const [minScore, maxScore] = config.qualityScoreRange;
  const qualityScore = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
  
  let focusTimeRatio, seekCount, pauseCount;
  
  // Adjust metrics based on quality score
  if (qualityScore >= 90) {
    focusTimeRatio = 0.98;
    seekCount = 1;
    pauseCount = 1;
  } else if (qualityScore >= 80) {
    focusTimeRatio = 0.90;
    seekCount = 2;
    pauseCount = 2;
  } else if (qualityScore >= 60) {
    focusTimeRatio = 0.80;
    seekCount = 4;
    pauseCount = 5;
  } else {
    focusTimeRatio = 0.65;
    seekCount = 8;
    pauseCount = 10;
  }
  
  return {
    totalWatchTime: challengeTime * 60,
    actualProgress: 100,
    watchedSegments: new Set(Array.from({length: Math.floor(challengeTime * 60)}, (_, i) => i)),
    playbackSpeed: 1.0,
    averageSpeed: 1.0,
    focusTime: challengeTime * 60 * focusTimeRatio,
    blurTime: challengeTime * 60 * (1 - focusTimeRatio),
    seekCount,
    pauseCount,
    isEligibleForCompletion: true,
    qualityScore,
    forceCompleted: true,
    testScenario: scenario,
    completedAt: new Date().toISOString(),
    warnings: [],
    watchHistory: [
      {
        timestamp: Date.now() - (challengeTime * 60 * 1000),
        duration: challengeTime * 60,
        startPos: 0,
        endPos: challengeTime * 60,
        speed: 1.0
      }
    ]
  };
};

// Validate if a completion should result in break-even payout
export const shouldPayoutBreakEven = (completionData) => {
  return completionData.devModeBreakEven || 
         completionData.testScenario === 'breakEven' ||
         (completionData.forceCompleted && isDevelopmentMode());
};

// Calculate expected payout for testing
export const calculateTestPayout = (betAmount, completionData, aiEstimatedTime, challengeTime) => {
  if (shouldPayoutBreakEven(completionData)) {
    const betAmountFloat = parseFloat(betAmount);
    return {
      basePayout: betAmountFloat,
      qualityBonus: 1.0,
      platformFee: 0, // Waived for testing
      finalPayout: betAmountFloat,
      multiplier: 1.0,
      timeReduction: ((aiEstimatedTime - challengeTime) / aiEstimatedTime) * 100,
      roi: 0, // Break even = 0% ROI
      profit: 0,
      isTestMode: true,
      testScenario: 'breakEven'
    };
  }
  
  // Use normal calculation for other scenarios
  return null; // Fall back to normal calculation
};

export default {
  isDevelopmentMode,
  calculateBreakEvenScore,
  generateBreakEvenCompletionData,
  generateTestCompletionData,
  getTestScenarios,
  shouldPayoutBreakEven,
  calculateTestPayout
};
