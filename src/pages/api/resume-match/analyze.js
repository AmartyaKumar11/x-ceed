import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  console.log('🎯 Resume Match Analysis API called');
  
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, jobDescription, jobTitle, jobRequirements, resumePath, userSkills } = body;

    console.log('📊 Starting resume analysis for:', {
      jobId,
      jobTitle,
      resumePath: resumePath ? 'Present' : 'Missing',
      userSkillsCount: userSkills?.length || 0
    });

    // Try to use Python AI service first, fallback to JavaScript analysis
    let analysisResult;
    try {
      analysisResult = await callPythonAnalyzer({
        jobDescription,
        jobTitle,
        jobRequirements,
        resumePath,
        userSkills,
        userId: decoded.userId
      });
      console.log('✅ Python AI analysis completed');
    } catch (pythonError) {
      console.warn('⚠️ Python AI service failed, using fallback analysis:', pythonError.message);
      analysisResult = await performFallbackAnalysis({
        jobDescription,
        jobTitle,
        jobRequirements,
        resumePath,
        userSkills,
        userId: decoded.userId
      });
    }

    // Store analysis in database
    const { db } = await connectDB();
    const analysisRecord = {
      userId: decoded.userId,
      jobId,
      analysisDate: new Date(),
      analysisType: analysisResult.analysisType || 'ai',
      overallScore: analysisResult.overallScore,
      skillsScore: analysisResult.skillsScore,
      experienceScore: analysisResult.experienceScore,
      keywordScore: analysisResult.keywordScore,
      matchedSkills: analysisResult.matchedSkills,
      missingSkills: analysisResult.missingSkills,
      suggestions: analysisResult.suggestions,
      highlights: analysisResult.highlights
    };

    await db.collection('resumeAnalyses').insertOne(analysisRecord);

    return NextResponse.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('❌ Error in resume analysis:', error);
    return NextResponse.json(
      { success: false, message: 'Analysis failed', error: error.message },
      { status: 500 }
    );
  }
}

