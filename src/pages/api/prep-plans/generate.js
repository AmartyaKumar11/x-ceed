import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Generate a detailed AI-powered prep plan
async function generateDetailedPrepPlan(jobData, userProfile, duration = 4) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  console.log('🔑 GROQ_API_KEY check:', GROQ_API_KEY ? 'Available' : 'Missing');
  console.log('📊 Generation parameters:', { 
    jobTitle: jobData.jobTitle, 
    duration, 
    hasProfile: !!userProfile 
  });
  
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not configured');
    throw new Error('GROQ_API_KEY not configured');
  }

  const prompt = `You are an AI career advisor. Analyze the skills gap between this candidate's profile and job requirements to create a personalized study plan.

==== JOB REQUIREMENTS ====
Position: ${jobData.jobTitle} at ${jobData.companyName}
Requirements: ${Array.isArray(jobData.requirements) ? jobData.requirements.join(', ') : 'Not specified'}
Job Description: ${(jobData.jobDescriptionText || jobData.description || '').substring(0, 600)}

==== CANDIDATE CURRENT SKILLS ====
Existing Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : 'No skills listed'}
Experience: ${userProfile.workExperience ? JSON.stringify(userProfile.workExperience).substring(0, 300) : 'No experience data'}
Education: ${userProfile.education ? JSON.stringify(userProfile.education).substring(0, 200) : 'No education data'}

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

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
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

    console.log('🌐 API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error details:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
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
    console.error('❌ Generation error:', error.message);
    
    // Return a gap-focused fallback plan
    const jobRequirements = Array.isArray(jobData.requirements) ? jobData.requirements : [];
    const candidateSkills = Array.isArray(userProfile.skills) ? userProfile.skills : [];
    const jobDescription = (jobData.jobDescriptionText || jobData.description || '').toLowerCase();
    
    // Simple gap analysis for fallback
    const missingSkills = [];
    const skillsToAdvance = [];
    
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
      duration: prepPlan.duration || 4
    });

    // Generate the detailed study plan using AI with duration from prep plan
    const detailedPlan = await generateDetailedPrepPlan(prepPlan, userProfile || {}, prepPlan.duration || 4);

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
