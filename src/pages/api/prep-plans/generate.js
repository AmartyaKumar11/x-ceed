import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Generate a detailed AI-powered prep plan using OpenRouter
async function generateDetailedPrepPlan(jobData, userProfile, duration = 4, resumeAnalysis = null) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;

  console.log('🔑 OpenRouter API Key check:', OPENROUTER_API_KEY ? 'Available' : 'Missing');
  console.log('📊 Generation parameters:', {
    jobTitle: jobData.jobTitle,
    duration,
    hasProfile: !!userProfile,
    hasResumeAnalysis: !!resumeAnalysis,
    resumeAnalysisSource: resumeAnalysis ? 'Resume-JD Match Analysis' : 'User Profile Only'
  });

  // Debug user profile data for personalization
  console.log('👤 USER PROFILE DEBUG:', {
    skillsCount: Array.isArray(userProfile.skills) ? userProfile.skills.length : 0,
    skills: Array.isArray(userProfile.skills) ? userProfile.skills.slice(0, 3) : 'No skills',
    hasExperience: !!userProfile.workExperience,
    experienceCount: Array.isArray(userProfile.workExperience) ? userProfile.workExperience.length : 0,
    hasEducation: !!userProfile.education,
    educationCount: Array.isArray(userProfile.education) ? userProfile.education.length : 0
  });

  // Debug resume analysis data if available
  if (resumeAnalysis) {
    console.log('📄 RESUME ANALYSIS DEBUG:', {
      hasStructuredAnalysis: !!resumeAnalysis.structuredAnalysis,
      hasGapAnalysis: !!(resumeAnalysis.gapAnalysis || resumeAnalysis.structuredAnalysis?.gap_analysis),
      hasMissingSkills: !!(resumeAnalysis.missingSkills || resumeAnalysis.structuredAnalysis?.missing_skills),
      hasMatchingSkills: !!(resumeAnalysis.matchingSkills || resumeAnalysis.structuredAnalysis?.matching_skills),
      hasSkillsToImprove: !!(resumeAnalysis.skillsToImprove || resumeAnalysis.structuredAnalysis?.skills_to_improve)
    });
  }

  if (!OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API Key not configured');
    throw new Error('OpenRouter API Key not configured');
  }

  // Build the AI prompt with resume analysis data if available
  let prompt = `You are an AI career advisor. Analyze the skills gap between this candidate's profile and job requirements to create a personalized study plan.

==== JOB REQUIREMENTS ====
Position: ${jobData.jobTitle} at ${jobData.companyName}
Requirements: ${Array.isArray(jobData.requirements) ? jobData.requirements.join(', ') : 'Not specified'}
Job Description: ${(jobData.jobDescriptionText || jobData.description || '').substring(0, 600)}

==== CANDIDATE CURRENT SKILLS ====
Existing Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : 'No skills listed'}
Experience: ${userProfile.workExperience ? JSON.stringify(userProfile.workExperience).substring(0, 300) : 'No experience data'}
Education: ${userProfile.education ? JSON.stringify(userProfile.education).substring(0, 200) : 'No education data'}`;

  // Add resume analysis data if available for more precise gap analysis
  if (resumeAnalysis) {
    const gapAnalysis = resumeAnalysis.gapAnalysis || resumeAnalysis.structuredAnalysis?.gap_analysis;
    const missingSkills = resumeAnalysis.missingSkills || resumeAnalysis.structuredAnalysis?.missing_skills || [];
    const matchingSkills = resumeAnalysis.matchingSkills || resumeAnalysis.structuredAnalysis?.matching_skills || [];
    const skillsToImprove = resumeAnalysis.skillsToImprove || resumeAnalysis.structuredAnalysis?.skills_to_improve || [];

    prompt += `

==== DETAILED RESUME-JD ANALYSIS ====
Resume Analysis Results: This candidate's resume was analyzed against this specific job posting.
Missing Skills (Critical): ${Array.isArray(missingSkills) ? missingSkills.join(', ') : 'None identified'}
Matching Skills (Strengths): ${Array.isArray(matchingSkills) ? matchingSkills.join(', ') : 'None identified'}
Skills to Improve: ${Array.isArray(skillsToImprove) ? skillsToImprove.join(', ') : 'None identified'}
Gap Analysis: ${gapAnalysis || 'No detailed gap analysis available'}

PRIORITY: Use this resume-specific analysis to create a highly targeted prep plan that addresses the exact gaps between this candidate's resume and this specific job posting.`;
  }

  prompt += `

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation text, no code blocks. Just raw JSON.

Return this exact JSON structure:
{
  "gapAnalysis": {
    "missingSkills": ["List skills mentioned in job but completely absent from candidate"],
    "skillsToAdvance": ["List skills candidate has but need improvement for this role"],
    "newDomainKnowledge": ["Domain-specific knowledge needed for this role"],
    "criticalLearningPath": "What this candidate specifically needs to learn for this role"
  },
  "personalizedTopics": [
    {
      "topicName": "Specific skill from gap analysis",
      "whyNeeded": "Explain why this candidate specifically needs this",
      "currentLevel": "Candidate's estimated current level",
      "targetLevel": "Level needed for the job",
      "studyHours": "${Math.ceil(duration * 8)} hours",
      "specificProjects": ["Projects that demonstrate mastery of this gap"]
    }
  ],
  "weeklyProgression": {
    "week1": {
      "focus": "Address the most critical gap first",
      "topics": ["Specific missing skills for this candidate"],
      "rationale": "Why start with these topics for this person"
    },
    "week2": {
      "focus": "Next priority gap",
      "topics": ["Next set of missing skills"],
      "rationale": "Why these topics come next"
    }
  },
  "candidateSpecificResources": {
    "basedOnBackground": "Resources tailored to their current skill level",
    "learningPath": "Progression from their current state to job requirements"
  }
}`;

  console.log('📝 Prompt length:', prompt.length);

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      retryCount++;
      console.log(`🔄 Attempt ${retryCount}/${maxRetries}`);

      if (retryCount > 1) {
        // Exponential backoff: wait 2^(retryCount-1) seconds
        const waitTime = Math.pow(2, retryCount - 1) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      // Try multiple free models with fallback
      const freeModels = [
        'meta-llama/llama-3.2-3b-instruct:free',
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free'
      ];

      let response = null;
      let lastError = null;

      for (const model of freeModels) {
        try {
          console.log(`🤖 Trying OpenRouter model: ${model}`);

          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002',
              'X-Title': 'X-CEED Prep Plan Generator'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 4000,
            }),
          });

          console.log(`🌐 ${model} API Response status:`, response.status);

          if (response.ok) {
            console.log(`✅ Successfully using model: ${model}`);
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ ${model} failed:`, errorText);
            lastError = `${model}: ${response.status} - ${errorText}`;
            response = null;
          }
        } catch (modelError) {
          console.warn(`⚠️ ${model} error:`, modelError.message);
          lastError = `${model}: ${modelError.message}`;
          response = null;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
      }

      const data = await response.json();
      console.log('✅ API Response received, content length:', data.choices?.[0]?.message?.content?.length || 0);

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }

      // Try to parse JSON from the response - try multiple extraction methods
      let prepPlan = null;

      // Method 1: Try direct JSON parse (for clean responses)
      try {
        prepPlan = JSON.parse(content.trim());
      } catch (e) {
        console.log('❌ Direct parse failed:', e.message);
      }

      // Method 2: Try to find JSON block with proper structure
      if (!prepPlan) {
        const jsonMatch = content.match(/\{[\s\S]*"gapAnalysis"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            prepPlan = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('❌ Method 2 failed:', e.message);
          }
        }
      }

      // Method 3: Try to find any JSON structure
      if (!prepPlan) {
        const anyJsonMatch = content.match(/\{[\s\S]*\}/);
        if (anyJsonMatch) {
          try {
            prepPlan = JSON.parse(anyJsonMatch[0]);
          } catch (e) {
            console.log('❌ Method 3 failed:', e.message);
          }
        }
      }

      // Method 4: Try to extract from code blocks
      if (!prepPlan) {
        const codeBlockMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            prepPlan = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.log('❌ Method 4 failed:', e.message);
          }
        }
      }

      if (!prepPlan) {
        console.log('🔍 Raw AI Response (first 1000 chars):', content.substring(0, 1000));
        throw new Error('No valid JSON found in response');
      }
      console.log('✅ Plan parsed successfully');

      return prepPlan;

    } catch (error) {
      console.error(`❌ Attempt ${retryCount} failed:`, error.message);

      if (retryCount >= maxRetries) {
        console.error('❌ All retry attempts failed, using fallback plan');
        break;
      }
    }
  }

  // If we reach here, all retries failed - use fallback plan
  console.log('🔄 All OpenRouter attempts failed, generating fallback plan');

  // Return a gap-focused fallback plan using resume analysis if available
  const jobRequirements = Array.isArray(jobData.requirements) ? jobData.requirements : [];
  const candidateSkills = Array.isArray(userProfile.skills) ? userProfile.skills : [];
  const jobDescription = (jobData.jobDescriptionText || jobData.description || '').toLowerCase();

  // Use resume analysis data if available, otherwise do simple gap analysis
  let missingSkills = [];
  let skillsToAdvance = [];

  if (resumeAnalysis) {
    // Use resume-specific gap analysis (more accurate)
    console.log('📄 Using resume analysis for fallback plan');
    missingSkills = resumeAnalysis.missingSkills || resumeAnalysis.structuredAnalysis?.missing_skills || [];
    skillsToAdvance = resumeAnalysis.skillsToImprove || resumeAnalysis.structuredAnalysis?.skills_to_improve || [];

    // Ensure arrays
    if (!Array.isArray(missingSkills)) missingSkills = [];
    if (!Array.isArray(skillsToAdvance)) skillsToAdvance = [];
  } else {
    // Fallback to keyword-based analysis
    console.log('🔍 Using keyword-based gap analysis for fallback');

    // Extract skills mentioned in job description
    const jobSkillKeywords = [
      'python', 'javascript', 'react', 'node', 'sql', 'mongodb', 'aws', 'docker',
      'kubernetes', 'machine learning', 'data science', 'tensorflow', 'pytorch',
      'pandas', 'numpy', 'scikit-learn', 'api', 'rest', 'graphql', 'microservices',
      'redis', 'postgresql', 'mysql', 'git', 'ci/cd', 'jenkins', 'terraform'
    ];

    const candidateSkillsLower = candidateSkills.map(skill => skill.toLowerCase());

    jobSkillKeywords.forEach(skill => {
      if (jobDescription.includes(skill)) {
        if (!candidateSkillsLower.some(candidateSkill => candidateSkill.includes(skill))) {
          missingSkills.push(skill);
        } else {
          skillsToAdvance.push(skill);
        }
      }
    });

    // Add explicit job requirements
    jobRequirements.forEach(req => {
      const reqLower = req.toLowerCase();
      if (!candidateSkillsLower.some(skill => skill.toLowerCase().includes(reqLower))) {
        missingSkills.push(req);
      }
    });
  }

  return {
    gapAnalysis: {
      missingSkills: missingSkills.slice(0, 5),
      skillsToAdvance: skillsToAdvance.slice(0, 3),
      newDomainKnowledge: [
        `${jobData.jobTitle} best practices and methodologies`,
        `Industry standards for ${jobData.jobTitle} roles`,
        `Advanced techniques specific to ${jobData.companyName || 'this company'}'s domain`
      ],
      criticalLearningPath: `This candidate needs to focus on ${missingSkills.length > 0 ? 'acquiring ' + missingSkills.slice(0, 2).join(' and ') : 'advancing their existing skills'} to meet the ${jobData.jobTitle} requirements.`
    },
    personalizedTopics: [
      ...(missingSkills.slice(0, 3).map(skill => ({
        topicName: `Master ${skill} for ${jobData.jobTitle}`,
        whyNeeded: `This skill is required for the ${jobData.jobTitle} role but is missing from your profile`,
        currentLevel: 'Beginner/No experience',
        targetLevel: 'Intermediate to Advanced',
        studyHours: `${Math.ceil(duration * 8)} hours`,
        specificProjects: [`Build a project demonstrating ${skill} proficiency relevant to ${jobData.jobTitle}`]
      }))),
      ...(skillsToAdvance.slice(0, 2).map(skill => ({
        topicName: `Advanced ${skill} for Professional Use`,
        whyNeeded: `You have ${skill} experience but need to advance it for this ${jobData.jobTitle} role`,
        currentLevel: 'Basic to Intermediate',
        targetLevel: 'Advanced/Expert',
        studyHours: `${Math.ceil(duration * 6)} hours`,
        specificProjects: [`Create an advanced ${skill} project showcasing professional-level skills`]
      })))
    ],
    weeklyProgression: {
      week1: {
        focus: missingSkills.length > 0 ? `Learn ${missingSkills[0]} fundamentals` : `Advance ${skillsToAdvance[0] || 'core skills'}`,
        topics: missingSkills.length > 0 ? [missingSkills[0]] : [skillsToAdvance[0] || 'Core technical skills'],
        rationale: `Starting with ${missingSkills.length > 0 ? 'the most critical missing skill' : 'advancing your strongest area'} to build confidence`
      },
      week2: {
        focus: missingSkills.length > 1 ? `Learn ${missingSkills[1]} and integration` : `Apply advanced techniques`,
        topics: missingSkills.length > 1 ? [missingSkills[1]] : ['Advanced application patterns'],
        rationale: `Building on week 1 foundation to ${missingSkills.length > 1 ? 'add another critical skill' : 'deepen expertise'}`
      }
    },
    candidateSpecificResources: {
      basedOnBackground: candidateSkills.length > 0
        ? `Resources building on your existing ${candidateSkills.slice(0, 2).join(' and ')} background`
        : 'Beginner-friendly resources with hands-on projects',
      learningPath: `Progress from your current ${candidateSkills.length > 0 ? 'skill set' : 'starting point'} to ${jobData.jobTitle} job requirements through targeted skill development`
    }
  };
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }

  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ message: 'Only applicants can generate prep plans' });
  }

  try {
    const { prepPlanId, forceRegenerate = false } = req.body;

    console.log('🎯 Generate detailed plan request:', {
      prepPlanId,
      forceRegenerate,
      userId: auth.user.userId,
      userType: auth.user.userType
    });

    if (!prepPlanId) {
      return res.status(400).json({ message: 'Prep plan ID is required' });
    }

    // Get the database
    const db = await getDatabase();

    // Fetch the prep plan
    const prepPlan = await db.collection('prepPlans').findOne({
      _id: new ObjectId(prepPlanId),
      applicantId: auth.user.userId
    });

    if (!prepPlan) {
      return res.status(404).json({ message: 'Prep plan not found' });
    }

    // Check if detailed plan already exists (unless force regeneration is requested)
    if (!forceRegenerate && prepPlan.detailedPlan && prepPlan.planGenerated) {
      console.log('✅ Detailed plan already exists, returning cached version');
      return res.status(200).json({
        success: true,
        message: 'Detailed prep plan already exists (cached)',
        data: {
          prepPlanId: prepPlanId,
          detailedPlan: prepPlan.detailedPlan,
          cached: true
        }
      });
    }

    // Fetch user profile for personalization
    const userProfile = await db.collection('users').findOne({
      _id: new ObjectId(auth.user.userId)
    });

    console.log('📚 Generating NEW detailed prep plan for:', {
      jobTitle: prepPlan.jobTitle,
      company: prepPlan.companyName,
      userId: auth.user.userId,
      duration: prepPlan.duration || 4,
      hasResumeAnalysis: !!prepPlan.resumeAnalysis,
      source: prepPlan.source
    });

    // Generate the detailed study plan using AI with duration from prep plan
    // Pass resume analysis data if available for personalized gap analysis
    const detailedPlan = await generateDetailedPrepPlan(
      prepPlan,
      userProfile || {},
      prepPlan.duration || 4,
      prepPlan.resumeAnalysis || null // Pass resume analysis for personalization
    );

    // Update the prep plan with the detailed study plan
    const updateResult = await db.collection('prepPlans').updateOne(
      { _id: new ObjectId(prepPlanId) },
      {
        $set: {
          detailedPlan: detailedPlan,
          planGenerated: true,
          generatedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Failed to update prep plan' });
    }

    console.log('✅ Detailed prep plan generated successfully');

    return res.status(200).json({
      success: true,
      message: 'Detailed prep plan generated successfully',
      data: {
        prepPlanId: prepPlanId,
        detailedPlan: detailedPlan
      }
    });

  } catch (error) {
    console.error('Error generating detailed prep plan:', error);
    return res.status(500).json({
      message: 'Failed to generate detailed prep plan',
      error: error.message
    });
  }
}
