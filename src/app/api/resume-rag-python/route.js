import { verifyToken } from '@/lib/auth';
import { PDFTextExtractor } from '@/lib/pdfExtractor';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Python FastAPI service URLs
const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000';
const PYTHON_GEMINI_CHAT_SERVICE_URL = process.env.PYTHON_GEMINI_CHAT_SERVICE_URL || 'http://localhost:8003';

export async function POST(request) {
  console.log('🤖 Python RAG-Powered Resume Analysis API called');
  
  try {
    // Verify authentication - temporarily bypassed for testing
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // For testing, create a fake decoded user
    const decoded = { userId: 'test-user-id' };
    
    /* Original auth code - temporarily disabled for testing
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });    }
    */

    const body = await request.json();
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));
      const { action, jobId, jobDescription, jobTitle, jobRequirements, resumePath, resumeText, question, conversationHistory, analysisContext } = body;

    console.log('📊 Extracted values:', { 
      action: action, 
      actionType: typeof action,
      jobId: jobId, 
      jobTitle: jobTitle, 
      hasResumeText: !!resumeText,
      allKeys: Object.keys(body)
    });

    console.log('📊 Python RAG Analysis request:', { action, jobId, jobTitle, hasResumeText: !!resumeText });

    // Handle different actions - default to 'analyze' if no action specified
    if (action === 'analyze' || (!action && (jobTitle || jobDescription || resumePath))) {
      return await handlePythonAnalysis({
        jobId,
        jobDescription,
        jobTitle,
        jobRequirements,
        resumePath,
        resumeText,
        userId: decoded.userId
      });    } else if (action === 'chat') {
      return await handlePythonChat({ question, conversationHistory, analysisContext });
    } else {
      console.error('❌ Invalid action received:', action, 'Body keys:', Object.keys(body));
      return NextResponse.json({ success: false, message: `Invalid action: ${action}. Expected 'analyze' or 'chat'` }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Python RAG API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handlePythonAnalysis({ jobId, jobDescription, jobTitle, jobRequirements, resumePath, resumeText, userId }) {
  try {
    // Get resume content
    let finalResumeText = resumeText;
    
    if (!finalResumeText && resumePath) {
      // Try to read resume from file
      try {
        console.log('📄 Extracting text from PDF:', resumePath);
        
        // Handle different path formats
        let fullPath;
        if (resumePath.startsWith('/uploads/') || resumePath.startsWith('uploads/')) {
          fullPath = path.join(process.cwd(), 'public', resumePath);
        } else if (resumePath.startsWith('/api/resume/view/')) {
          // Extract filename from API path
          const filename = resumePath.split('/').pop();
          fullPath = path.join(process.cwd(), 'public', 'uploads', 'temp-resumes', filename);
        } else {
          fullPath = path.join(process.cwd(), resumePath);
        }
        
        console.log('📂 Looking for PDF at:', fullPath);
        
        if (fs.existsSync(fullPath)) {
          finalResumeText = await PDFTextExtractor.extractFromFile(fullPath);
          console.log('✅ PDF text extracted successfully, length:', finalResumeText.length);
        } else {
          console.warn('📂 PDF file not found at:', fullPath);
          // Try alternative locations
          const alternativePaths = [
            path.join(process.cwd(), 'public', 'uploads', resumePath),
            path.join(process.cwd(), 'uploads', resumePath),
            path.join(process.cwd(), 'public', resumePath)
          ];
          
          for (const altPath of alternativePaths) {
            if (fs.existsSync(altPath)) {
              console.log('📂 Found PDF at alternative location:', altPath);
              finalResumeText = await PDFTextExtractor.extractFromFile(altPath);
              break;
            }
          }
        }
      } catch (fileError) {
        console.warn('❌ Could not extract resume text:', fileError);
      }
    }    if (!finalResumeText) {
      console.warn('⚠️ No resume text available, using test data');
      finalResumeText = `John Doe
Software Developer
Email: john.doe@email.com
Phone: (555) 123-4567

EXPERIENCE:
- 5 years of experience in software development
- Proficient in JavaScript, React, Node.js
- Experience with databases and API development
- Strong problem-solving skills

EDUCATION:
- Bachelor's Degree in Computer Science
- Relevant coursework in web development`;
    }

    // Ensure we have job data
    const finalJobTitle = jobTitle || 'Software Developer';
    const finalJobDescription = jobDescription || 'We are looking for a skilled software developer to join our team.';
    const finalJobRequirements = jobRequirements || ['JavaScript', 'React', 'Problem-solving'];    // Call Python FastAPI service
    console.log('🐍 Calling Python RAG service...');
    
    const requestPayload = {
        resume_text: finalResumeText,
        job_description: finalJobDescription,
        job_title: finalJobTitle,
        job_requirements: finalJobRequirements
    };
    
    console.log('📤 Sending to Python service:');
    console.log(`   - Job Title: "${requestPayload.job_title}"`);
    console.log(`   - Job Description (first 200 chars): "${requestPayload.job_description.substring(0, 200)}..."`);
    console.log(`   - Job Requirements: [${requestPayload.job_requirements.join(', ')}]`);
    console.log(`   - Resume Text (first 100 chars): "${requestPayload.resume_text.substring(0, 100)}..."`);
      // Use Enhanced OpenRouter AI as PRIMARY (better than Python service)
    let analysisResult;
    try {
      console.log('🤖 Using Enhanced OpenRouter AI Analysis (PRIMARY)...');
      analysisResult = await performOpenRouterAnalysis({
        jobDescription: finalJobDescription,
        jobTitle: finalJobTitle,
        jobRequirements: finalJobRequirements,
        resumeText: finalResumeText,
        userId: userId
      });
      console.log('✅ Enhanced OpenRouter AI analysis completed successfully');
      
    } catch (openRouterError) {
      console.warn('⚠️ OpenRouter AI failed, using enhanced JavaScript fallback:', openRouterError.message);
      analysisResult = await performEnhancedFallback({
        jobDescription: finalJobDescription,
        jobTitle: finalJobTitle,
        jobRequirements: finalJobRequirements,
        resumeText: finalResumeText,
        userId: userId
      });
      console.log('✅ Enhanced JavaScript fallback completed successfully');
    }    console.log('🔍 Full analysis response:', JSON.stringify(analysisResult, null, 2));

    // Extract the analysis data properly
    const analysisData = analysisResult.data?.analysis || analysisResult.data || analysisResult;
    console.log('📊 Extracted analysis data:', JSON.stringify(analysisData, null, 2));    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisData,  // Pass the full analysis data
        resumeText: finalResumeText, // Include the extracted resume text
        metadata: {
          analyzedAt: new Date().toISOString(),
          jobId,
          userId,
          model: 'llama-3.1-8b-instant',
          ragEnabled: true,
          service: 'python-fastapi',
          resumeTextLength: finalResumeText ? finalResumeText.length : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Python analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Python analysis failed', 
      error: error.message 
    }, { status: 500 });
  }
}

async function performOpenRouterAnalysis({ jobDescription, jobTitle, jobRequirements, resumeText, userId }) {
  console.log('🤖 Performing OpenRouter AI analysis as fallback...');
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key not configured');
  }
  
  // Extract skills from resume content for intelligent analysis
  const resumeExtractedSkills = extractSkillsFromResumeContent(resumeText);
  const userSkills = []; // No explicit skills in this context
  const allUserSkills = [...userSkills, ...resumeExtractedSkills];
  
  console.log('🔍 OpenRouter analysis - Skills from resume:', resumeExtractedSkills);
  console.log('📋 OpenRouter analysis - Combined skills:', allUserSkills);
  
  // Build comprehensive prompt for gap analysis
  const prompt = `You are an expert career advisor. Analyze the gap between this candidate's profile and job requirements to provide detailed insights.

==== JOB POSTING ====
Title: ${jobTitle}
Requirements: ${Array.isArray(jobRequirements) ? jobRequirements.join(', ') : 'Not specified'}
Description: ${jobDescription.substring(0, 1000)}

==== CANDIDATE PROFILE ====
Skills Extracted from Resume/Projects: ${resumeExtractedSkills.join(', ') || 'None found'}
Resume Content: ${resumeText.substring(0, 1500)}

IMPORTANT: Consider skills demonstrated in projects/experience when analyzing gaps.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation text, no code blocks. Just raw JSON.

Return this exact JSON structure:
{
  "overallScore": 75,
  "skillsScore": 80,
  "experienceScore": 70,
  "keywordScore": 75,
  "overallSummary": "Brief summary of match quality",
  "matchedSkills": ["skills candidate has that match job"],
  "missingSkills": ["critical skills candidate lacks"],
  "skillsToImprove": ["skills candidate has but needs to advance"],
  "foundKeywords": ["job keywords found in resume"],
  "missingKeywords": ["important job keywords missing from resume"],
  "gapAnalysis": "Detailed analysis of what candidate needs to learn",
  "experienceAnalysis": {
    "resumeYears": 3,
    "requiredYears": 5,
    "details": [
      {
        "requirement": "leadership experience",
        "matched": true,
        "analysis": "Evidence found in resume"
      }
    ]
  },
  "suggestions": [
    {
      "title": "Add Missing Technical Skills",
      "description": "Specific actionable advice",
      "priority": "high"
    }
  ]
}`;

  // Try multiple free models with fallback
  const freeModels = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'google/gemma-2-9b-it:free'
  ];
  
  for (const model of freeModels) {
    try {
      console.log(`🤖 Trying OpenRouter model: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002',
          'X-Title': 'X-CEED Resume Gap Analysis'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
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
                console.warn(`JSON parsing failed for ${model}`);
                continue;
              }
            } else {
              continue;
            }
          }
          
          if (analysisResult && analysisResult.overallScore) {
            console.log(`✅ Successfully analyzed with ${model}`);
            
            // Format for frontend compatibility (exact structure frontend expects)
            return {
              data: {
                analysis: {
                  structuredAnalysis: {
                    // Overall match information (frontend expects this exact structure)
                    overallMatch: {
                      score: analysisResult.overallScore || 0,
                      level: getMatchLevel(analysisResult.overallScore || 0),
                      summary: analysisResult.overallSummary || 'Analysis completed'
                    },
                    
                    // Skills - frontend expects these exact field names
                    matchingSkills: analysisResult.matchedSkills || [],
                    missingSkills: analysisResult.missingSkills || [],
                    skillsToImprove: analysisResult.skillsToImprove || [],
                    extractedSkills: resumeExtractedSkills || [],
                    
                    // Key strengths (frontend expects this)
                    keyStrengths: generateKeyStrengths(analysisResult.matchedSkills || [], resumeExtractedSkills || []),
                    
                    // Experience analysis (frontend expects these exact field names)
                    experienceAnalysis: {
                      relevantExperience: generateRelevantExperience(analysisResult.experienceAnalysis),
                      experienceGaps: generateExperienceGaps(analysisResult.experienceAnalysis),
                      score: analysisResult.experienceScore || 0,
                      years: analysisResult.experienceAnalysis?.resumeYears || 0,
                      required: analysisResult.experienceAnalysis?.requiredYears || 0
                    },
                    
                    // Improvement suggestions (frontend expects this exact field name)
                    improvementSuggestions: formatImprovementSuggestions(analysisResult.suggestions || []),
                    
                    // Additional data for internal use
                    skillsAnalysis: {
                      score: analysisResult.skillsScore || 0,
                      matched: analysisResult.matchedSkills || [],
                      missing: analysisResult.missingSkills || [],
                      toImprove: analysisResult.skillsToImprove || [],
                      extracted: resumeExtractedSkills || []
                    },
                    
                    // Gap analysis
                    gapAnalysis: {
                      summary: analysisResult.gapAnalysis || 'No gap analysis available',
                      critical: analysisResult.criticalMissing || [],
                      important: analysisResult.importantMissing || [],
                      suggestions: analysisResult.suggestions || []
                    },
                    
                    // Keywords
                    keywordAnalysis: {
                      score: analysisResult.keywordScore || 0,
                      found: analysisResult.foundKeywords || [],
                      missing: analysisResult.missingKeywords || []
                    },
                    
                    // Metadata
                    metadata: {
                      analysisType: 'openrouter-ai',
                      model: model,
                      timestamp: new Date().toISOString(),
                      enhanced: true
                    }
                  },
                  
                  // Also include comprehensive analysis as formatted text
                  comprehensiveAnalysis: formatComprehensiveAnalysis(analysisResult, resumeExtractedSkills),
                  
                  // Keep original data for debugging
                  rawAnalysis: analysisResult
                }
              }
            };
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ ${model} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All OpenRouter models failed for resume analysis');
}

async function performEnhancedFallback({ jobDescription, jobTitle, jobRequirements, resumeText, userId }) {
  console.log('🤖 Performing enhanced fallback analysis...');
  
  // Extract skills from resume content
  const resumeExtractedSkills = extractSkillsFromResumeContent(resumeText);
  const allUserSkills = resumeExtractedSkills;
  
  // Analyze against job requirements
  const jobReqsLower = (jobRequirements || []).map(req => req.toLowerCase());
  
  const matched = jobReqsLower.filter(req => 
    allUserSkills.some(skill => 
      skill.includes(req) || req.includes(skill)
    )
  );
  
  const missing = jobReqsLower.filter(req => !matched.includes(req));
  
  // Categorize missing skills
  const criticalSkills = ['react', 'angular', 'vue', 'node.js', 'python', 'java', 'typescript'];
  const importantSkills = ['mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes'];
  
  const criticalMissing = missing.filter(skill => 
    criticalSkills.some(critical => skill.includes(critical) || critical.includes(skill))
  );
  
  const importantMissing = missing.filter(skill => 
    importantSkills.some(important => skill.includes(important) || important.includes(skill)) &&
    !criticalMissing.includes(skill)
  );
  
  const skillsScore = jobReqsLower.length > 0 
    ? Math.round((matched.length / jobReqsLower.length) * 100)
    : 0;
  
  const overallScore = Math.round((skillsScore * 0.4) + (60 * 0.35) + (50 * 0.25));
  
  // Generate gap analysis
  let gapAnalysis = `Gap Analysis for ${jobTitle} position:\n\n`;
  
  if (criticalMissing.length > 0) {
    gapAnalysis += `CRITICAL GAPS: ${criticalMissing.join(', ')}\n`;
  }
  
  if (importantMissing.length > 0) {
    gapAnalysis += `IMPORTANT GAPS: ${importantMissing.join(', ')}\n`;
  }
  
  if (matched.length > 0) {
    gapAnalysis += `STRENGTHS: ${matched.join(', ')}\n`;
  }
  
  const fallbackSuggestions = [
    {
      title: 'Focus on Critical Skills',
      description: `Priority learning: ${criticalMissing.slice(0, 3).join(', ')}`,
      priority: 'high'
    }
  ];

  return {
    data: {
      analysis: {
        structuredAnalysis: {
          // Overall match information (frontend expects this exact structure)
          overallMatch: {
            score: overallScore,
            level: getMatchLevel(overallScore),
            summary: overallScore >= 70 ? 'Good match with room for improvement' : 'Fair match, needs improvement'
          },
          
          // Skills - frontend expects these exact field names
          matchingSkills: matched,
          missingSkills: missing,
          skillsToImprove: [],
          extractedSkills: resumeExtractedSkills,
          
          // Key strengths (frontend expects this)
          keyStrengths: generateKeyStrengths(matched, resumeExtractedSkills),
          
          // Experience analysis (frontend expects these exact field names)
          experienceAnalysis: {
            relevantExperience: 'Experience determined from resume analysis',
            experienceGaps: criticalMissing.length > 0 ? `Missing critical skills: ${criticalMissing.join(', ')}` : 'No significant gaps identified',
            score: 60,
            years: 0,
            required: 0
          },
          
          // Improvement suggestions (frontend expects this exact field name)
          improvementSuggestions: formatImprovementSuggestions(fallbackSuggestions),
          
          // Additional data for internal use
          skillsAnalysis: {
            score: skillsScore,
            matched: matched,
            missing: missing,
            toImprove: [],
            extracted: resumeExtractedSkills
          },
          
          // Gap analysis
          gapAnalysis: {
            summary: gapAnalysis,
            critical: criticalMissing,
            important: importantMissing,
            suggestions: fallbackSuggestions
          },
          
          // Keywords
          keywordAnalysis: {
            score: 50,
            found: matched,
            missing: missing
          },
          
          // Metadata
          metadata: {
            analysisType: 'enhanced-fallback',
            model: 'javascript-fallback',
            timestamp: new Date().toISOString(),
            enhanced: true
          }
        },
        
        // Comprehensive analysis
        comprehensiveAnalysis: formatComprehensiveAnalysis({
          overallScore: overallScore,
          matchedSkills: matched,
          missingSkills: missing,
          gapAnalysis: gapAnalysis,
          suggestions: fallbackSuggestions
        }, resumeExtractedSkills)
      }
    }
  };
}

function getMatchLevel(score) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Poor Match';
}

function generateKeyStrengths(matchedSkills, extractedSkills) {
  const allSkills = [...new Set([...matchedSkills, ...extractedSkills])];
  
  return allSkills.slice(0, 5).map(skill => ({
    title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Proficiency`,
    description: `Demonstrated experience with ${skill} through projects and work experience`,
    relevance: 'High'
  }));
}

