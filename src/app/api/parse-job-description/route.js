import { NextResponse } from 'next/server';

// Free LLM options for JD parsing
// 1. Hugging Face Transformers (completely free)
// 2. Google Gemini API (generous free tier)

export async function POST(request) {
  try {
    const { jobDescription, jobTitle, companyName, jobId, jobDescriptionFile } = await request.json();

    let finalJobDescription = jobDescription || '';

    // If there's a PDF file, extract its content first
    if (jobDescriptionFile) {
      try {
        console.log('Extracting PDF content from:', jobDescriptionFile);
        const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/extract-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: jobDescriptionFile, jobId })
        });

        if (pdfResponse.ok) {
          const pdfResult = await pdfResponse.json();
          if (pdfResult.success) {
            finalJobDescription = pdfResult.data.text;
            console.log('Successfully extracted PDF content:', pdfResult.data.metadata);
          } else {
            console.error('PDF extraction failed:', pdfResult.error);
          }
        }
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        // Continue with original description if PDF extraction fails
      }
    }

    if (!finalJobDescription || finalJobDescription.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No job description content available (text or PDF)'
      }, { status: 400 });
    }    // Try multiple parsing methods
    let parsedData = null;
    
    // Method 1: Try Gemini API (if API key available)
    if (process.env.GEMINI_API_KEY) {
      try {
        parsedData = await parseWithGemini(finalJobDescription, jobTitle, companyName);
      } catch (error) {
        console.log('Gemini parsing failed, trying rule-based approach');
      }
    }

    // Method 2: Rule-based parsing (always available as fallback)
    if (!parsedData) {
      parsedData = parseWithRules(finalJobDescription, jobTitle, companyName);
    }

    // Store parsed data in database
    if (jobId) {
      await storeParsedData(jobId, parsedData);
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('JD Parsing Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to parse job description'
    }, { status: 500 });
  }
}

// Method 1: Google Gemini API parsing
async function parseWithGemini(jobDescription, jobTitle, companyName) {
  const prompt = `
You are an expert technical recruiter and career coach. Analyze this job description and extract the most critical skills and learning path.

Job Title: ${jobTitle}
Company: ${companyName}
Job Description: ${jobDescription}

Please provide a detailed analysis and return ONLY a valid JSON object with this exact structure:

{
  "requiredSkills": {
    "critical": ["skill1", "skill2", "skill3"],
    "technical": ["programming languages", "frameworks", "tools"],
    "soft": ["communication", "leadership", "problem-solving"],
    "tools": ["development tools", "software", "platforms"],
    "frameworks": ["web frameworks", "libraries", "systems"],
    "languages": ["programming languages only"],
    "databases": ["database technologies"],
    "cloud": ["cloud platforms and services"]
  },
  "experience": {
    "minYears": number,
    "maxYears": number,
    "level": "entry|mid|senior|lead"
  },
  "education": {
    "degree": "bachelor|master|phd|none|preferred",
    "majors": ["relevant degree fields"],
    "certifications": ["professional certifications"]
  },
  "responsibilities": ["key responsibility 1", "key responsibility 2", "..."],
  "learningPath": {
    "mustLearn": ["absolutely critical skills for this role"],
    "highPriority": ["very important skills"],
    "mediumPriority": ["useful skills"],
    "niceToHave": ["bonus skills"],
    "learningOrder": ["skill1", "skill2", "skill3", "..."],
    "estimatedTimeWeeks": number,
    "difficultyLevel": "beginner|intermediate|advanced|expert"
  },
  "jobInsights": {
    "companyType": "startup|enterprise|mid-size|agency|consultancy",
    "workType": "remote|hybrid|onsite",
    "teamSize": "small|medium|large",
    "growthStage": "early|growth|mature",
    "techStack": ["primary technologies used"],
    "projectTypes": ["types of projects you'll work on"]
  },
  "salaryInsights": {
    "estimatedMin": number,
    "estimatedMax": number,
    "currency": "USD",
    "factors": ["what affects compensation"]
  },
  "careerGrowth": {
    "nextRoles": ["potential career progression paths"],
    "skillGaps": ["skills to develop for advancement"],
    "timeToPromotion": "6-12 months|1-2 years|2-3 years|3+ years"
  },
  "interviewPrep": {
    "technicalTopics": ["topics for technical interviews"],
    "codingChallenges": ["types of coding problems"],
    "systemDesign": ["system design concepts"],
    "behavioralQuestions": ["soft skill areas to prepare"]
  },
  "marketDemand": {
    "demandLevel": "low|medium|high|very high",
    "competitiveness": "low|medium|high|very high",
    "trendingSkills": ["skills currently in high demand"],
    "futureSkills": ["emerging skills to consider"]
  }
}

Focus on:
1. Identifying the 3-5 most CRITICAL skills that are absolutely mandatory
2. Creating a realistic learning timeline
3. Providing actionable career insights
4. Highlighting what makes candidates stand out

Return ONLY the JSON object, no other text.
`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini API');
  }
  
  const generatedText = data.candidates[0].content.parts[0].text;
  console.log('Gemini raw response:', generatedText);
  
  // Extract JSON from response
  const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      // Add confidence score for AI parsing
      parsed.confidence = 0.95;
      parsed.source = 'gemini-ai';
      return parsed;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse Gemini JSON response');
    }
  }
  
  throw new Error('No valid JSON found in Gemini response');
}

