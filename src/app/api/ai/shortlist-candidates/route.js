import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  console.log('🎯 AI Candidate Shortlisting API called');
  
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return NextResponse.json({ 
        success: false, 
        message: 'AI service not configured. Please check environment variables.' 
      }, { status: 500 });
    }
    
    // Verify authentication - temporarily bypassed for testing like other APIs
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    console.log('🔍 AI Shortlist API - Token check:', token ? 'Token received' : 'No token');
    
    // For testing, create a fake decoded user (same as resume-rag-python API)
    const decoded = { userId: 'test-user-id' };
    
    /* Original auth code - temporarily disabled for testing
    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('✅ Token verified successfully');
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);
      return NextResponse.json({ 
        success: false, 
        message: `Token verification failed: ${tokenError.message}` 
      }, { status: 401 });
    }

    if (!decoded || !decoded.userId) {
      console.error('❌ Invalid token payload:', decoded);
      return NextResponse.json({ success: false, message: 'Invalid token payload' }, { status: 401 });
    }
    */

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request body. Please check your JSON format.' 
      }, { status: 400 });
    }

    const { jobId, jobTitle, jobDescription, jobRequirements, candidates } = body;

    console.log('📊 Shortlisting request:', {
      jobId,
      jobTitle,
      candidateCount: candidates?.length || 0,
      requirements: jobRequirements?.length || 0,
      bodyKeys: Object.keys(body || {})
    });

    // Validate required fields
    if (!jobId || !jobTitle) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: jobId and jobTitle are required' 
      }, { status: 400 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No candidates provided for analysis' 
      }, { status: 400 });
    }

    // Step 1: Fast pre-filtering (JavaScript)
    console.log('⚡ Step 1: Fast pre-filtering candidates...');
    const preFilteredCandidates = await fastPreFilter(candidates, jobRequirements, jobTitle);
    console.log(`📋 Pre-filtered: ${preFilteredCandidates.length}/${candidates.length} candidates`);

    // Step 2: AI-powered detailed analysis (Gemini)
    console.log('🤖 Step 2: AI analysis with Gemini...');
    const rankedCandidates = await analyzeWithGemini(
      preFilteredCandidates, 
      jobTitle, 
      jobDescription, 
      jobRequirements
    );

    // Step 3: Final ranking and formatting
    console.log('📊 Step 3: Final ranking and formatting...');
    const finalResults = formatResults(rankedCandidates, candidates.length);

    return NextResponse.json({
      success: true,
      data: {
        totalCandidates: candidates.length,
        analyzedCandidates: preFilteredCandidates.length,
        topCandidates: finalResults.slice(0, 10), // Top 10
        allRanked: finalResults,
        processingTime: new Date().toISOString(),
        jobInfo: {
          jobId,
          jobTitle,
          requirements: jobRequirements
        }
      }
    });

  } catch (error) {
    console.error('❌ Shortlisting error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return NextResponse.json({ 
      success: false, 
      message: `Candidate analysis failed: ${error.message}`, 
      error: {
        type: error.name || 'UnknownError',
        message: error.message || 'An unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

// Step 1: Fast JavaScript pre-filtering
async function fastPreFilter(candidates, jobRequirements, jobTitle) {
  const filtered = [];
  
  for (const candidate of candidates) {
    const score = calculateQuickScore(candidate, jobRequirements, jobTitle);
    
    // Only analyze candidates with basic qualification (>30% match)
    if (score.total >= 30) {
      filtered.push({
        ...candidate,
        quickScore: score
      });
    }
  }
  
  // Sort by quick score and take top candidates for AI analysis
  return filtered
    .sort((a, b) => b.quickScore.total - a.quickScore.total)
    .slice(0, 20); // Limit to top 20 for AI analysis
}

// Quick scoring algorithm
function calculateQuickScore(candidate, jobRequirements, jobTitle) {
  const resumeText = candidate.resumeText?.toLowerCase() || '';
  const skills = candidate.skills || [];
  
  // Skills matching (50% weight)
  let skillsScore = 0;
  let matchedSkills = 0;
  
  (jobRequirements || []).forEach(requirement => {
    const reqLower = requirement.toLowerCase();
    const hasSkill = skills.some(skill => 
      skill.toLowerCase().includes(reqLower) || reqLower.includes(skill.toLowerCase())
    ) || resumeText.includes(reqLower);
    
    if (hasSkill) {
      matchedSkills++;
      skillsScore += 100 / (jobRequirements?.length || 1);
    }
  });
  
  // Experience level (30% weight)
  const experienceScore = extractExperienceScore(resumeText, jobTitle);
  
  // Education/Keywords (20% weight)
  const keywordScore = calculateKeywordScore(resumeText, jobTitle, jobRequirements);
  
  const total = Math.round(
    (skillsScore * 0.5) + 
    (experienceScore * 0.3) + 
    (keywordScore * 0.2)
  );
  
  return {
    total,
    skills: Math.round(skillsScore),
    experience: experienceScore,
    keywords: keywordScore,
    matchedSkills
  };
}

// Extract experience score from resume text
function extractExperienceScore(resumeText, jobTitle) {
  const yearMatches = resumeText.match(/(\d+)[\s-]*(?:years?|yrs?)/gi) || [];
  const maxYears = Math.max(...yearMatches.map(match => parseInt(match.match(/\d+/)[0])), 0);
  
  // Role-specific experience expectations
  let expectedYears = 3; // Default
  if (jobTitle.toLowerCase().includes('senior')) expectedYears = 5;
  if (jobTitle.toLowerCase().includes('lead') || jobTitle.toLowerCase().includes('principal')) expectedYears = 7;
  if (jobTitle.toLowerCase().includes('junior') || jobTitle.toLowerCase().includes('entry')) expectedYears = 1;
  
  // Score based on experience match
  if (maxYears >= expectedYears) return 100;
  if (maxYears >= expectedYears * 0.7) return 80;
  if (maxYears >= expectedYears * 0.5) return 60;
  if (maxYears > 0) return 40;
  return 20;
}

// Calculate keyword relevance score
function calculateKeywordScore(resumeText, jobTitle, jobRequirements) {
  const keywords = [
    ...jobTitle.toLowerCase().split(' '),
    ...(jobRequirements || []).map(req => req.toLowerCase())
  ];
  
  let found = 0;
  keywords.forEach(keyword => {
    if (resumeText.includes(keyword)) found++;
  });
  
  return Math.min(100, (found / keywords.length) * 100);
}

// Step 2: AI analysis with Gemini
async function analyzeWithGemini(candidates, jobTitle, jobDescription, jobRequirements) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const results = [];
    
    // Process candidates in batches of 5 for efficiency
    for (let i = 0; i < candidates.length; i += 5) {
      const batch = candidates.slice(i, i + 5);
      
      try {
        console.log(`🔄 Processing batch ${i/5 + 1}/${Math.ceil(candidates.length/5)}`);
        const batchResults = await analyzeBatch(model, batch, jobTitle, jobDescription, jobRequirements);
        results.push(...batchResults);
      } catch (error) {
        console.error(`❌ Batch ${i/5 + 1} failed:`, {
          error: error.message,
          batchSize: batch.length,
          candidateNames: batch.map(c => c.name || 'Anonymous')
        });
        // Add candidates with fallback scores
        batch.forEach(candidate => {
          results.push({
            ...candidate,
            aiScore: candidate.quickScore?.total || 0,
            aiAnalysis: `AI analysis failed: ${error.message}`,
            strengths: ['Quick analysis completed'],
            weaknesses: ['Detailed AI analysis unavailable'],
            recommendation: 'REVIEW_MANUALLY'
          });
        });
      }
    }
    
    return results;
  } catch (initError) {
    console.error('❌ Failed to initialize Gemini model:', initError);
    throw new Error(`AI service initialization failed: ${initError.message}`);
  }
}

// Analyze batch of candidates with Gemini
async function analyzeBatch(model, candidates, jobTitle, jobDescription, jobRequirements) {
  const prompt = `You are an expert HR recruiter and technical interviewer. Analyze these ${candidates.length} candidates for the ${jobTitle} position and provide detailed scoring and recommendations.

JOB DETAILS:
Title: ${jobTitle}
Description: ${jobDescription}
Requirements: ${(jobRequirements || []).join(', ')}

CANDIDATES TO ANALYZE:
${candidates.map((candidate, index) => `
CANDIDATE ${index + 1}:
Name: ${candidate.name || 'Anonymous'}
Resume: ${candidate.resumeText?.substring(0, 1000) || 'No resume text'}
Skills: ${(candidate.skills || []).join(', ')}
Quick Score: ${candidate.quickScore?.total || 0}%
`).join('\n')}

For each candidate, provide a JSON response with this exact structure:

{
  "candidates": [
    {
      "candidateIndex": 1,
      "overallScore": 85,
      "skillsMatch": 90,
      "experienceMatch": 80,
      "projectsScore": 85,
      "strengths": ["Strong React skills", "5+ years experience"],
      "weaknesses": ["Missing Docker experience", "No cloud platform knowledge"],
      "recommendation": "STRONG_HIRE|HIRE|MAYBE|REJECT",
      "reasoning": "Detailed explanation of scoring and recommendation",
      "keySkillsFound": ["React", "JavaScript", "Node.js"],
      "missingCriticalSkills": ["Docker", "AWS"]
    }
  ]
}

SCORING CRITERIA:
- Skills Match (40%): How well candidate's skills align with job requirements
- Experience Match (35%): Years and relevance of experience
- Projects Quality (25%): Complexity and relevance of projects mentioned

RECOMMENDATIONS:
- STRONG_HIRE: 85-100% - Exceptional candidate, immediate hire
- HIRE: 70-84% - Good candidate, recommend for interview
- MAYBE: 50-69% - Potential candidate, needs further evaluation
- REJECT: <50% - Not suitable for this role

Respond ONLY with valid JSON.`;

  try {
    console.log(`📤 Sending prompt to Gemini for ${candidates.length} candidates`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`📥 Received response from Gemini: ${text.substring(0, 200)}...`);
    
    // Clean the response text (remove markdown code blocks if present)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      const analysis = JSON.parse(cleanText);
      console.log(`✅ Successfully parsed Gemini response`);
      
      // Map AI results back to candidates
      return candidates.map((candidate, index) => {
        const aiResult = analysis.candidates?.find(c => c.candidateIndex === index + 1) || {
          overallScore: candidate.quickScore?.total || 0,
          recommendation: 'REVIEW_MANUALLY',
          reasoning: 'AI analysis parsing failed'
        };
        
        return {
          ...candidate,
          aiScore: aiResult.overallScore,
          skillsMatch: aiResult.skillsMatch || 0,
          experienceMatch: aiResult.experienceMatch || 0,
          projectsScore: aiResult.projectsScore || 0,
          strengths: aiResult.strengths || [],
          weaknesses: aiResult.weaknesses || [],
          recommendation: aiResult.recommendation || 'REVIEW_MANUALLY',
          reasoning: aiResult.reasoning || 'No detailed analysis available',
          keySkillsFound: aiResult.keySkillsFound || [],
          missingCriticalSkills: aiResult.missingCriticalSkills || []
        };
      });
      
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', {
        error: parseError.message,
        responseLength: text.length,
        responsePreview: text.substring(0, 500)
      });
      
      // Fallback to quick scores
      return candidates.map(candidate => ({
        ...candidate,
        aiScore: candidate.quickScore?.total || 0,
        recommendation: candidate.quickScore?.total >= 70 ? 'HIRE' : 'MAYBE',
        reasoning: `AI parsing failed: ${parseError.message}. Using quick score analysis.`
      }));
    }
  } catch (apiError) {
    console.error('❌ Gemini API call failed:', {
      error: apiError.message,
      code: apiError.code,
      status: apiError.status
    });
    throw new Error(`Gemini API failed: ${apiError.message}`);
  }
}