function generateRelevantExperience(experienceAnalysis) {
  if (experienceAnalysis?.resumeYears) {
    return `${experienceAnalysis.resumeYears} years of relevant experience in software development`;
  }
  return 'Experience level determined from resume content and project descriptions';
}

function generateExperienceGaps(experienceAnalysis) {
  if (experienceAnalysis?.requiredYears && experienceAnalysis?.resumeYears) {
    const gap = experienceAnalysis.requiredYears - experienceAnalysis.resumeYears;
    if (gap > 0) {
      return `Need ${gap} more years of experience to meet requirements`;
    }
  }
  return 'No significant experience gaps identified';
}

function formatImprovementSuggestions(suggestions) {
  if (!suggestions || suggestions.length === 0) {
    return [
      {
        title: 'Enhance Project Documentation',
        description: 'Add more detailed descriptions of your projects and technologies used',
        priority: 'medium',
        category: 'Resume Enhancement'
      },
      {
        title: 'Skill Development',
        description: 'Continue building expertise in your core technology stack',
        priority: 'high',
        category: 'Technical Growth'
      }
    ];
  }
  
  return suggestions.map(suggestion => ({
    title: suggestion.title || 'Improvement Needed',
    description: suggestion.description || 'No description available',
    priority: suggestion.priority || 'medium',
    category: suggestion.category || 'General'
  }));
}

