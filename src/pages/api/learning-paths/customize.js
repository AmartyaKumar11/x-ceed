import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { youtubeContentCurator } from '../../../lib/youtubeContentCurator';

/**
 * API endpoint for customizing learning paths
 * Allows users to view AI recommendations, substitute content, and validate custom paths
 */

async function handler(req, res) {
  if (req.method === 'GET') {
    return await getContentRecommendations(req, res);
  } else if (req.method === 'POST') {
    return await customizeLearningPath(req, res);
  } else if (req.method === 'PUT') {
    return await validateCustomPath(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

/**
 * Get AI-recommended content with detailed reviews and ratings
 */
async function getContentRecommendations(req, res) {
  try {
    const { skill, difficulty = 'intermediate', contentType = 'structured-course', limit = 10 } = req.query;
    
    if (!skill) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill parameter is required' 
      });
    }

    console.log(`🔍 Getting content recommendations for: ${skill}`);

    // Get curated content from YouTube
    const curatedContent = await youtubeContentCurator.searchEducationalContent(
      skill,
      difficulty,
      contentType,
      parseInt(limit)
    );

    // Enhance with additional metadata for user decision-making
    const enhancedContent = curatedContent.map(content => ({
      ...content,
      // Add user-friendly metadata
      metadata: {
        qualityRating: calculateQualityRating(content.qualityScore),
        difficultyLevel: assessDifficultyLevel(content.difficultyScore),
        recommendationReason: generateRecommendationReason(content, skill),
        estimatedLearningTime: content.estimatedCompletionTime,
        prerequisites: extractPrerequisites(content, skill),
        learningOutcomes: generateLearningOutcomes(content, skill)
      },
      // User interaction data (would come from database in real implementation)
      userStats: {
        completionRate: Math.floor(Math.random() * 40) + 60, // Mock data: 60-100%
        averageRating: (Math.random() * 2 + 3).toFixed(1), // Mock data: 3.0-5.0
        totalReviews: Math.floor(Math.random() * 500) + 50, // Mock data: 50-550
        recommendedBy: Math.floor(Math.random() * 80) + 20 // Mock data: 20-100%
      }
    }));

    return res.status(200).json({
      success: true,
      data: {
        skill,
        difficulty,
        contentType,
        recommendations: enhancedContent,
        totalFound: enhancedContent.length,
        searchMetadata: {
          searchedAt: new Date().toISOString(),
          qualityThreshold: 70,
          relevanceThreshold: 80
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting content recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get content recommendations',
      error: error.message
    });
  }
}

/**
 * Customize learning path by substituting content
 */
async function customizeLearningPath(req, res) {
  try {
    const { userId } = req.user;
    const { 
      prepPlanId, 
      skillId, 
      originalContentId, 
      newContentId, 
      newContentData,
      customizationReason 
    } = req.body;

    if (!prepPlanId || !skillId || !newContentId || !newContentData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: prepPlanId, skillId, newContentId, newContentData'
      });
    }

    const db = await getDatabase();
    
    // Get the current prep plan
    const prepPlan = await db.collection('prepPlans').findOne({
      _id: new ObjectId(prepPlanId),
      userId: new ObjectId(userId)
    });

    if (!prepPlan) {
      return res.status(404).json({
        success: false,
        message: 'Prep plan not found'
      });
    }

    // Validate the new content meets learning objectives
    const validationResult = await validateContentSubstitution(
      prepPlan,
      skillId,
      originalContentId,
      newContentData
    );

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Content substitution validation failed',
        validationErrors: validationResult.errors
      });
    }

    // Create customization record
    const customization = {
      id: new ObjectId().toString(),
      skillId,
      originalContentId,
      newContentId,
      newContentData,
      customizationReason: customizationReason || 'User preference',
      validationResult,
      createdAt: new Date(),
      userId: new ObjectId(userId)
    };

    // Update prep plan with customization
    const updateResult = await db.collection('prepPlans').updateOne(
      { _id: new ObjectId(prepPlanId) },
      {
        $push: {
          'customizations': customization
        },
        $set: {
          'lastModified': new Date(),
          'isCustomized': true
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save customization'
      });
    }

    // Recalculate difficulty and payout multiplier
    const recalculationResult = await recalculatePlanDifficulty(prepPlanId, userId);

    return res.status(200).json({
      success: true,
      data: {
        customization,
        validationResult,
        recalculationResult,
        message: 'Learning path customized successfully'
      }
    });

  } catch (error) {
    console.error('❌ Error customizing learning path:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to customize learning path',
      error: error.message
    });
  }
}

/**
 * Validate custom learning path covers required objectives
 */
async function validateCustomPath(req, res) {
  try {
    const { userId } = req.user;
    const { prepPlanId, customizedContent } = req.body;

    if (!prepPlanId || !customizedContent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: prepPlanId, customizedContent'
      });
    }

    const db = await getDatabase();
    
    // Get the original prep plan
    const prepPlan = await db.collection('prepPlans').findOne({
      _id: new ObjectId(prepPlanId),
      userId: new ObjectId(userId)
    });

    if (!prepPlan) {
      return res.status(404).json({
        success: false,
        message: 'Prep plan not found'
      });
    }

    // Validate the entire custom path
    const validationResult = await validateEntireLearningPath(
      prepPlan,
      customizedContent
    );

    return res.status(200).json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        validationDetails: validationResult,
        recommendations: validationResult.recommendations || [],
        coverageAnalysis: validationResult.coverageAnalysis || {}
      }
    });

  } catch (error) {
    console.error('❌ Error validating custom path:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate custom path',
      error: error.message
    });
  }
}