// Step 3: Format final results
function formatResults(rankedCandidates, totalCandidates) {
  return rankedCandidates
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    .map((candidate, index) => ({
      rank: index + 1,
      candidateId: candidate.id || candidate._id,
      name: candidate.name || 'Anonymous',
      email: candidate.email,
      score: candidate.aiScore || candidate.quickScore?.total || 0,
      recommendation: candidate.recommendation || 'REVIEW_MANUALLY',
      
      // Detailed scores
      breakdown: {
        skills: candidate.skillsMatch || candidate.quickScore?.skills || 0,
        experience: candidate.experienceMatch || candidate.quickScore?.experience || 0,
        projects: candidate.projectsScore || 0,
        overall: candidate.aiScore || candidate.quickScore?.total || 0
      },
      
      // Key insights
      strengths: candidate.strengths || [],
      weaknesses: candidate.weaknesses || [],
      keySkillsFound: candidate.keySkillsFound || [],
      missingCriticalSkills: candidate.missingCriticalSkills || [],
      
      // Analysis
      reasoning: candidate.reasoning || 'Quick analysis completed',
      
      // Metadata
      processedWith: candidate.aiScore ? 'AI' : 'QuickScore',
      appliedAt: candidate.appliedAt || candidate.createdAt,
      resumePath: candidate.resumePath
    }));
}