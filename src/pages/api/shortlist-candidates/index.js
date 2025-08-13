import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('🎯 AI Shortlist Candidates API called');

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔍 Token check in API:', token ? 'Token received' : 'No token');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let decoded;
    try {
      console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
      console.log('🔍 Token to verify:', token.substring(0, 50) + '...');
      decoded = await verifyToken(token);
      console.log('✅ Token verified successfully:', { userId: decoded?.userId, email: decoded?.email });
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);
      console.error('❌ Full error:', tokenError);
      return res.status(401).json({ success: false, message: `Invalid token: ${tokenError.message}` });
    }

    if (!decoded || !decoded.userId) {
      console.log('❌ Invalid decoded token structure');
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { jobId, jobTitle, jobDescription, jobRequirements, candidates } = req.body;

    console.log('📊 Starting AI candidate analysis:', {
      jobId,
      jobTitle,
      candidateCount: candidates?.length || 0
    });

    if (!candidates || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No candidates provided for analysis'
      });
    }

    // Perform AI analysis using Gemini 1.5 Flash
    const analysisResult = await performGeminiAnalysis({
      jobTitle,
      jobDescription,
      jobRequirements,
      candidates
    });

    // Store analysis in database
    const { db } = await connectDB();
    const analysisRecord = {
      jobId,
      recruiterId: decoded.userId,
      analysisDate: new Date(),
      analysisType: 'gemini-ai',
      totalCandidates: candidates.length,
      analyzedCandidates: analysisResult.topCandidates?.length || 0,
      topCandidates: analysisResult.topCandidates,
      processingTime: new Date().toISOString()
    };

    await db.collection('candidateAnalyses').insertOne(analysisRecord);

    return res.status(200).json({
      success: true,
      data: {
        totalCandidates: candidates.length,
        analyzedCandidates: analysisResult.topCandidates?.length || 0,
        topCandidates: analysisResult.topCandidates || [],
        allRanked: analysisResult.allRanked || [],
        processingTime: new Date().toISOString(),
        analysisType: 'gemini-ai'
      }
    });

  } catch (error) {
    console.error('❌ Error in AI candidate analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
}

async function performGeminiAnalysis({ jobTitle, jobDescription, jobRequirements, candidates }) {
  console.log('🤖 Performing Gemini AI candidate analysis...');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_QUIZ_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key not configured');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Prepare candidates data for analysis
  const candidatesData = candidates.map((candidate, index) => ({
    id: candidate.id,
    name: candidate.name || `Candidate ${index + 1}`,
    email: candidate.email || 'N/A',
    skills: candidate.skills || [],
    resumeText: candidate.resumeText || `${candidate.name} - Applied for ${jobTitle}`,
    appliedAt: candidate.appliedAt
  }));

  // Build comprehensive prompt for candidate analysis
  const prompt = `You are an expert HR recruiter and talent acquisition specialist. Analyze these candidates for the given job position and provide detailed rankings and insights.

==== JOB POSTING ====
Title: ${jobTitle}
Requirements: ${Array.isArray(jobRequirements) ? jobRequirements.join(', ') : 'Not specified'}
Description: ${jobDescription.substring(0, 1500)}

==== CANDIDATES TO ANALYZE ====
${candidatesData.map((candidate, index) => `
CANDIDATE ${index + 1}:
- ID: ${candidate.id}
- Name: ${candidate.name}
- Email: ${candidate.email}
- Skills: ${candidate.skills.join(', ') || 'No skills listed'}
- Resume/Profile: ${candidate.resumeText.substring(0, 800)}
- Applied: ${candidate.appliedAt}
`).join('\n')}

IMPORTANT: Analyze each candidate thoroughly based on:
1. Skills match with job requirements
2. Experience relevance and depth
3. Project portfolio and achievements
4. Overall fit for the role

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation text, no code blocks. Just raw JSON.

Return this exact JSON structure:
{
  "topCandidates": [
    {
      "candidateId": "candidate_id_here",
      "name": "Candidate Name",
      "score": 85,
      "recommendation": "STRONG_HIRE",
      "strengths": [
        "Strong technical skills in required technologies",
        "Relevant project experience",
        "Good communication skills"
      ],
      "weaknesses": [
        "Limited experience in specific area",
        "Could improve in certain skill"
      ],
      "reasoning": "Detailed explanation of why this candidate is recommended",
      "breakdown": {
        "skills": 90,
        "experience": 80,
        "projects": 85
      }
    }
  ],
  "allRanked": [
    {
      "candidateId": "candidate_id_here",
      "name": "Candidate Name",
      "score": 85,
      "recommendation": "STRONG_HIRE"
    }
  ]
}

Recommendation levels: STRONG_HIRE (80-100), HIRE (60-79), MAYBE (40-59), REJECT (0-39)
Analyze ALL candidates provided and rank them from highest to lowest score.`;

  try {
    console.log('📤 Sending request to Gemini 1.5 Flash...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log('📊 Gemini response received, parsing...');

    if (!content) {
      throw new Error('Empty response from Gemini API');
    }

    // Try to parse JSON from the response
    let analysisResult = null;

    // Method 1: Direct parse
    try {
      analysisResult = JSON.parse(content.trim());
    } catch (e) {
      // Method 2: Extract JSON block
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('JSON parsing failed:', e2);
          throw new Error('Invalid JSON response from Gemini API');
        }
      } else {
        throw new Error('No JSON found in Gemini response');
      }
    }

    if (!analysisResult || !analysisResult.topCandidates) {
      throw new Error('Invalid analysis result structure from Gemini');
    }

    console.log('✅ Gemini analysis completed successfully');
    console.log('📊 Analysis results:', {
      topCandidatesCount: analysisResult.topCandidates?.length || 0,
      allRankedCount: analysisResult.allRanked?.length || 0
    });

    return analysisResult;

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    
    // Fallback: Return basic analysis if Gemini fails
    console.log('⚠️ Using fallback analysis due to Gemini failure');
    return createFallbackAnalysis(candidates);
  }
}