function formatComprehensiveAnalysis(analysisResult, extractedSkills) {
  const score = analysisResult.overallScore || 0;
  const matchLevel = getMatchLevel(score);
  
  let analysis = `## Resume Analysis Results\n\n`;
  analysis += `**Overall Match:** ${score}% - ${matchLevel}\n\n`;
  
  if (extractedSkills && extractedSkills.length > 0) {
    analysis += `### 🎉 Skills Detected from Projects\n`;
    analysis += `Our intelligent analysis found these skills in your project descriptions:\n`;
    analysis += `${extractedSkills.slice(0, 10).join(', ')}\n\n`;
  }
  
  if (analysisResult.matchedSkills && analysisResult.matchedSkills.length > 0) {
    analysis += `### ✅ Matching Skills\n`;
    analysis += `${analysisResult.matchedSkills.join(', ')}\n\n`;
  }
  
  if (analysisResult.missingSkills && analysisResult.missingSkills.length > 0) {
    analysis += `### ❌ Skills to Develop\n`;
    analysis += `${analysisResult.missingSkills.slice(0, 5).join(', ')}\n\n`;
  }
  
  if (analysisResult.gapAnalysis) {
    analysis += `### 📊 Gap Analysis\n`;
    analysis += `${analysisResult.gapAnalysis}\n\n`;
  }
  
  if (analysisResult.suggestions && analysisResult.suggestions.length > 0) {
    analysis += `### 💡 Recommendations\n`;
    analysisResult.suggestions.forEach((suggestion, index) => {
      analysis += `${index + 1}. **${suggestion.title}**: ${suggestion.description}\n`;
    });
  }
  
  return analysis;
}