/**
 * Helper Functions
 */

function calculateQualityRating(qualityScore) {
  if (qualityScore >= 90) return 'Excellent';
  if (qualityScore >= 80) return 'Very Good';
  if (qualityScore >= 70) return 'Good';
  if (qualityScore >= 60) return 'Fair';
  return 'Poor';
}

function assessDifficultyLevel(difficultyScore) {
  if (difficultyScore >= 90) return 'Perfect Match';
  if (difficultyScore >= 80) return 'Good Match';
  if (difficultyScore >= 70) return 'Acceptable';
  return 'May Not Match';
}

function generateRecommendationReason(content, skill) {
  const reasons = [];
  
  if (content.qualityScore >= 85) {
    reasons.push('High quality content');
  }
  
  if (content.relevanceScore >= 90) {
    reasons.push(`Highly relevant to ${skill}`);
  }
  
  if (content.qualityIndicators.includes('Educational Channel')) {
    reasons.push('From trusted educational source');
  }
  
  if (content.viewCount > 100000) {
    reasons.push('Popular with learners');
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'AI recommended based on content analysis';
}

function extractPrerequisites(content, skill) {
  // This would use AI to analyze content and extract prerequisites
  // For now, return basic prerequisites based on skill
  const skillPrerequisites = {
    'react': ['JavaScript basics', 'HTML/CSS'],
    'node.js': ['JavaScript fundamentals', 'Basic programming concepts'],
    'python': ['Basic programming concepts'],
    'machine learning': ['Python basics', 'Statistics fundamentals', 'Linear algebra'],
    'docker': ['Command line basics', 'Basic networking concepts'],
    'kubernetes': ['Docker knowledge', 'Container concepts', 'Basic networking']
  };
  
  return skillPrerequisites[skill.toLowerCase()] || ['Basic programming knowledge'];
}

function generateLearningOutcomes(content, skill) {
  // Generate expected learning outcomes based on content analysis
  return [
    `Master ${skill} fundamentals`,
    `Build practical projects using ${skill}`,
    `Understand best practices and common patterns`,
    `Prepare for ${skill}-related interview questions`
  ];
}

async function validateContentSubstitution(prepPlan, skillId, originalContentId, newContentData) {
  // Validate that new content covers the same learning objectives
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    difficultyChange: 0,
    estimatedTimeChange: 0
  };

  // Check if new content difficulty is appropriate
  if (newContentData.difficultyScore < 60) {
    validation.warnings.push('New content may be too easy for the learning objective');
  }

  // Check if new content is relevant enough
  if (newContentData.relevanceScore < 70) {
    validation.errors.push('New content relevance is too low for effective learning');
    validation.isValid = false;
  }

  // Check duration appropriateness
  if (newContentData.duration < 5) {
    validation.warnings.push('New content may be too short to cover the topic adequately');
  }

  // Calculate difficulty change impact
  // This would compare with original content in a real implementation
  validation.difficultyChange = Math.random() * 10 - 5; // Mock: -5 to +5 change

  return validation;
}

async function validateEntireLearningPath(prepPlan, customizedContent) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    coverageAnalysis: {},
    recommendations: []
  };

  // Analyze skill coverage
  const requiredSkills = prepPlan.detailedPlan?.gapAnalysis?.missingSkills || [];
  const coveredSkills = Object.keys(customizedContent);
  
  const uncoveredSkills = requiredSkills.filter(skill => 
    !coveredSkills.some(covered => 
      covered.toLowerCase().includes(skill.toLowerCase())
    )
  );

  if (uncoveredSkills.length > 0) {
    validation.warnings.push(`Some required skills may not be fully covered: ${uncoveredSkills.join(', ')}`);
  }

  // Analyze total learning time
  const totalTime = Object.values(customizedContent).reduce((total, skillContent) => {
    return total + (skillContent.reduce((skillTotal, content) => 
      skillTotal + (content.estimatedCompletionTime || 0), 0));
  }, 0);

  validation.coverageAnalysis = {
    totalEstimatedHours: Math.round(totalTime / 60),
    skillsCovered: coveredSkills.length,
    requiredSkills: requiredSkills.length,
    coveragePercentage: Math.round((coveredSkills.length / Math.max(requiredSkills.length, 1)) * 100)
  };

  // Generate recommendations
  if (totalTime < 20 * 60) { // Less than 20 hours
    validation.recommendations.push('Consider adding more comprehensive content for better skill development');
  }

  if (validation.coverageAnalysis.coveragePercentage < 80) {
    validation.recommendations.push('Add content for uncovered skills to improve job readiness');
  }

  return validation;
}

async function recalculatePlanDifficulty(prepPlanId, userId) {
  // Recalculate plan difficulty and payout multiplier after customization
  // This would integrate with the payout calculation system
  
  const recalculation = {
    previousDifficulty: Math.random() * 10, // Mock previous difficulty
    newDifficulty: Math.random() * 10, // Mock new difficulty
    difficultyChange: 0,
    payoutMultiplierChange: 0,
    recalculatedAt: new Date()
  };

  recalculation.difficultyChange = recalculation.newDifficulty - recalculation.previousDifficulty;
  recalculation.payoutMultiplierChange = recalculation.difficultyChange * 0.1; // Mock calculation

  return recalculation;
}

export default authMiddleware(handler);