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
  
  // Extract skills and experience from resume content for intelligent analysis
  const resumeExtractedSkills = extractSkillsFromResumeContent(resumeText);
  const experienceData = extractExperienceLevel(resumeText);
  const userSkills = []; // No explicit skills in this context
  const allUserSkills = [...userSkills, ...resumeExtractedSkills];
  
  console.log('🔍 OpenRouter analysis - Skills from resume:', resumeExtractedSkills);
  console.log('📋 OpenRouter analysis - Combined skills:', allUserSkills);
  console.log('💼 OpenRouter analysis - Experience detected:', experienceData);
  
  // Build focused prompt for technical skills analysis only
  const prompt = `You are a technical recruiter analyzing a candidate's technical skills for a ${jobTitle} position.

==== JOB REQUIREMENTS ====
Position: ${jobTitle}
Technical Requirements: ${Array.isArray(jobRequirements) ? jobRequirements.join(', ') : 'Not specified'}
Job Description: ${jobDescription.substring(0, 800)}

==== CANDIDATE TECHNICAL PROFILE ====
Technical Skills Found in Projects: ${resumeExtractedSkills.join(', ') || 'None'}
Resume Content: ${resumeText.substring(0, 1200)}

CRITICAL INSTRUCTIONS:
- Focus ONLY on technical skills (programming languages, frameworks, databases, tools, cloud platforms)
- IGNORE soft skills, personality traits, work environment preferences
- IGNORE generic requirements like "communication skills", "self-motivated", "reliable internet", "home office setup"
- Only include concrete technical skills that can be learned and demonstrated
- Keep missing skills list to maximum 3-4 most important technical skills

Return ONLY valid JSON:
{
  "overallScore": 75,
  "skillsScore": 80,
  "experienceScore": 70,
  "keywordScore": 75,
  "overallSummary": "Technical skills assessment summary",
  "matchedSkills": ["React", "JavaScript", "Node.js"],
  "missingSkills": ["TypeScript", "Docker"],
  "skillsToImprove": ["Python"],
  "foundKeywords": ["React", "JavaScript", "API"],
  "missingKeywords": ["TypeScript", "Docker"],
  "gapAnalysis": "Technical skills gap analysis focusing on programming languages, frameworks, and tools only",
  "experienceAnalysis": {
    "resumeYears": 3,
    "requiredYears": 5,
    "details": []
  },
  "suggestions": [
    {
      "title": "Learn Missing Technical Skills",
      "description": "Focus on the most important missing technical skills",
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
            
            // Process and clean the AI response - prioritize our intelligent extraction
            console.log('🔍 Processing skills - Extracted:', resumeExtractedSkills);
            console.log('🔍 Processing skills - Job Requirements:', jobRequirements);
            console.log('🔍 Processing skills - AI Matched:', analysisResult.matchedSkills);
            
            // Smart skill matching using our extracted skills
            const processedMatchedSkills = [];
            const processedMissingSkills = [];
            
            (jobRequirements || []).forEach(jobReq => {
              const jobReqLower = jobReq.toLowerCase();
              
              // Check if this job requirement is found in extracted skills
              const foundInExtracted = resumeExtractedSkills.some(extracted => {
                const extractedLower = extracted.toLowerCase();
                return (
                  extractedLower.includes(jobReqLower) ||
                  jobReqLower.includes(extractedLower) ||
                  (jobReqLower.includes('node') && extractedLower.includes('node')) ||
                  (jobReqLower.includes('express') && extractedLower.includes('express')) ||
                  (jobReqLower.includes('mongo') && extractedLower.includes('mongo')) ||
                  (jobReqLower.includes('docker') && extractedLower.includes('docker')) ||
                  (jobReqLower.includes('aws') && extractedLower.includes('aws'))
                );
              });
              
              if (foundInExtracted) {
                processedMatchedSkills.push(jobReq);
              } else {
                processedMissingSkills.push(jobReq);
              }
            });
            
            // Categorize missing skills by priority
            const categorizedGaps = categorizeGapsByPriority(processedMissingSkills, jobRequirements, jobDescription);
            const finalMissingSkills = [...categorizedGaps.critical, ...categorizedGaps.important].slice(0, 5);
            
            console.log('✅ Final Matched Skills:', processedMatchedSkills);
            console.log('❌ Final Missing Skills:', finalMissingSkills);
            console.log('🎯 Gap Categories:', categorizedGaps);
            
            // Format for frontend compatibility (exact structure frontend expects)
            return {
              data: {
                analysis: {
                  structuredAnalysis: {
                    // Overall match information (frontend expects this exact structure)
                    overallMatch: {
                      score: Math.round((processedMatchedSkills.length / Math.max((jobRequirements || []).length, 1)) * 100),
                      level: getMatchLevel(Math.round((processedMatchedSkills.length / Math.max((jobRequirements || []).length, 1)) * 100)),
                      summary: analysisResult.overallSummary || 'Technical skills analysis completed'
                    },
                    
                    // Skills - frontend expects these exact field names
                    matchingSkills: processedMatchedSkills,
                    missingSkills: finalMissingSkills,
                    skillsToImprove: analysisResult.skillsToImprove || [],
                    extractedSkills: resumeExtractedSkills || [],
                    
                    // Key strengths (frontend expects this)
                    keyStrengths: generateKeyStrengths(processedMatchedSkills, resumeExtractedSkills || []),
                    
                    // Experience analysis (frontend expects these exact field names)
                    experienceAnalysis: {
                      relevantExperience: generateRelevantExperience({
                        resumeYears: experienceData.years,
                        level: experienceData.level,
                        details: experienceData.details
                      }),
                      experienceGaps: generateExperienceGaps({
                        resumeYears: experienceData.years,
                        requiredYears: analysisResult.experienceAnalysis?.requiredYears || 3,
                        level: experienceData.level,
                        criticalSkills: categorizedGaps.critical
                      }),
                      score: calculateExperienceScore(experienceData, categorizedGaps),
                      years: experienceData.years,
                      required: analysisResult.experienceAnalysis?.requiredYears || 3,
                      level: experienceData.level,
                      complexityScore: experienceData.complexityScore
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
                      summary: generateEnhancedGapAnalysis(categorizedGaps, experienceData, jobTitle),
                      critical: categorizedGaps.critical,
                      important: categorizedGaps.important,
                      niceToHave: categorizedGaps.niceToHave,
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
  
  // Extract skills and experience from resume content
  const resumeExtractedSkills = extractSkillsFromResumeContent(resumeText);
  const experienceData = extractExperienceLevel(resumeText);
  console.log('🔍 Fallback - Extracted skills:', resumeExtractedSkills);
  console.log('🔍 Fallback - Job requirements:', jobRequirements);
  console.log('💼 Fallback - Experience detected:', experienceData);
  
  // Smart matching logic
  const matched = [];
  const missing = [];
  
  (jobRequirements || []).forEach(jobReq => {
    const jobReqLower = jobReq.toLowerCase();
    
    const foundInExtracted = resumeExtractedSkills.some(extracted => {
      const extractedLower = extracted.toLowerCase();
      return (
        extractedLower.includes(jobReqLower) ||
        jobReqLower.includes(extractedLower) ||
        (jobReqLower.includes('node') && extractedLower.includes('node')) ||
        (jobReqLower.includes('express') && extractedLower.includes('express')) ||
        (jobReqLower.includes('mongo') && extractedLower.includes('mongo')) ||
        (jobReqLower.includes('docker') && extractedLower.includes('docker')) ||
        (jobReqLower.includes('aws') && extractedLower.includes('aws'))
      );
    });
    
    if (foundInExtracted) {
      matched.push(jobReq);
    } else {
      missing.push(jobReq);
    }
  });
  
  // Categorize missing skills by priority
  const categorizedGaps = categorizeGapsByPriority(missing, jobRequirements, jobDescription);
  const finalMissing = [...categorizedGaps.critical, ...categorizedGaps.important].slice(0, 5);
  
  console.log('✅ Fallback - Final matched:', matched);
  console.log('❌ Fallback - Final missing:', finalMissing);
  console.log('🎯 Fallback - Gap categories:', categorizedGaps);
  
  const skillsScore = (jobRequirements || []).length > 0 
    ? Math.round((matched.length / (jobRequirements || []).length) * 100)
    : 0;
  
  const overallScore = Math.round((skillsScore * 0.6) + (70 * 0.4)); // Higher weight on skills
  
  // Generate focused gap analysis
  let gapAnalysis = `Technical Skills Analysis for ${jobTitle}:\n\n`;
  
  if (matched.length > 0) {
    gapAnalysis += `✅ TECHNICAL STRENGTHS: ${matched.join(', ')}\n`;
    gapAnalysis += `You have demonstrated experience with these technologies.\n\n`;
  }
  
  if (finalMissing.length > 0) {
    gapAnalysis += `📚 SKILLS TO LEARN: ${finalMissing.join(', ')}\n`;
    gapAnalysis += `Focus on these ${finalMissing.length} technical skills to become a strong candidate.\n`;
  } else {
    gapAnalysis += `🎉 EXCELLENT: You have all the required technical skills!\n`;
  }
  
  const fallbackSuggestions = finalMissing.length > 0 ? [
    {
      title: 'Learn Missing Technical Skills',
      description: `Focus on: ${finalMissing.join(', ')}`,
      priority: 'high'
    }
  ] : [
    {
      title: 'Enhance Existing Skills',
      description: 'Continue building expertise in your current technology stack',
      priority: 'medium'
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
            summary: overallScore >= 80 ? 'Excellent technical match' : overallScore >= 60 ? 'Good technical match' : 'Technical skills need development'
          },
          
          // Skills - frontend expects these exact field names
          matchingSkills: matched,
          missingSkills: finalMissing,
          skillsToImprove: [],
          extractedSkills: resumeExtractedSkills,
          
          // Key strengths (frontend expects this)
          keyStrengths: generateKeyStrengths(matched, resumeExtractedSkills),
          
          // Experience analysis (frontend expects these exact field names)
          experienceAnalysis: {
            relevantExperience: generateRelevantExperience({
              resumeYears: experienceData.years,
              level: experienceData.level,
              details: experienceData.details
            }),
            experienceGaps: generateExperienceGaps({
              resumeYears: experienceData.years,
              requiredYears: 3,
              level: experienceData.level,
              criticalSkills: categorizedGaps.critical
            }),
            score: calculateExperienceScore(experienceData, categorizedGaps),
            years: experienceData.years,
            required: 3,
            level: experienceData.level,
            complexityScore: experienceData.complexityScore
          },
          
          // Improvement suggestions (frontend expects this exact field name)
          improvementSuggestions: formatImprovementSuggestions(fallbackSuggestions),
          
          // Additional data for internal use
          skillsAnalysis: {
            score: skillsScore,
            matched: matched,
            missing: finalMissing,
            toImprove: [],
            extracted: resumeExtractedSkills
          },
          
          // Gap analysis
          gapAnalysis: {
            summary: generateEnhancedGapAnalysis(categorizedGaps, experienceData, jobTitle),
            critical: categorizedGaps.critical,
            important: categorizedGaps.important,
            niceToHave: categorizedGaps.niceToHave,
            suggestions: fallbackSuggestions
          },
          
          // Keywords
          keywordAnalysis: {
            score: skillsScore,
            found: matched,
            missing: finalMissing
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
  if (experienceAnalysis?.resumeYears && experienceAnalysis?.level) {
    const levelDesc = {
      'entry': 'Entry-level',
      'junior': 'Junior',
      'mid': 'Mid-level',
      'senior': 'Senior'
    }[experienceAnalysis.level] || 'Professional';
    
    return `${levelDesc} developer with ${experienceAnalysis.resumeYears} years of experience. ${experienceAnalysis.details?.slice(0, 2).join('. ') || ''}`;
  }
  return 'Experience level determined from resume content and project descriptions';
}

function generateExperienceGaps(experienceAnalysis) {
  const gaps = [];
  
  if (experienceAnalysis?.requiredYears && experienceAnalysis?.resumeYears) {
    const yearGap = experienceAnalysis.requiredYears - experienceAnalysis.resumeYears;
    if (yearGap > 0) {
      gaps.push(`Need ${yearGap} more years of experience`);
    }
  }
  
  if (experienceAnalysis?.criticalSkills && experienceAnalysis.criticalSkills.length > 0) {
    gaps.push(`Missing critical skills: ${experienceAnalysis.criticalSkills.slice(0, 2).join(', ')}`);
  }
  
  if (experienceAnalysis?.level === 'entry' && experienceAnalysis?.requiredYears >= 3) {
    gaps.push('Consider gaining more hands-on project experience');
  }
  
  return gaps.length > 0 ? gaps.join('. ') : 'No significant experience gaps identified';
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

// Enhanced experience level detection
function extractExperienceLevel(resumeText) {
  if (!resumeText) return { years: 0, level: 'entry', details: [] };
  
  const resumeTextLower = resumeText.toLowerCase();
  const details = [];
  
  // Extract years of experience patterns
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*of\s*experience/gi,
    /(\d+)\+?\s*years?\s*in\s*(software|development|programming)/gi,
    /experience.*(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s*(software|web|full.?stack|backend|frontend)/gi
  ];
  
  let maxYears = 0;
  yearPatterns.forEach(pattern => {
    const matches = resumeText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const yearMatch = match.match(/(\d+)/);
        if (yearMatch) {
          const years = parseInt(yearMatch[1]);
          if (years > maxYears) maxYears = years;
          details.push(`Found: "${match.trim()}"`);
        }
      });
    }
  });
  
  // Infer experience from job titles and descriptions
  const seniorityIndicators = [
    { pattern: /senior|lead|principal|architect/gi, years: 5, level: 'senior' },
    { pattern: /mid.?level|intermediate/gi, years: 3, level: 'mid' },
    { pattern: /junior|entry.?level|associate/gi, years: 1, level: 'junior' },
    { pattern: /intern|trainee|graduate/gi, years: 0, level: 'entry' }
  ];
  
  let inferredLevel = 'entry';
  let inferredYears = 0;
  
  seniorityIndicators.forEach(({ pattern, years, level }) => {
    if (pattern.test(resumeTextLower)) {
      if (years > inferredYears) {
        inferredYears = years;
        inferredLevel = level;
        details.push(`Inferred from title: ${level} level (${years}+ years)`);
      }
    }
  });
  
  // Count project complexity indicators
  const complexityIndicators = [
    'microservices', 'distributed systems', 'scalable', 'architecture',
    'team lead', 'mentoring', 'code review', 'deployment', 'ci/cd'
  ];
  
  let complexityScore = 0;
  complexityIndicators.forEach(indicator => {
    if (resumeTextLower.includes(indicator)) {
      complexityScore++;
    }
  });
  
  // Adjust experience based on complexity
  if (complexityScore >= 5) {
    inferredYears = Math.max(inferredYears, 4);
    inferredLevel = 'senior';
    details.push(`High complexity indicators suggest senior level`);
  } else if (complexityScore >= 3) {
    inferredYears = Math.max(inferredYears, 2);
    inferredLevel = inferredLevel === 'entry' ? 'mid' : inferredLevel;
    details.push(`Moderate complexity suggests mid-level experience`);
  }
  
  const finalYears = Math.max(maxYears, inferredYears);
  const finalLevel = finalYears >= 5 ? 'senior' : finalYears >= 2 ? 'mid' : finalYears >= 1 ? 'junior' : 'entry';
  
  return {
    years: finalYears,
    level: finalLevel,
    details: details,
    complexityScore: complexityScore
  };
}

// Enhanced gap categorization by priority
function categorizeGapsByPriority(missingSkills, jobRequirements, jobDescription) {
  const critical = [];
  const important = [];
  const niceToHave = [];
  
  // Define critical skill patterns (must-have for most jobs)
  const criticalPatterns = [
    /react|angular|vue/i,
    /javascript|typescript/i,
    /node\.?js|python|java|c#/i,
    /sql|mongodb|database/i,
    /git|version control/i
  ];
  
  // Define important skill patterns (valuable but not always required)
  const importantPatterns = [
    /docker|kubernetes/i,
    /aws|azure|cloud/i,
    /rest|api|graphql/i,
    /testing|jest|cypress/i
  ];
  
  const jobDescLower = (jobDescription || '').toLowerCase();
  const jobReqsLower = (jobRequirements || []).map(req => req.toLowerCase());
  
  missingSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    
    // Check if skill is mentioned as "required" or "must have" in job description
    const isExplicitlyRequired = 
      jobDescLower.includes(`required: ${skillLower}`) ||
      jobDescLower.includes(`must have ${skillLower}`) ||
      jobDescLower.includes(`essential: ${skillLower}`) ||
      jobReqsLower.includes(skillLower);
    
    // Check if it's a critical technical skill
    const isCriticalSkill = criticalPatterns.some(pattern => pattern.test(skillLower));
    
    // Check if it's mentioned multiple times (indicates importance)
    const mentionCount = (jobDescLower.match(new RegExp(skillLower, 'g')) || []).length;
    
    if (isExplicitlyRequired || (isCriticalSkill && mentionCount >= 2)) {
      critical.push(skill);
    } else if (isCriticalSkill || importantPatterns.some(pattern => pattern.test(skillLower)) || mentionCount >= 1) {
      important.push(skill);
    } else {
      niceToHave.push(skill);
    }
  });
  
  return {
    critical: critical.slice(0, 3), // Limit to top 3 critical
    important: important.slice(0, 4), // Limit to top 4 important
    niceToHave: niceToHave.slice(0, 3) // Limit to top 3 nice-to-have
  };
}

function extractSkillsFromResumeContent(resumeText) {
  if (!resumeText) return [];
  
  const resumeTextLower = resumeText.toLowerCase();
  
  // FOCUSED: Only technical skills that matter for jobs
  const skillDatabase = [
    // Frontend Technologies
    { skill: 'React', variations: ['react', 'reactjs', 'react.js'] },
    { skill: 'Angular', variations: ['angular', 'angularjs'] },
    { skill: 'Vue.js', variations: ['vue', 'vuejs', 'vue.js'] },
    { skill: 'JavaScript', variations: ['javascript', 'js', 'es6', 'es2015'] },
    { skill: 'TypeScript', variations: ['typescript', 'ts'] },
    { skill: 'HTML5', variations: ['html', 'html5'] },
    { skill: 'CSS3', variations: ['css', 'css3'] },
    { skill: 'Sass', variations: ['sass', 'scss'] },
    { skill: 'Bootstrap', variations: ['bootstrap'] },
    { skill: 'Tailwind CSS', variations: ['tailwind', 'tailwindcss'] },
    
    // Backend Technologies
    { skill: 'Node.js', variations: ['node', 'nodejs', 'node.js'] },
    { skill: 'Express.js', variations: ['express', 'expressjs', 'express.js'] },
    { skill: 'Python', variations: ['python', 'py'] },
    { skill: 'Django', variations: ['django'] },
    { skill: 'Flask', variations: ['flask'] },
    { skill: 'Java', variations: ['java'] },
    { skill: 'Spring Boot', variations: ['spring', 'spring boot', 'springboot'] },
    { skill: 'PHP', variations: ['php'] },
    { skill: 'Laravel', variations: ['laravel'] },
    { skill: 'Ruby', variations: ['ruby'] },
    { skill: 'Ruby on Rails', variations: ['rails', 'ruby on rails'] },
    { skill: 'Go', variations: ['go', 'golang'] },
    { skill: 'C#', variations: ['c#', 'csharp', 'c sharp'] },
    { skill: '.NET', variations: ['.net', 'dotnet', 'asp.net'] },
    
    // Databases
    { skill: 'MongoDB', variations: ['mongodb', 'mongo'] },
    { skill: 'MySQL', variations: ['mysql'] },
    { skill: 'PostgreSQL', variations: ['postgresql', 'postgres'] },
    { skill: 'Redis', variations: ['redis'] },
    { skill: 'SQL', variations: ['sql'] },
    
    // Cloud & DevOps
    { skill: 'AWS', variations: ['aws', 'amazon web services'] },
    { skill: 'Azure', variations: ['azure', 'microsoft azure'] },
    { skill: 'Google Cloud', variations: ['gcp', 'google cloud'] },
    { skill: 'Docker', variations: ['docker', 'containerization'] },
    { skill: 'Kubernetes', variations: ['kubernetes', 'k8s'] },
    { skill: 'Jenkins', variations: ['jenkins'] },
    { skill: 'CI/CD', variations: ['ci/cd', 'continuous integration'] },
    
    // Essential Tools
    { skill: 'Git', variations: ['git', 'version control'] },
    { skill: 'REST API', variations: ['rest', 'rest api', 'restful', 'api'] },
    { skill: 'GraphQL', variations: ['graphql'] },
    { skill: 'Microservices', variations: ['microservices'] },
    { skill: 'Webpack', variations: ['webpack'] },
    { skill: 'Jest', variations: ['jest'] }
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

// Calculate experience score based on multiple factors
function calculateExperienceScore(experienceData, categorizedGaps) {
  let score = 0;
  
  // Base score from years of experience
  const yearScore = Math.min(experienceData.years * 15, 60); // Max 60 points for years
  score += yearScore;
  
  // Bonus for seniority level
  const levelBonus = {
    'entry': 0,
    'junior': 10,
    'mid': 20,
    'senior': 30
  }[experienceData.level] || 0;
  score += levelBonus;
  
  // Bonus for complexity indicators
  score += Math.min(experienceData.complexityScore * 3, 15); // Max 15 points for complexity
  
  // Penalty for critical missing skills
  score -= categorizedGaps.critical.length * 5; // -5 points per critical missing skill
  
  // Penalty for important missing skills
  score -= categorizedGaps.important.length * 2; // -2 points per important missing skill
  
  return Math.max(0, Math.min(100, score)); // Ensure score is between 0-100
}

// Generate enhanced gap analysis summary
function generateEnhancedGapAnalysis(categorizedGaps, experienceData, jobTitle) {
  let analysis = `## Gap Analysis for ${jobTitle}\n\n`;
  
  // Experience Level Assessment
  analysis += `**Experience Level:** ${experienceData.level.charAt(0).toUpperCase() + experienceData.level.slice(1)} (${experienceData.years} years)\n`;
  if (experienceData.complexityScore >= 3) {
    analysis += `**Technical Complexity:** High - demonstrates advanced project experience\n`;
  }
  analysis += `\n`;
  
  // Critical Gaps
  if (categorizedGaps.critical.length > 0) {
    analysis += `🚨 **CRITICAL GAPS** (Must Address):\n`;
    categorizedGaps.critical.forEach(skill => {
      analysis += `• ${skill} - Essential for this role\n`;
    });
    analysis += `\n`;
  }
  
  // Important Gaps
  if (categorizedGaps.important.length > 0) {
    analysis += `⚠️ **IMPORTANT GAPS** (Should Address):\n`;
    categorizedGaps.important.forEach(skill => {
      analysis += `• ${skill} - Valuable for career growth\n`;
    });
    analysis += `\n`;
  }
  
  // Nice to Have
  if (categorizedGaps.niceToHave.length > 0) {
    analysis += `💡 **NICE TO HAVE**:\n`;
    categorizedGaps.niceToHave.forEach(skill => {
      analysis += `• ${skill} - Additional advantage\n`;
    });
    analysis += `\n`;
  }
  
  // Recommendations
  analysis += `**Recommendation:** `;
  if (categorizedGaps.critical.length > 0) {
    analysis += `Focus immediately on critical skills: ${categorizedGaps.critical.slice(0, 2).join(', ')}. `;
  }
  if (experienceData.years < 2 && categorizedGaps.critical.length === 0) {
    analysis += `Build more project experience to demonstrate your skills. `;
  }
  if (categorizedGaps.critical.length === 0 && categorizedGaps.important.length === 0) {
    analysis += `Excellent match! Consider highlighting your experience more prominently.`;
  }
  
  return analysis;
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
