import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * API endpoint for saving learning path customizations
 */

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId } = req.user;
    const { prepPlanId, customizations } = req.body;

    if (!prepPlanId || !customizations) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: prepPlanId, customizations'
      });
    }

    const db = await getDatabase();
    
    // Verify prep plan ownership
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

    // Calculate customization statistics
    const customizationStats = calculateCustomizationStats(customizations, prepPlan);

    // Save customizations to prep plan
    const updateResult = await db.collection('prepPlans').updateOne(
      { _id: new ObjectId(prepPlanId) },
      {
        $set: {
          'pathCustomizations': customizations,
          'customizationStats': customizationStats,
          'lastCustomized': new Date(),
          'isCustomized': Object.keys(customizations).length > 0
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save customizations'
      });
    }

    // Log customization activity
    await db.collection('userActivity').insertOne({
      userId: new ObjectId(userId),
      action: 'learning_path_customized',
      prepPlanId: new ObjectId(prepPlanId),
      customizationCount: Object.keys(customizations).length,
      customizationStats,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Customizations saved successfully',
        customizationStats,
        savedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error saving customizations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save customizations',
      error: error.message
    });
  }
}

/**
 * Calculate statistics about the customizations
 */
function calculateCustomizationStats(customizations, prepPlan) {
  const totalTopics = prepPlan.phases?.reduce((total, phase) => 
    total + (phase.topics?.length || 0), 0) || 0;
  
  const customizedTopics = Object.keys(customizations).length;
  
  // Calculate total time change
  let totalTimeChange = 0;
  let totalDifficultyChange = 0;
  let qualityImprovements = 0;
  
  Object.values(customizations).forEach(customization => {
    if (customization.validationResult) {
      totalTimeChange += customization.validationResult.estimatedTimeChange || 0;
      totalDifficultyChange += customization.validationResult.difficultyChange || 0;
    }
    
    if (customization.replacedContent?.qualityScore > 80) {
      qualityImprovements++;
    }
  });

  return {
    totalTopics,
    customizedTopics,
    customizationPercentage: totalTopics > 0 ? Math.round((customizedTopics / totalTopics) * 100) : 0,
    totalTimeChange: Math.round(totalTimeChange),
    averageDifficultyChange: customizedTopics > 0 ? (totalDifficultyChange / customizedTopics).toFixed(2) : 0,
    qualityImprovements,
    lastUpdated: new Date()
  };
}

export default authMiddleware(handler);