async function callPythonAnalyzer(requestData) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'resume_analyzer.py');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      reject(new Error('Python analyzer script not found'));
      return;
    }

    const requestJson = JSON.stringify({
      job_description: requestData.jobDescription,
      job_title: requestData.jobTitle,
      job_requirements: requestData.jobRequirements || [],
      resume_path: requestData.resumePath || '',
      user_skills: requestData.userSkills || [],
      user_id: requestData.userId
    });

    console.log('🐍 Calling Python analyzer...');
    
    // Spawn Python process
    const pythonProcess = spawn('python', [pythonScript, requestJson], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: path.join(process.cwd(), 'scripts') }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          result.analysisType = 'ai';
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          reject(new Error('Invalid Python analyzer output'));
        }
      } else {
        console.error('Python analyzer failed:', stderr);
        reject(new Error(`Python analyzer exited with code ${code}: ${stderr}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python analyzer:', error);
      reject(error);
    });

    // Set timeout for Python process
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python analyzer timeout'));
    }, 30000); // 30 second timeout
  });
}

async function performFallbackAnalysis({ jobDescription, jobTitle, jobRequirements, resumePath, userSkills, userId }) {
  console.log('🤖 Performing fallback JavaScript analysis...');

  // Extract job keywords and requirements
  const jobKeywords = extractJobKeywords(jobDescription, jobTitle);
  const requiredSkills = extractRequiredSkills(jobDescription, jobRequirements);
  
  // Analyze user skills against job requirements
  const skillsAnalysis = analyzeSkills(userSkills, requiredSkills);
  
  // If resume file exists, extract text for analysis
  let resumeText = '';
  if (resumePath) {
    try {
      resumeText = await extractTextFromResume(resumePath);
    } catch (error) {
      console.warn('Could not extract text from resume:', error.message);
    }
  }

  // Perform keyword analysis
  const keywordAnalysis = analyzeKeywords(resumeText, jobKeywords);
  
  // Generate experience analysis
  const experienceAnalysis = analyzeExperience(resumeText, jobDescription);
  
  // Calculate overall score
  const overallScore = calculateOverallScore(skillsAnalysis.score, experienceAnalysis.score, keywordAnalysis.score);
  
  // Generate improvement suggestions
  const suggestions = generateSuggestions(skillsAnalysis, keywordAnalysis, experienceAnalysis);
  
  // Generate PDF highlights (areas that need improvement)
  const highlights = generatePdfHighlights(resumeText, skillsAnalysis.missingSkills, keywordAnalysis.missingKeywords);

  return {
    analysisType: 'fallback',
    overallScore,
    skillsScore: skillsAnalysis.score,
    experienceScore: experienceAnalysis.score,
    keywordScore: keywordAnalysis.score,
    overallSummary: generateOverallSummary(overallScore),
    matchedSkills: skillsAnalysis.matched,
    missingSkills: skillsAnalysis.missing,
    foundKeywords: keywordAnalysis.found,
    missingKeywords: keywordAnalysis.missing,
    experienceAnalysis: experienceAnalysis.details,
    suggestions,
    highlights
  };
}

function extractJobKeywords(jobDescription, jobTitle) {
  // Enhanced keyword extraction
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();
  
  // Common tech keywords
  const techKeywords = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'express',
    'mongodb', 'sql', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'ci/cd', 'devops', 'microservices', 'api', 'rest',
    'graphql', 'machine learning', 'ai', 'data science', 'analytics', 'agile',
    'scrum', 'git', 'github', 'gitlab', 'jenkins', 'terraform', 'linux'
  ];

  const foundKeywords = techKeywords.filter(keyword => 
    text.includes(keyword) || text.includes(keyword.replace('.', ''))
  );

  // Extract custom keywords from job description
  const words = text.match(/\b\w{3,}\b/g) || [];
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get high-frequency words as keywords
  const customKeywords = Object.entries(wordFreq)
    .filter(([word, freq]) => freq >= 2 && word.length > 3)
    .map(([word]) => word)
    .slice(0, 10);

  return [...new Set([...foundKeywords, ...customKeywords])];
}

function extractRequiredSkills(jobDescription, jobRequirements) {
  const allText = `${jobDescription} ${jobRequirements?.join(' ') || ''}`.toLowerCase();
  
  const commonSkills = [
    'html', 'css', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'node.js', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go',
    'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'git',
    'agile', 'scrum', 'rest api', 'graphql', 'microservices'
  ];

  return commonSkills.filter(skill => 
    allText.includes(skill) || allText.includes(skill.replace('.', ''))
  );
}

function analyzeSkills(userSkills, requiredSkills) {
  const userSkillsLower = userSkills?.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : skill.name?.toLowerCase()
  ) || [];
  
  const requiredSkillsLower = requiredSkills.map(skill => skill.toLowerCase());
  
  const matched = requiredSkillsLower.filter(skill => 
    userSkillsLower.some(userSkill => 
      userSkill?.includes(skill) || skill.includes(userSkill || '')
    )
  );
  
  const missing = requiredSkillsLower.filter(skill => !matched.includes(skill));
  
  const score = requiredSkillsLower.length > 0 
    ? Math.round((matched.length / requiredSkillsLower.length) * 100)
    : 0;

  return { matched, missing, score };
}

function analyzeKeywords(resumeText, jobKeywords) {
  const resumeTextLower = resumeText.toLowerCase();
  
  const found = jobKeywords.filter(keyword => 
    resumeTextLower.includes(keyword.toLowerCase())
  );
  
  const missing = jobKeywords.filter(keyword => !found.includes(keyword));
  
  const score = jobKeywords.length > 0 
    ? Math.round((found.length / jobKeywords.length) * 100)
    : 0;

  return { found, missing, score };
}

function analyzeExperience(resumeText, jobDescription) {
  // Simple experience matching based on years and keywords
  const resumeTextLower = resumeText.toLowerCase();
  const jobDescLower = jobDescription.toLowerCase();
  
  // Extract years of experience from job description
  const jobYearsMatch = jobDescLower.match(/(\d+)[\s-]*(?:years?|yrs?)/);
  const requiredYears = jobYearsMatch ? parseInt(jobYearsMatch[1]) : 0;
  
  // Extract years from resume
  const resumeYearsMatches = resumeTextLower.match(/(\d+)[\s-]*(?:years?|yrs?)/g) || [];
  const resumeYears = resumeYearsMatches.reduce((max, match) => {
    const years = parseInt(match.match(/\d+/)[0]);
    return Math.max(max, years);
  }, 0);

  // Analyze common job requirements
  const requirements = [
    { text: 'leadership experience', keyword: 'lead' },
    { text: 'team management', keyword: 'team' },
    { text: 'project management', keyword: 'project' },
    { text: 'client interaction', keyword: 'client' },
    { text: 'problem solving', keyword: 'problem' }
  ];

  const details = requirements.map(req => ({
    requirement: req.text,
    matched: resumeTextLower.includes(req.keyword) && jobDescLower.includes(req.keyword),
    analysis: resumeTextLower.includes(req.keyword) 
      ? `Found evidence of ${req.text} in resume`
      : `No clear evidence of ${req.text} found`
  }));

  // Calculate experience score
  let score = 60; // Base score
  if (resumeYears >= requiredYears) score += 20;
  if (details.filter(d => d.matched).length >= 2) score += 20;
  
  return { score: Math.min(100, score), details, resumeYears, requiredYears };
}

function calculateOverallScore(skillsScore, experienceScore, keywordScore) {
  // Weighted average: Skills 40%, Keywords 35%, Experience 25%
  return Math.round(
    (skillsScore * 0.4) + (keywordScore * 0.35) + (experienceScore * 0.25)
  );
}

function generateSuggestions(skillsAnalysis, keywordAnalysis, experienceAnalysis) {
  const suggestions = [];

  // Skills suggestions
  if (skillsAnalysis.missing.length > 0) {
    suggestions.push({
      title: 'Add Missing Technical Skills',
      description: `Consider adding these skills to your resume: ${skillsAnalysis.missing.slice(0, 3).join(', ')}`,
      priority: 'high'
    });
  }

  // Keywords suggestions
  if (keywordAnalysis.missing.length > 0) {
    suggestions.push({
      title: 'Include Important Keywords',
      description: `Your resume should include these job-relevant terms: ${keywordAnalysis.missing.slice(0, 3).join(', ')}`,
      priority: 'medium'
    });
  }

  // Experience suggestions
  if (experienceAnalysis.score < 70) {
    suggestions.push({
      title: 'Highlight Relevant Experience',
      description: 'Consider emphasizing experience that directly relates to the job requirements',
      priority: 'medium'
    });
  }

  // General suggestions
  suggestions.push({
    title: 'Quantify Your Achievements',
    description: 'Add specific numbers, percentages, and metrics to demonstrate your impact',
    priority: 'low'
  });

  return suggestions;
}

function generatePdfHighlights(resumeText, missingSkills, missingKeywords) {
  // This would generate coordinates for PDF highlighting
  // For now, return mock highlight data
  return [
    { page: 1, x: 100, y: 200, width: 200, height: 20, color: 'yellow', reason: 'Add missing skills here' },
    { page: 1, x: 100, y: 400, width: 300, height: 20, color: 'red', reason: 'Include relevant keywords' }
  ];
}

function generateOverallSummary(score) {
  if (score >= 80) {
    return 'Excellent match! Your resume aligns very well with this job opportunity.';
  } else if (score >= 60) {
    return 'Good match with room for improvement. Consider the suggestions below.';
  } else if (score >= 40) {
    return 'Fair match. Your resume needs significant improvements for this role.';
  } else {
    return 'Poor match. Consider substantial revisions to better align with this opportunity.';
  }
}

async function extractTextFromResume(resumePath) {
  // This would use a PDF text extraction library
  // For now, return mock text
  return `
    John Doe
    Software Developer
    
    Experience:
    - 3 years of experience in web development
    - Proficient in JavaScript, React, Node.js
    - Worked on team projects and client solutions
    
    Skills:
    JavaScript, React, HTML, CSS, Git, MongoDB
    
    Education:
    Bachelor's in Computer Science
  `;
}