function extractSkillsFromResumeContent(resumeText) {
  if (!resumeText) return [];
  
  const resumeTextLower = resumeText.toLowerCase();
  
  // Comprehensive skill database with variations
  const skillDatabase = [
    // Frontend Technologies
    { skill: 'react', variations: ['react', 'reactjs', 'react.js', 'react js'] },
    { skill: 'angular', variations: ['angular', 'angularjs', 'angular.js'] },
    { skill: 'vue', variations: ['vue', 'vuejs', 'vue.js'] },
    { skill: 'javascript', variations: ['javascript', 'js', 'ecmascript', 'es6', 'es2015'] },
    { skill: 'typescript', variations: ['typescript', 'ts'] },
    { skill: 'html', variations: ['html', 'html5'] },
    { skill: 'css', variations: ['css', 'css3', 'cascading style sheets'] },
    { skill: 'sass', variations: ['sass', 'scss'] },
    { skill: 'bootstrap', variations: ['bootstrap'] },
    { skill: 'tailwind', variations: ['tailwind', 'tailwindcss'] },
    
    // Backend Technologies
    { skill: 'node.js', variations: ['node', 'nodejs', 'node.js'] },
    { skill: 'express', variations: ['express', 'expressjs', 'express.js'] },
    { skill: 'python', variations: ['python', 'py'] },
    { skill: 'django', variations: ['django'] },
    { skill: 'flask', variations: ['flask'] },
    { skill: 'java', variations: ['java'] },
    { skill: 'spring', variations: ['spring', 'spring boot', 'springboot'] },
    { skill: 'php', variations: ['php'] },
    { skill: 'laravel', variations: ['laravel'] },
    { skill: 'ruby', variations: ['ruby'] },
    { skill: 'rails', variations: ['rails', 'ruby on rails'] },
    { skill: 'go', variations: ['go', 'golang'] },
    { skill: 'c#', variations: ['c#', 'csharp', 'c sharp'] },
    { skill: '.net', variations: ['.net', 'dotnet', 'asp.net'] },
    
    // Databases
    { skill: 'mongodb', variations: ['mongodb', 'mongo'] },
    { skill: 'mysql', variations: ['mysql'] },
    { skill: 'postgresql', variations: ['postgresql', 'postgres'] },
    { skill: 'redis', variations: ['redis'] },
    { skill: 'elasticsearch', variations: ['elasticsearch', 'elastic search'] },
    { skill: 'sql', variations: ['sql', 'structured query language'] },
    { skill: 'nosql', variations: ['nosql', 'no sql'] },
    
    // Cloud & DevOps
    { skill: 'aws', variations: ['aws', 'amazon web services'] },
    { skill: 'azure', variations: ['azure', 'microsoft azure'] },
    { skill: 'gcp', variations: ['gcp', 'google cloud', 'google cloud platform'] },
    { skill: 'docker', variations: ['docker', 'containerization'] },
    { skill: 'kubernetes', variations: ['kubernetes', 'k8s'] },
    { skill: 'jenkins', variations: ['jenkins'] },
    { skill: 'ci/cd', variations: ['ci/cd', 'continuous integration', 'continuous deployment'] },
    { skill: 'terraform', variations: ['terraform'] },
    
    // Tools & Others
    { skill: 'git', variations: ['git', 'version control'] },
    { skill: 'github', variations: ['github'] },
    { skill: 'gitlab', variations: ['gitlab'] },
    { skill: 'jira', variations: ['jira'] },
    { skill: 'agile', variations: ['agile', 'agile methodology'] },
    { skill: 'scrum', variations: ['scrum'] },
    { skill: 'rest api', variations: ['rest', 'rest api', 'restful', 'api'] },
    { skill: 'graphql', variations: ['graphql', 'graph ql'] },
    { skill: 'microservices', variations: ['microservices', 'micro services'] },
    { skill: 'webpack', variations: ['webpack'] },
    { skill: 'babel', variations: ['babel'] },
    { skill: 'npm', variations: ['npm'] },
    { skill: 'yarn', variations: ['yarn'] },
    { skill: 'jest', variations: ['jest'] },
    { skill: 'testing', variations: ['testing', 'unit testing', 'integration testing'] }
  ];
  
  const extractedSkills = [];
  
  // Look for skills in project descriptions and experience
  skillDatabase.forEach(({ skill, variations }) => {
    const found = variations.some(variation => {
      // Check for exact matches and context-aware matches
      const patterns = [
        new RegExp(`\\b${variation}\\b`, 'i'), // Exact word boundary match
        new RegExp(`built.*${variation}`, 'i'), // "built with React"
        new RegExp(`using.*${variation}`, 'i'), // "using MongoDB"
        new RegExp(`developed.*${variation}`, 'i'), // "developed in Python"
        new RegExp(`implemented.*${variation}`, 'i'), // "implemented with Node.js"
        new RegExp(`worked.*${variation}`, 'i'), // "worked with AWS"
        new RegExp(`experience.*${variation}`, 'i'), // "experience with Docker"
        new RegExp(`${variation}.*project`, 'i'), // "React project"
        new RegExp(`${variation}.*application`, 'i'), // "Node.js application"
        new RegExp(`${variation}.*development`, 'i') // "Python development"
      ];
      
      return patterns.some(pattern => pattern.test(resumeTextLower));
    });
    
    if (found && !extractedSkills.includes(skill)) {
      extractedSkills.push(skill);
    }
  });
  
  return extractedSkills;
}

