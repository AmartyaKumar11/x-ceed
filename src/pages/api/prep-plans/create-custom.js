import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      jobId,
      customPlan,
      overwriteExisting = false
    } = req.body;

    if (!jobId || !customPlan) {
      return res.status(400).json({ message: 'Missing required fields: jobId and customPlan' });
    }

    console.log('🎯 Creating custom prep plan:', {
      userId: auth.user.userId,
      jobId,
      duration: customPlan.duration,
      totalVideos: customPlan.totalVideos,
      totalHours: customPlan.totalHours
    });

    const db = await getDatabase();

    // Check if user already has a prep plan for this job
    const existingPlan = await db.collection('prepPlans').findOne({
      userId: auth.user.userId,
      jobId: jobId
    });

    if (existingPlan && !overwriteExisting) {
      return res.status(409).json({
        message: 'Prep plan already exists for this job',
        existingPlan: existingPlan
      });
    }

    // Get job details for the prep plan
    let jobData;
    try {
      jobData = await db.collection('jobs').findOne({ _id: new ObjectId(jobId) });
    } catch (jobError) {
      // If job not found in jobs collection, try to get from request
      console.log('Job not found in database, using provided data');
      jobData = customPlan.jobData || {
        title: 'Custom Job',
        company: 'Unknown Company',
        description: 'Custom job description'
      };
    }

    // Create the enhanced prep plan document with custom video selections
    const prepPlanDoc = {
      userId: auth.user.userId,
      jobId: jobId,
      jobTitle: jobData?.title || customPlan.jobTitle || 'Custom Learning Plan',
      companyName: jobData?.company || jobData?.companyName || 'Custom Company',
      jobDescription: jobData?.description || 'Custom job description',
      location: jobData?.location || 'Remote',
      jobType: jobData?.jobType || 'full-time',
      salaryRange: jobData?.salaryRange || jobData?.salary || 'Competitive',
      
      // Custom plan specific fields
      type: 'custom',
      duration: customPlan.duration,
      totalVideos: customPlan.totalVideos,
      totalHours: customPlan.totalHours,
      dailyCommitment: customPlan.dailyCommitment,
      intensity: customPlan.intensity,
      feasible: customPlan.feasible,
      
      // Video selections and timeline
      selectedVideos: customPlan.selectedVideos,
      weeklyDistribution: customPlan.weeklyDistribution,
      customSettings: customPlan.settings,
      skills: customPlan.skills,

      // Enhanced plan with video-based learning path
      detailedPlan: {
        planType: 'video-based-custom',
        planMetadata: {
          duration: customPlan.duration,
          approach: customPlan.intensity.level.toLowerCase(),
          totalEstimatedHours: customPlan.totalHours,
          weeklyHours: customPlan.dailyCommitment * 7,
          difficultyLevel: customPlan.intensity.level.toLowerCase(),
          customization: 'user-selected-videos'
        },
        
        // Skills gap analysis (if available)
        gapAnalysis: {
          targetSkills: customPlan.skills,
          learningApproach: 'video-based-progressive',
          customTimeline: true,
          userPreferences: customPlan.settings
        },

        // Video-based learning topics
        personalizedTopics: customPlan.skills.map(skill => ({
          topicName: `Master ${skill}`,
          whyNeeded: 'User-selected skill for targeted learning',
          currentLevel: 'Beginner-Intermediate',
          targetLevel: 'Proficient',
          studyHours: Math.ceil(customPlan.totalHours / customPlan.skills.length),
          contentType: 'user-curated-videos',
          selectedVideos: customPlan.selectedVideos[skill] || [],
          videoCount: (customPlan.selectedVideos[skill] || []).length
        })),

        // Week-by-week progression based on video distribution
        weeklyProgression: customPlan.weeklyDistribution.reduce((acc, week) => {
          acc[`week${week.week}`] = {
            focus: `${week.focus} - ${week.skills.join(', ')}`,
            videos: week.videos,
            estimatedHours: Math.round(week.studyTime / 60 * 10) / 10,
            skills: week.skills,
            milestones: [`Complete ${week.videos.length} videos`, `Practice ${week.focus.toLowerCase()} concepts`],
            dailyCommitment: `${Math.round(week.studyTime / 60 / 7 * 10) / 10} hours/day`
          };
          return acc;
        }, {}),

        // Enhanced learning path with video content
        enhancedLearningPath: {
          totalWeeks: customPlan.duration,
          weeklySchedule: customPlan.weeklyDistribution.map(week => ({
            week: week.week,
            skill: week.skills.join(' + '),
            focus: week.focus,
            videos: week.videos.map(video => ({
              id: video.id,
              title: video.title,
              url: video.url || `https://youtube.com/watch?v=${video.id}`,
              duration: parseDurationToMinutes(video.duration),
              channelTitle: video.channelTitle,
              estimatedCompletionTime: Math.round(parseDurationToMinutes(video.duration) * customPlan.settings.practiceMultiplier)
            })),
            estimatedHours: Math.round(week.studyTime / 60 * 10) / 10,
            milestones: [`Complete Week ${week.week} videos`, `Practice ${week.focus}`],
            completionCriteria: {
              videosToComplete: week.videos.length,
              minimumWatchPercentage: 85,
              practiceRequired: true,
              weeklyAssessment: true
            }
          })),
          estimatedTotalHours: customPlan.totalHours,
          totalVideos: customPlan.totalVideos,
          approach: customPlan.intensity.level.toLowerCase(),
          customization: 'full'
        },

        // Curated content metadata
        curatedContent: customPlan.selectedVideos,
        contentMetadata: {
          totalVideos: customPlan.totalVideos,
          skillsCovered: customPlan.skills.length,
          contentType: 'user-curated',
          difficulty: customPlan.intensity.level.toLowerCase(),
          customizationLevel: 'complete',
          curatedAt: new Date().toISOString(),
          source: 'user-selection'
        }
      },

      // Standard fields
      status: 'active',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'custom-video-selection'
    };

    // Save or update the prep plan
    let result;
    if (existingPlan && overwriteExisting) {
      result = await db.collection('prepPlans').replaceOne(
        { _id: existingPlan._id },
        prepPlanDoc
      );
      console.log('✅ Custom prep plan updated successfully');
    } else {
      result = await db.collection('prepPlans').insertOne(prepPlanDoc);
      console.log('✅ Custom prep plan created successfully');
    }

    return res.status(201).json({
      message: 'Custom prep plan created successfully',
      data: {
        prepPlanId: result.insertedId || existingPlan._id,
        ...prepPlanDoc
      }
    });

  } catch (error) {
    console.error('❌ Error creating custom prep plan:', error);
    return res.status(500).json({
      message: 'Failed to create custom prep plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Helper function to parse video duration to minutes
function parseDurationToMinutes(duration) {
  if (!duration) return 0;
  
  // Handle MM:SS format
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
    }
  }
  
  // Handle ISO 8601 format (PT12M34S)
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      return hours * 60 + minutes + seconds / 60;
    }
  }
  
  // Handle numeric minutes
  if (typeof duration === 'number') {
    return duration;
  }
  
  return 0;
}