// Method 2: Rule-based parsing (always available)
function parseWithRules(jobDescription, jobTitle, companyName) {
  const text = jobDescription.toLowerCase();
  
  // Technical skills patterns
  const technicalSkills = [];
  const techPatterns = {
    'javascript': /\b(javascript|js|node\.?js|react|vue|angular|typescript|ts)\b/g,
    'python': /\b(python|django|flask|fastapi|pandas|numpy|pytorch|tensorflow)\b/g,
    'java': /\b(java|spring|hibernate|maven|gradle)\b/g,
    'c#': /\b(c#|\.net|asp\.net|entity framework)\b/g,
    'php': /\b(php|laravel|symfony|wordpress)\b/g,
    'ruby': /\b(ruby|rails|sinatra)\b/g,
    'go': /\b(golang|go)\b/g,
    'rust': /\b(rust)\b/g,
    'sql': /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch)\b/g,
    'aws': /\b(aws|amazon web services|ec2|s3|lambda|dynamodb)\b/g,
    'docker': /\b(docker|kubernetes|containerization)\b/g,
    'git': /\b(git|github|gitlab|version control)\b/g,
    'testing': /\b(testing|unit test|integration test|jest|pytest|junit)\b/g
  };

  // Frameworks and tools
  const frameworks = [];
  const frameworkPatterns = {
    'react': /\b(react|reactjs|next\.?js|gatsby)\b/g,
    'angular': /\b(angular|angularjs)\b/g,
    'vue': /\b(vue|vuejs|nuxt)\b/g,
    'express': /\b(express|expressjs)\b/g,
    'django': /\b(django|drf)\b/g,
    'flask': /\b(flask)\b/g,
    'spring': /\b(spring|spring boot)\b/g,
    'laravel': /\b(laravel)\b/g
  };

  // Soft skills
  const softSkills = [];
  const softPatterns = {
    'communication': /\b(communication|communicate|presentation|writing)\b/g,
    'teamwork': /\b(team|collaboration|collaborative|cross-functional)\b/g,
    'leadership': /\b(leadership|leading|mentor|mentoring)\b/g,
    'problem-solving': /\b(problem.solving|analytical|critical thinking)\b/g,
    'adaptability': /\b(adaptable|flexible|learning agility)\b/g
  };

  // Extract skills using patterns
  Object.entries(techPatterns).forEach(([skill, pattern]) => {
    if (pattern.test(text)) {
      technicalSkills.push(skill);
    }
  });

  Object.entries(frameworkPatterns).forEach(([framework, pattern]) => {
    if (pattern.test(text)) {
      frameworks.push(framework);
    }
  });

  Object.entries(softPatterns).forEach(([skill, pattern]) => {
    if (pattern.test(text)) {
      softSkills.push(skill);
    }
  });

  // Extract experience level
  let experienceLevel = 'mid';
  let minYears = 0;
  let maxYears = 5;

  if (/\b(entry|junior|0-2 years|graduate|intern)\b/i.test(text)) {
    experienceLevel = 'entry';
    minYears = 0;
    maxYears = 2;
  } else if (/\b(senior|lead|architect|5\+ years|7\+ years)\b/i.test(text)) {
    experienceLevel = 'senior';
    minYears = 5;
    maxYears = 10;
  } else if (/\b(principal|staff|director|10\+ years)\b/i.test(text)) {
    experienceLevel = 'lead';
    minYears = 10;
    maxYears = 15;
  }

  // Extract year requirements
  const yearMatches = text.match(/(\d+)\+?\s*years?/g);
  if (yearMatches) {
    const years = yearMatches.map(match => parseInt(match.match(/\d+/)[0]));
    minYears = Math.min(...years);
    maxYears = Math.max(...years);
  }

  // Determine work type
  let workType = 'onsite';
  if (/\b(remote|work from home|wfh)\b/i.test(text)) {
    workType = 'remote';
  } else if (/\b(hybrid|flexible)\b/i.test(text)) {
    workType = 'hybrid';
  }

  // Create learning path
  const mustLearn = technicalSkills.slice(0, 5); // Top 5 technical skills
  const niceToHave = [...frameworks, ...technicalSkills.slice(5)];
  
  return {
    requiredSkills: {
      technical: technicalSkills,
      soft: softSkills,
      tools: ['git', 'docker', 'aws'].filter(tool => technicalSkills.includes(tool)),
      frameworks: frameworks,
      languages: technicalSkills.filter(skill => 
        ['javascript', 'python', 'java', 'c#', 'php', 'ruby', 'go', 'rust'].includes(skill)
      )
    },
    experience: {
      minYears,
      maxYears,
      level: experienceLevel
    },
    education: {
      degree: /\b(bachelor|master|phd|degree)\b/i.test(text) ? 'bachelor' : 'none',
      majors: extractMajors(text),
      certifications: extractCertifications(text)
    },
    responsibilities: extractResponsibilities(jobDescription),
    learningPath: {
      mustLearn,
      niceToHave,
      priorityOrder: [...mustLearn, ...niceToHave.slice(0, 3)]
    },
    companyType: determineCompanyType(companyName, text),
    workType,
    difficulty: experienceLevel === 'entry' ? 'beginner' : 
               experienceLevel === 'mid' ? 'intermediate' : 'advanced',
    confidence: 0.75 // Rule-based has moderate confidence
  };
}