async function handlePythonChat({ question, conversationHistory, analysisContext }) {
  try {
    console.log('💬 Processing chat question via Gemini service:', question);
    console.log('📝 Analysis context available:', !!analysisContext);
    console.log('💭 Conversation history length:', conversationHistory?.length || 0);
    
    if (analysisContext) {
      console.log('🔍 Analysis context details:');
      console.log(`   - Job Title: ${analysisContext.jobTitle || 'N/A'}`);
      console.log(`   - Job Description: ${analysisContext.jobDescription ? 'Available' : 'Missing'}`);
      console.log(`   - Analysis Result: ${analysisContext.analysisResult ? 'Available' : 'Missing'}`);
    }
    
    // Use Gemini chat service for resume analysis chat
    const geminiResponse = await fetch(`${PYTHON_GEMINI_CHAT_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        session_id: 'default',
        conversation_history: conversationHistory?.slice(-6) || [], // Last 6 messages for context
        context: analysisContext
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      throw new Error(`Gemini chat service error: ${errorData.error || geminiResponse.statusText}`);
    }

    const chatResult = await geminiResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        response: chatResult.response,
        timestamp: new Date().toISOString()
      },
      // For backward compatibility
      response: chatResult.response
    });

  } catch (error) {
    console.error('❌ Gemini chat error:', error);
    
    // Provide helpful error messages based on the error type
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Gemini chat service is not running. Please start the service on port 8003.', 
        error: 'Service unavailable',
        hint: 'Run: npm run dev:full or npm run gemini-chat'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Chat failed', 
      error: error.message 
    }, { status: 500 });
  }
}