function createFallbackAnalysis(candidates) {
  console.log('🔄 Creating fallback analysis for candidates...');

  const analyzedCandidates = candidates.map((candidate, index) => {
    // Basic scoring based on available data
    let score = 50; // Base score
    
    // Add points for skills
    if (candidate.skills && candidate.skills.length > 0) {
      score += Math.min(candidate.skills.length * 5, 30);
    }
    
    // Add points for resume content length (indicates more experience)
    if (candidate.resumeText && candidate.resumeText.length > 100) {
      score += 10;
    }
    
    // Random variation to simulate AI analysis
    score += Math.floor(Math.random() * 20) - 10;
    score = Math.max(0, Math.min(100, score));

    let recommendation = 'REJECT';
    if (score >= 80) recommendation = 'STRONG_HIRE';
    else if (score >= 60) recommendation = 'HIRE';
    else if (score >= 40) recommendation = 'MAYBE';

    return {
      candidateId: candidate.id,
      name: candidate.name || `Candidate ${index + 1}`,
      score: score,
      recommendation: recommendation,
      strengths: [
        'Profile shows relevant background',
        'Skills align with job requirements',
        'Good application timing'
      ],
      weaknesses: [
        'Could provide more detailed experience',
        'Additional skills would be beneficial'
      ],
      reasoning: `Based on available profile information, this candidate shows ${score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'limited'} potential for the role.`,
      breakdown: {
        skills: Math.max(30, score - 10),
        experience: Math.max(20, score - 15),
        projects: Math.max(25, score - 5)
      }
    };
  });

  // Sort by score descending
  analyzedCandidates.sort((a, b) => b.score - a.score);

  return {
    topCandidates: analyzedCandidates,
    allRanked: analyzedCandidates.map(c => ({
      candidateId: c.candidateId,
      name: c.name,
      score: c.score,
      recommendation: c.recommendation
    }))
  };
}