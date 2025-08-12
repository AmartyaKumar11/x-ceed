import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { payoutCalculator } from '../../../lib/payoutCalculator';

/**
 * API endpoint for calculating dynamic payouts
 */

async function handler(req, res) {
  if (req.method === 'POST') {
    return await calculatePayout(req, res);
  } else if (req.method === 'GET') {
    return await getPayoutScenarios(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

/**
 * Calculate payout for a specific learning plan
 */
async function calculatePayout(req, res) {
  try {
    const { userId } = req.user;
    const {
      prepPlanId,
      timeline,
      contentDifficulty,
      userSkillLevel,
      customizations = 0,
      stakeAmount = 100 // Virtual currency amount
    } = req.body;

    if (!prepPlanId || !timeline || !contentDifficulty || !userSkillLevel) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: prepPlanId, timeline, contentDifficulty, userSkillLevel'
      });
    }

    const db = await getDatabase();

    // Get user's learning history
    const userHistory = await getUserLearningHistory(db, userId);

    // Get current market conditions
    const marketConditions = await getMarketConditions(db);

    // Calculate payout
    const payoutResult = payoutCalculator.calculatePayout({
      timeline,
      contentDifficulty,
      userSkillLevel,
      userHistory,
      marketConditions,
      customizations
    });

    // Calculate potential winnings
    const potentialWinnings = {
      conservative: Math.round(stakeAmount * payoutResult.estimatedReturn.conservative),
      expected: Math.round(stakeAmount * payoutResult.finalMultiplier),
      optimistic: Math.round(stakeAmount * payoutResult.estimatedReturn.optimistic)
    };

    // Save calculation to database for tracking
    await db.collection('payoutCalculations').insertOne({
      userId: new ObjectId(userId),
      prepPlanId: new ObjectId(prepPlanId),
      calculationParams: {
        timeline,
        contentDifficulty,
        userSkillLevel,
        customizations,
        stakeAmount
      },
      payoutResult,
      potentialWinnings,
      calculatedAt: new Date(),
      isDemo: true // Mark as demo mode
    });

    return res.status(200).json({
      success: true,
      data: {
        ...payoutResult,
        potentialWinnings,
        stakeAmount,
        calculationId: new ObjectId().toString(),
        demoMode: true,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error calculating payout:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate payout',
      error: error.message
    });
  }
}

/**
 * Get payout scenarios for comparison
 */
async function getPayoutScenarios(req, res) {
  try {
    const { userId } = req.user;
    const {
      timeline,
      contentDifficulty,
      userSkillLevel,
      customizations = 0
    } = req.query;

    if (!timeline || !contentDifficulty || !userSkillLevel) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters'
      });
    }

    const db = await getDatabase();

    // Get user's learning history
    const userHistory = await getUserLearningHistory(db, userId);

    // Get current market conditions
    const marketConditions = await getMarketConditions(db);

    const baseParams = {
      timeline: parseInt(timeline),
      contentDifficulty: parseFloat(contentDifficulty),
      userSkillLevel: parseFloat(userSkillLevel),
      userHistory,
      marketConditions,
      customizations: parseInt(customizations)
    };

    // Generate scenarios
    const scenarios = payoutCalculator.simulateScenarios(baseParams);

    return res.status(200).json({
      success: true,
      data: {
        scenarios,
        baseParams,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating payout scenarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate payout scenarios',
      error: error.message
    });
  }
}

/**
 * Get user's learning history for risk assessment
 */
async function getUserLearningHistory(db, userId) {
  try {
    // Get completed prep plans
    const completedPlans = await db.collection('prepPlans').find({
      userId: new ObjectId(userId),
      status: { $in: ['completed', 'failed'] }
    }).toArray();

    if (completedPlans.length === 0) {
      return null; // New user
    }

    // Calculate statistics
    const totalAttempts = completedPlans.length;
    const completedCount = completedPlans.filter(plan => plan.status === 'completed').length;
    const completionRate = completedCount / totalAttempts;

    // Calculate average score (mock data for now)
    const averageScore = completedPlans.reduce((sum, plan) => {
      return sum + (plan.finalScore || 0.75); // Default to 75% if no score
    }, 0) / totalAttempts;

    // Calculate current streak
    let streakLength = 0;
    for (let i = completedPlans.length - 1; i >= 0; i--) {
      if (completedPlans[i].status === 'completed') {
        streakLength++;
      } else {
        break;
      }
    }

    return {
      completionRate,
      averageScore,
      totalAttempts,
      streakLength,
      lastActivity: completedPlans[completedPlans.length - 1]?.updatedAt || new Date()
    };

  } catch (error) {
    console.error('Error getting user learning history:', error);
    return null;
  }
}

/**
 * Get current market conditions for payout adjustment
 */
async function getMarketConditions(db) {
  try {
    // Get platform statistics (mock data for demo)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent activity
    const recentPlans = await db.collection('prepPlans').countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    const recentCompletions = await db.collection('prepPlans').countDocuments({
      status: 'completed',
      updatedAt: { $gte: oneWeekAgo }
    });

    // Calculate metrics (with some mock data for demo)
    const platformUtilization = Math.min(1.0, recentPlans / 100); // Normalize to 0-1
    const averageCompletionRate = recentPlans > 0 ? recentCompletions / recentPlans : 0.7;
    const rewardPoolHealth = 0.8; // Mock: 80% healthy
    const demandSupplyRatio = 1.0; // Mock: balanced

    return {
      platformUtilization,
      rewardPoolHealth,
      averageCompletionRate,
      demandSupplyRatio,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Error getting market conditions:', error);
    // Return default conditions
    return {
      platformUtilization: 0.5,
      rewardPoolHealth: 0.8,
      averageCompletionRate: 0.7,
      demandSupplyRatio: 1.0,
      lastUpdated: new Date()
    };
  }
}

export default authMiddleware(handler);