function extractMajors(text) {
  const majors = [];
  const majorPatterns = {
    'Computer Science': /\b(computer science|cs|software engineering)\b/i,
    'Information Technology': /\b(information technology|it|mis)\b/i,
    'Electrical Engineering': /\b(electrical engineering|ee|ece)\b/i,
    'Mathematics': /\b(mathematics|math|statistics)\b/i,
    'Physics': /\b(physics)\b/i
  };

  Object.entries(majorPatterns).forEach(([major, pattern]) => {
    if (pattern.test(text)) {
      majors.push(major);
    }
  });

  return majors;
}

function extractCertifications(text) {
  const certs = [];
  const certPatterns = {
    'AWS': /\b(aws certified|amazon web services)\b/i,
    'Google Cloud': /\b(google cloud|gcp)\b/i,
    'Microsoft Azure': /\b(azure|microsoft certified)\b/i,
    'Docker': /\b(docker certified)\b/i,
    'Kubernetes': /\b(kubernetes|k8s|cka|ckad)\b/i
  };

  Object.entries(certPatterns).forEach(([cert, pattern]) => {
    if (pattern.test(text)) {
      certs.push(cert);
    }
  });

  return certs;
}

function extractResponsibilities(text) {
  const sentences = text.split(/[.!?]+/);
  const responsibilities = [];
  
  const responsibilityKeywords = [
    'develop', 'build', 'create', 'design', 'implement', 'maintain',
    'collaborate', 'work with', 'lead', 'manage', 'oversee',
    'optimize', 'improve', 'enhance', 'troubleshoot', 'debug'
  ];

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase().trim();
    if (lowerSentence.length > 20 && 
        responsibilityKeywords.some(keyword => lowerSentence.includes(keyword))) {
      responsibilities.push(sentence.trim());
    }
  });

  return responsibilities.slice(0, 8); // Top 8 responsibilities
}

function determineCompanyType(companyName, text) {
  if (/\b(startup|early stage|seed)\b/i.test(text)) return 'startup';
  if (/\b(enterprise|fortune 500|large|corporation)\b/i.test(text)) return 'enterprise';
  if (/\b(agency|consulting|services)\b/i.test(text)) return 'agency';
  return 'mid-size';
}

// Store parsed data in database
async function storeParsedData(jobId, parsedData) {
  try {
    // This would integrate with your existing database
    // For now, we'll just log it
    console.log('Storing parsed data for job:', jobId);
    console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
    
    // TODO: Implement actual database storage
    // await db.collection('parsed_job_data').insertOne({
    //   jobId,
    //   parsedData,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // });
    
    return true;
  } catch (error) {
    console.error('Failed to store parsed data:', error);
    return false;
  }
}
