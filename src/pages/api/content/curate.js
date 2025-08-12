import { youtubeContentCurator } from '../../../lib/youtubeContentCurator';
import { authMiddleware } from '../../../lib/middleware';

/**
 * Content Curation API Endpoint
 * Finds and ranks educational YouTube content for learning plans
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication (optional for content search)
  const auth = await authMiddleware(req);
  
  try {
    const { 
      skills, 
      difficulty = 'intermediate', 
      contentType = 'structured-course',
      maxResultsPerSkill = 10,
      planDuration = 8 // weeks
    } = req.body;

    console.log('🎯 Content curation request:', {
      skills: Array.isArray(skills) ? skills : [skills],
      difficulty,
      contentType,
      maxResultsPerSkill,
      planDuration,
      userId: auth.isAuthenticated ? auth.user.userId : 'anonymous'
    });

    if (!skills || (Array.isArray(skills) && skills.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skills parameter is required' 
      });
    }

    // Ensure skills is an array
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    
    // Curate content for each skill
    const curatedContent = {};
    const allContent = [];
    
    for (const skill of skillsArray) {
      console.log(`🔍 Curating content for: ${skill}`);
      
      try {
        const skillContent = await youtubeContentCurator.searchEducationalContent(
          skill,
          difficulty,
          contentType,
          maxResultsPerSkill
        );
        
        curatedContent[skill] = skillContent;
        allContent.push(...skillContent.map(content => ({ ...content, skill })));
        
        console.log(`✅ Found ${skillContent.length} videos for ${skill}`);
        
      } catch (skillError) {
        console.error(`❌ Failed to curate content for ${skill}:`, skillError.message);
        curatedContent[skill] = [];
      }
    }

    // Generate learning path recommendations
    const learningPath = generateLearningPath(curatedContent, planDuration, difficulty);
    
    // Calculate content statistics
    const contentStats = calculateContentStats(allContent);

    console.log(`✅ Content curation completed: ${allContent.length} total videos`);

    return res.status(200).json({
      success: true,
      data: {
        curatedContent,
        learningPath,
        contentStats,
        metadata: {
          totalVideos: allContent.length,
          skillsCovered: skillsArray.length,
          difficulty,
          contentType,
          planDuration,
          curatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Content curation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Content curation failed',
      error: error.message
    });
  }
}

/**
 * Generate a structured learning path from curated content
 */
function generateLearningPath(curatedContent, planDuration, difficulty) {
  const learningPath = {
    totalWeeks: planDuration,
    weeklySchedule: [],
    estimatedTotalHours: 0
  };

  const skills = Object.keys(curatedContent);
  const weeksPerSkill = Math.max(1, Math.floor(planDuration / skills.length));
  
  let currentWeek = 1;
  let totalHours = 0;

  for (const skill of skills) {
    const skillVideos = curatedContent[skill];
    if (!skillVideos || skillVideos.length === 0) continue;

    // Select best videos for this skill based on plan duration
    const videosPerWeek = planDuration <= 4 ? 2 : planDuration >= 12 ? 4 : 3;
    const selectedVideos = skillVideos.slice(0, weeksPerSkill * videosPerWeek);
    
    // Distribute videos across weeks for this skill
    for (let week = 0; week < weeksPerSkill && currentWeek <= planDuration; week++) {
      const weekVideos = selectedVideos.slice(
        week * videosPerWeek, 
        (week + 1) * videosPerWeek
      );
      
      if (weekVideos.length > 0) {
        const weekHours = weekVideos.reduce((sum, video) => 
          sum + (video.estimatedCompletionTime || video.duration || 30), 0
        ) / 60; // Convert to hours
        
        learningPath.weeklySchedule.push({
          week: currentWeek,
          skill: skill,
          focus: week === 0 ? `${skill} Fundamentals` : 
                 week === weeksPerSkill - 1 ? `${skill} Advanced Topics` : 
                 `${skill} Practical Application`,
          videos: weekVideos.map(video => ({
            id: video.id,
            title: video.title,
            url: video.url,
            duration: video.duration,
            estimatedCompletionTime: video.estimatedCompletionTime,
            qualityScore: video.qualityScore,
            overallScore: video.overallScore
          })),
          estimatedHours: Math.round(weekHours * 10) / 10,
          milestones: generateWeekMilestones(skill, week, weeksPerSkill, difficulty)
        });
        
        totalHours += weekHours;
        currentWeek++;
      }
    }
  }

  learningPath.estimatedTotalHours = Math.round(totalHours * 10) / 10;
  
  return learningPath;
}

/**
 * Generate milestones for a specific week
 */
function generateWeekMilestones(skill, weekIndex, totalWeeks, difficulty) {
  const milestones = [];
  
  if (weekIndex === 0) {
    milestones.push(`Understand ${skill} fundamentals`);
    milestones.push(`Set up ${skill} development environment`);
  } else if (weekIndex === totalWeeks - 1) {
    milestones.push(`Complete ${skill} project`);
    milestones.push(`Demonstrate ${skill} proficiency`);
  } else {
    milestones.push(`Apply ${skill} in practical exercises`);
    milestones.push(`Build ${skill} mini-project`);
  }
  
  return milestones;
}

/**
 * Calculate statistics about curated content
 */
function calculateContentStats(allContent) {
  if (!allContent.length) {
    return {
      totalVideos: 0,
      averageQuality: 0,
      averageDuration: 0,
      totalEstimatedHours: 0,
      qualityDistribution: { high: 0, medium: 0, low: 0 },
      durationDistribution: { short: 0, medium: 0, long: 0 }
    };
  }

  const totalVideos = allContent.length;
  const averageQuality = allContent.reduce((sum, video) => sum + video.qualityScore, 0) / totalVideos;
  const averageDuration = allContent.reduce((sum, video) => sum + video.duration, 0) / totalVideos;
  const totalEstimatedHours = allContent.reduce((sum, video) => 
    sum + (video.estimatedCompletionTime || video.duration), 0
  ) / 60;

  // Quality distribution
  const qualityDistribution = {
    high: allContent.filter(v => v.qualityScore >= 80).length,
    medium: allContent.filter(v => v.qualityScore >= 60 && v.qualityScore < 80).length,
    low: allContent.filter(v => v.qualityScore < 60).length
  };

  // Duration distribution
  const durationDistribution = {
    short: allContent.filter(v => v.duration < 20).length,
    medium: allContent.filter(v => v.duration >= 20 && v.duration < 60).length,
    long: allContent.filter(v => v.duration >= 60).length
  };

  return {
    totalVideos,
    averageQuality: Math.round(averageQuality * 10) / 10,
    averageDuration: Math.round(averageDuration * 10) / 10,
    totalEstimatedHours: Math.round(totalEstimatedHours * 10) / 10,
    qualityDistribution,
    durationDistribution,
    topQualityVideos: allContent
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)
      .map(v => ({ title: v.title, score: v.overallScore, skill: v.skill }))
  };
}