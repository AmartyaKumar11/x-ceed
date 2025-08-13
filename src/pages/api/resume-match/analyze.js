import { NextResponse } from 'next/server';
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

    // Try multiple analysis methods: Python AI -> OpenRouter AI -> JavaScript fallback
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
      console.warn('⚠️ Python AI service failed, trying OpenRouter AI:', pythonError.message);

      try {
        analysisResult = await performOpenRouterAnalysis({
          jobDescription,
          jobTitle,
          jobRequirements,
          resumePath,
          userSkills,
          userId: decoded.userId
        });
        console.log('✅ OpenRouter AI analysis completed');
      } catch (openRouterError) {
        console.warn('⚠️ OpenRouter AI failed, using basic fallback analysis:', openRouterError.message);
        analysisResult = await performFallbackAnalysis({
          jobDescription,
          jobTitle,
          jobRequirements,
          resumePath,
          userSkills,
          userId: decoded.userId
        });
      }
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

async function performOpenRouterAnalysis({ jobDescription, jobTitle, jobRequirements, resumePath, userSkills, userId }) {
  console.log('🤖 Performing OpenRouter AI analysis...');

  const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key not configured');
  }

  // Extract resume text if available
  let resumeText = '';
  if (resumePath) {
    try {
      resumeText = await extractTextFromResume(resumePath);
    } catch (error) {
      console.warn('Could not extract text from resume:', error.message);
    }
  }

  // Extract skills from resume content for more accurate analysis
  const resumeExtractedSkills = extractSkillsFromResumeContent(resumeText);
  const allUserSkills = [...new Set([...(userSkills || []), ...resumeExtractedSkills])];

  console.log('🔍 OpenRouter analysis - Skills from resume:', resumeExtractedSkills);
  console.log('📋 OpenRouter analysis - Combined skills:', allUserSkills);

  // Build comprehensive prompt for gap analysis
  const prompt = `You are an expert career advisor. Analyze the gap between this candidate's profile and job requirements to provide detailed insights.

==== JOB POSTING ====
Title: ${jobTitle}
Requirements: ${Array.isArray(jobRequirements) ? jobRequirements.join(', ') : 'Not specified'}
Description: ${jobDescription.substring(0, 1000)}

==== CANDIDATE PROFILE ====
Explicit Skills Listed: ${Array.isArray(userSkills) ? userSkills.join(', ') : 'No skills listed'}
Skills Extracted from Resume/Projects: ${resumeExtractedSkills.join(', ') || 'None found'}
All Identified Skills: ${allUserSkills.join(', ') || 'No skills identified'}
Resume Content: ${resumeText.substring(0, 1500)}

IMPORTANT: Consider BOTH explicitly listed skills AND skills demonstrated in projects/experience when analyzing gaps.

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

            // Add analysis metadata
            analysisResult.analysisType = 'openrouter-ai';
            analysisResult.model = model;
            analysisResult.highlights = generatePdfHighlights(
              resumeText,
              analysisResult.missingSkills || [],
              analysisResult.missingKeywords || []
            );

            return analysisResult;
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

async function performFallbackAnalysis({ jobDescription, jobTitle, jobRequirements, resumePath, userSkills, userId }) {
  console.log('🤖 Performing fallback JavaScript analysis...');

  // Extract job keywords and requirements
  const jobKeywords = extractJobKeywords(jobDescription, jobTitle);
  const requiredSkills = extractRequiredSkills(jobDescription, jobRequirements);

  // Analyze user skills against job requirements (including resume content analysis)
  const skillsAnalysis = analyzeSkills(userSkills, requiredSkills, resumeText);

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

  // Enhanced gap analysis with categorization
  const gapAnalysis = generateGapAnalysis(skillsAnalysis, jobTitle, jobDescription);

  return {
    analysisType: 'enhanced-fallback',
    overallScore,
    skillsScore: skillsAnalysis.score,
    experienceScore: experienceAnalysis.score,
    keywordScore: keywordAnalysis.score,
    overallSummary: generateOverallSummary(overallScore),
    matchedSkills: skillsAnalysis.matched,
    missingSkills: skillsAnalysis.missing,
    criticalMissing: skillsAnalysis.criticalMissing,
    importantMissing: skillsAnalysis.importantMissing,
    niceToHaveMissing: skillsAnalysis.niceToHaveMissing,
    foundKeywords: keywordAnalysis.found,
    missingKeywords: keywordAnalysis.missing,
    gapAnalysis: gapAnalysis,
    experienceAnalysis: {
      resumeYears: experienceAnalysis.resumeYears,
      requiredYears: experienceAnalysis.requiredYears,
      details: experienceAnalysis.details
    },
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

function extractSkillsFromResumeContent(resumeText) {
  if (!resumeText) return [];

  const resumeTextLower = resumeText.toLowerCase();

  // COMPREHENSIVE TECH SKILL DATABASE - All roles covered
  const skillDatabase = [
    // Frontend Technologies
    { skill: 'React', variations: ['react', 'reactjs', 'react.js', 'react js'] },
    { skill: 'Angular', variations: ['angular', 'angularjs', 'angular.js'] },
    { skill: 'Vue.js', variations: ['vue', 'vuejs', 'vue.js'] },
    { skill: 'JavaScript', variations: ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020'] },
    { skill: 'TypeScript', variations: ['typescript', 'ts'] },
    { skill: 'HTML5', variations: ['html', 'html5'] },
    { skill: 'CSS3', variations: ['css', 'css3', 'cascading style sheets'] },
    { skill: 'Sass', variations: ['sass', 'scss'] },
    { skill: 'Less', variations: ['less'] },
    { skill: 'Bootstrap', variations: ['bootstrap'] },
    { skill: 'Tailwind CSS', variations: ['tailwind', 'tailwindcss'] },
    { skill: 'Material UI', variations: ['material ui', 'mui', 'material-ui'] },
    { skill: 'Next.js', variations: ['next', 'nextjs', 'next.js'] },
    { skill: 'Nuxt.js', variations: ['nuxt', 'nuxtjs', 'nuxt.js'] },
    { skill: 'Svelte', variations: ['svelte', 'sveltekit'] },

    // Backend Technologies
    { skill: 'Node.js', variations: ['node', 'nodejs', 'node.js'] },
    { skill: 'Express.js', variations: ['express', 'expressjs', 'express.js'] },
    { skill: 'Python', variations: ['python', 'py'] },
    { skill: 'Django', variations: ['django'] },
    { skill: 'Flask', variations: ['flask'] },
    { skill: 'FastAPI', variations: ['fastapi', 'fast api'] },
    { skill: 'Java', variations: ['java'] },
    { skill: 'Spring Boot', variations: ['spring', 'spring boot', 'springboot'] },
    { skill: 'PHP', variations: ['php'] },
    { skill: 'Laravel', variations: ['laravel'] },
    { skill: 'Ruby', variations: ['ruby'] },
    { skill: 'Ruby on Rails', variations: ['rails', 'ruby on rails'] },
    { skill: 'Go', variations: ['go', 'golang'] },
    { skill: 'C#', variations: ['c#', 'csharp', 'c sharp'] },
    { skill: '.NET', variations: ['.net', 'dotnet', 'asp.net'] },
    { skill: 'Rust', variations: ['rust'] },
    { skill: 'Scala', variations: ['scala'] },
    { skill: 'Kotlin', variations: ['kotlin'] },

    // SDET/QA Testing Technologies - COMPREHENSIVE
    { skill: 'Selenium WebDriver', variations: ['selenium', 'selenium webdriver', 'webdriver'] },
    { skill: 'Cypress', variations: ['cypress', 'cypress.io'] },
    { skill: 'Playwright', variations: ['playwright', 'playwright testing'] },
    { skill: 'TestNG', variations: ['testng', 'test ng'] },
    { skill: 'JUnit', variations: ['junit', 'junit5', 'junit 5'] },
    { skill: 'Pytest', variations: ['pytest', 'py.test'] },
    { skill: 'Mocha', variations: ['mocha', 'mochajs'] },
    { skill: 'Jasmine', variations: ['jasmine', 'jasmine testing'] },
    { skill: 'Jest', variations: ['jest', 'jest testing'] },
    { skill: 'Cucumber', variations: ['cucumber', 'gherkin', 'bdd'] },
    { skill: 'SpecFlow', variations: ['specflow', 'spec flow'] },
    { skill: 'Postman', variations: ['postman', 'postman api'] },
    { skill: 'REST Assured', variations: ['rest assured', 'restassured'] },
    { skill: 'SoapUI', variations: ['soapui', 'soap ui'] },
    { skill: 'JMeter', variations: ['jmeter', 'apache jmeter'] },
    { skill: 'LoadRunner', variations: ['loadrunner', 'load runner', 'hp loadrunner'] },
    { skill: 'K6', variations: ['k6', 'k6 testing', 'grafana k6'] },
    { skill: 'Appium', variations: ['appium', 'appium testing'] },
    { skill: 'Espresso', variations: ['espresso', 'android espresso'] },
    { skill: 'XCUITest', variations: ['xcuitest', 'xcui test', 'ios testing'] },
    { skill: 'TestRail', variations: ['testrail', 'test rail'] },
    { skill: 'Zephyr', variations: ['zephyr', 'zephyr scale'] },
    { skill: 'Test Automation', variations: ['test automation', 'automated testing', 'automation framework'] },
    { skill: 'API Testing', variations: ['api testing', 'rest api testing', 'web services testing'] },
    { skill: 'Performance Testing', variations: ['performance testing', 'load testing', 'stress testing'] },
    { skill: 'Mobile Testing', variations: ['mobile testing', 'android testing', 'ios testing'] },
    { skill: 'Security Testing', variations: ['security testing', 'vulnerability testing', 'penetration testing'] },

    // DevOps & Infrastructure
    { skill: 'AWS', variations: ['aws', 'amazon web services'] },
    { skill: 'Azure', variations: ['azure', 'microsoft azure'] },
    { skill: 'Google Cloud Platform', variations: ['gcp', 'google cloud', 'google cloud platform'] },
    { skill: 'Docker', variations: ['docker', 'containerization'] },
    { skill: 'Kubernetes', variations: ['kubernetes', 'k8s'] },
    { skill: 'Jenkins', variations: ['jenkins', 'jenkins pipeline'] },
    { skill: 'GitLab CI', variations: ['gitlab ci', 'gitlab pipeline'] },
    { skill: 'GitHub Actions', variations: ['github actions', 'gh actions'] },
    { skill: 'CI/CD', variations: ['ci/cd', 'continuous integration', 'continuous deployment'] },
    { skill: 'Terraform', variations: ['terraform', 'infrastructure as code'] },
    { skill: 'Ansible', variations: ['ansible', 'configuration management'] },
    { skill: 'Helm', variations: ['helm', 'helm charts'] },
    { skill: 'Prometheus', variations: ['prometheus', 'monitoring'] },
    { skill: 'Grafana', variations: ['grafana', 'dashboards'] },
    { skill: 'ELK Stack', variations: ['elk', 'elasticsearch logstash kibana', 'elastic stack'] },
    { skill: 'Nginx', variations: ['nginx', 'web server'] },
    { skill: 'Apache', variations: ['apache', 'apache httpd'] },

    // Databases & Data
    { skill: 'MongoDB', variations: ['mongodb', 'mongo'] },
    { skill: 'MySQL', variations: ['mysql'] },
    { skill: 'PostgreSQL', variations: ['postgresql', 'postgres'] },
    { skill: 'Redis', variations: ['redis', 'caching'] },
    { skill: 'Elasticsearch', variations: ['elasticsearch', 'elastic search'] },
    { skill: 'SQL', variations: ['sql', 'structured query language'] },
    { skill: 'NoSQL', variations: ['nosql', 'no sql'] },
    { skill: 'Cassandra', variations: ['cassandra', 'apache cassandra'] },
    { skill: 'DynamoDB', variations: ['dynamodb', 'dynamo db'] },
    { skill: 'Oracle', variations: ['oracle', 'oracle database'] },
    { skill: 'SQL Server', variations: ['sql server', 'microsoft sql server', 'mssql'] },

    // Data Engineering & Analytics
    { skill: 'Apache Spark', variations: ['spark', 'apache spark', 'pyspark'] },
    { skill: 'Apache Kafka', variations: ['kafka', 'apache kafka'] },
    { skill: 'Apache Airflow', variations: ['airflow', 'apache airflow'] },
    { skill: 'Hadoop', variations: ['hadoop', 'apache hadoop'] },
    { skill: 'Pandas', variations: ['pandas', 'python pandas'] },
    { skill: 'NumPy', variations: ['numpy', 'numerical python'] },
    { skill: 'Apache Beam', variations: ['beam', 'apache beam'] },
    { skill: 'Databricks', variations: ['databricks'] },
    { skill: 'Snowflake', variations: ['snowflake', 'snowflake data warehouse'] },
    { skill: 'BigQuery', variations: ['bigquery', 'google bigquery'] },
    { skill: 'Redshift', variations: ['redshift', 'amazon redshift'] },
    { skill: 'ETL', variations: ['etl', 'extract transform load', 'data pipeline'] },

    // Machine Learning & AI
    { skill: 'TensorFlow', variations: ['tensorflow', 'tf'] },
    { skill: 'PyTorch', variations: ['pytorch', 'torch'] },
    { skill: 'Scikit-learn', variations: ['scikit-learn', 'sklearn'] },
    { skill: 'Keras', variations: ['keras'] },
    { skill: 'OpenCV', variations: ['opencv', 'computer vision'] },
    { skill: 'Hugging Face', variations: ['hugging face', 'transformers'] },
    { skill: 'MLflow', variations: ['mlflow', 'ml flow'] },
    { skill: 'Jupyter', variations: ['jupyter', 'jupyter notebook'] },
    { skill: 'Machine Learning', variations: ['machine learning', 'ml', 'artificial intelligence', 'ai'] },
    { skill: 'Deep Learning', variations: ['deep learning', 'neural networks'] },
    { skill: 'Natural Language Processing', variations: ['nlp', 'natural language processing'] },

    // Security Technologies
    { skill: 'OWASP', variations: ['owasp', 'owasp zap', 'security testing'] },
    { skill: 'Burp Suite', variations: ['burp suite', 'burp', 'portswigger'] },
    { skill: 'Nessus', variations: ['nessus', 'vulnerability scanning'] },
    { skill: 'Metasploit', variations: ['metasploit'] },
    { skill: 'Wireshark', variations: ['wireshark', 'network analysis'] },
    { skill: 'Kali Linux', variations: ['kali linux', 'kali'] },
    { skill: 'Penetration Testing', variations: ['penetration testing', 'pen testing', 'ethical hacking'] },
    { skill: 'Cybersecurity', variations: ['cybersecurity', 'information security', 'infosec'] },

    // Mobile Development
    { skill: 'React Native', variations: ['react native', 'react-native'] },
    { skill: 'Flutter', variations: ['flutter', 'dart'] },
    { skill: 'Swift', variations: ['swift', 'ios development'] },
    { skill: 'Kotlin', variations: ['kotlin', 'android development'] },
    { skill: 'Xamarin', variations: ['xamarin'] },
    { skill: 'Ionic', variations: ['ionic', 'ionic framework'] },

    // Version Control & Collaboration
    { skill: 'Git', variations: ['git', 'version control'] },
    { skill: 'GitHub', variations: ['github'] },
    { skill: 'GitLab', variations: ['gitlab'] },
    { skill: 'Bitbucket', variations: ['bitbucket'] },
    { skill: 'Jira', variations: ['jira', 'atlassian jira'] },
    { skill: 'Confluence', variations: ['confluence', 'atlassian confluence'] },
    { skill: 'Slack', variations: ['slack'] },

    // Methodologies & Practices
    { skill: 'Agile', variations: ['agile', 'agile methodology', 'agile development'] },
    { skill: 'Scrum', variations: ['scrum', 'scrum master'] },
    { skill: 'Kanban', variations: ['kanban'] },
    { skill: 'DevOps', variations: ['devops', 'dev ops'] },
    { skill: 'Microservices', variations: ['microservices', 'micro services', 'microservice architecture'] },
    { skill: 'REST API', variations: ['rest', 'rest api', 'restful', 'api', 'web api'] },
    { skill: 'GraphQL', variations: ['graphql', 'graph ql'] },
    { skill: 'WebSockets', variations: ['websockets', 'web sockets', 'socket.io'] },

    // Build Tools & Package Managers
    { skill: 'Webpack', variations: ['webpack'] },
    { skill: 'Vite', variations: ['vite'] },
    { skill: 'Babel', variations: ['babel'] },
    { skill: 'NPM', variations: ['npm', 'node package manager'] },
    { skill: 'Yarn', variations: ['yarn'] },
    { skill: 'Maven', variations: ['maven', 'apache maven'] },
    { skill: 'Gradle', variations: ['gradle'] },
    { skill: 'Pip', variations: ['pip', 'python package installer'] },

    // Additional Technologies
    { skill: 'Blockchain', variations: ['blockchain', 'cryptocurrency', 'bitcoin', 'ethereum'] },
    { skill: 'Solidity', variations: ['solidity', 'smart contracts'] },
    { skill: 'Web3', variations: ['web3', 'decentralized applications', 'dapps'] },
    { skill: 'IoT', variations: ['iot', 'internet of things'] },
    { skill: 'AR/VR', variations: ['ar', 'vr', 'augmented reality', 'virtual reality'] },
    { skill: 'Unity', variations: ['unity', 'unity3d'] },
    { skill: 'Unreal Engine', variations: ['unreal engine', 'unreal'] }
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

function analyzeSkills(userSkills, requiredSkills, resumeText = '') {
  const userSkillsLower = userSkills?.map(skill =>
    typeof skill === 'string' ? skill.toLowerCase() : skill.name?.toLowerCase()
  ) || [];

  const requiredSkillsLower = requiredSkills.map(skill => skill.toLowerCase());

  // ENHANCED: Extract skills from resume content (projects, experience, etc.)
  const resumeExtractedSkills = extractSkillsFromResumeContent(resumeText);
  console.log('🔍 Skills extracted from resume content:', resumeExtractedSkills);

  // Combine explicit skills with extracted skills
  const allUserSkills = [...new Set([...userSkillsLower, ...resumeExtractedSkills])];
  console.log('📋 Combined user skills:', allUserSkills);

  const matched = requiredSkillsLower.filter(skill =>
    allUserSkills.some(userSkill =>
      userSkill?.includes(skill) || skill.includes(userSkill || '')
    )
  );

  const missing = requiredSkillsLower.filter(skill => !matched.includes(skill));

  // ENHANCED: Categorize missing skills by priority based on role and frequency
  const criticalSkills = [
    // Core Programming Languages
    'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java', 'node.js', 'c#', '.net',
    // SDET/Testing Critical
    'selenium', 'testng', 'junit', 'cypress', 'test automation', 'api testing',
    // DevOps Critical  
    'docker', 'kubernetes', 'jenkins', 'ci/cd', 'aws', 'azure',
    // Data Engineering Critical
    'sql', 'python', 'spark', 'kafka', 'airflow',
    // Security Critical
    'owasp', 'penetration testing', 'cybersecurity'
  ];

  const importantSkills = [
    // Frontend Important
    'html5', 'css3', 'sass', 'bootstrap', 'webpack',
    // Backend Important
    'express', 'django', 'flask', 'spring boot', 'mongodb', 'postgresql', 'redis',
    // Testing Important
    'postman', 'rest assured', 'jmeter', 'performance testing', 'mobile testing',
    // DevOps Important
    'terraform', 'ansible', 'prometheus', 'grafana', 'nginx',
    // Data Important
    'pandas', 'numpy', 'elasticsearch', 'bigquery', 'snowflake',
    // Security Important
    'burp suite', 'nessus', 'kali linux'
  ];

  const criticalMissing = missing.filter(skill =>
    criticalSkills.some(critical =>
      skill.toLowerCase().includes(critical) || critical.includes(skill.toLowerCase())
    )
  );

  const importantMissing = missing.filter(skill =>
    importantSkills.some(important =>
      skill.toLowerCase().includes(important) || important.includes(skill.toLowerCase())
    ) && !criticalMissing.includes(skill)
  );

  const niceToHaveMissing = missing.filter(skill =>
    !criticalMissing.includes(skill) && !importantMissing.includes(skill)
  );

  // Identify skills to improve (partial matches)
  const score = requiredSkillsLower.length > 0
    ? Math.round((matched.length / requiredSkillsLower.length) * 100)
    : 0;

  return {
    matched,
    missing,
    criticalMissing,
    importantMissing,
    niceToHaveMissing,
    score
  };
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

function generateGapAnalysis(skillsAnalysis, jobTitle, jobDescription) {
  const { criticalMissing, importantMissing, matched } = skillsAnalysis;

  let analysis = `Gap Analysis for ${jobTitle} position:\n\n`;

  if (criticalMissing.length > 0) {
    analysis += `CRITICAL GAPS (High Priority):\n`;
    analysis += `• Missing essential skills: ${criticalMissing.slice(0, 3).join(', ')}\n`;
    analysis += `• These skills are fundamental for the role and should be prioritized in learning.\n\n`;
  }

  if (importantMissing.length > 0) {
    analysis += `IMPORTANT GAPS (Medium Priority):\n`;
    analysis += `• Missing valuable skills: ${importantMissing.slice(0, 3).join(', ')}\n`;
    analysis += `• These skills would significantly strengthen your candidacy.\n\n`;
  }

  if (matched.length > 0) {
    analysis += `STRENGTHS:\n`;
    analysis += `• Matching skills: ${matched.slice(0, 5).join(', ')}\n`;
    analysis += `• These are your competitive advantages for this role.\n\n`;
  }

  // Learning path recommendation
  const totalGaps = criticalMissing.length + importantMissing.length;
  if (totalGaps > 5) {
    analysis += `RECOMMENDATION: Focus on the top 3 critical skills first, then gradually expand to other areas.`;
  } else if (totalGaps > 2) {
    analysis += `RECOMMENDATION: Address critical gaps first, then work on important skills to become a strong candidate.`;
  } else {
    analysis += `RECOMMENDATION: You have a good foundation. Focus on advancing existing skills and filling remaining gaps.`;
  }

  return analysis;
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
  // For now, return mock text that demonstrates skill extraction from projects
  return `
    John Doe
    Software Developer
    
    Experience:
    - 3 years of experience in web development
    - Built full-stack applications using React and Node.js
    - Developed RESTful APIs with Express.js and MongoDB database
    - Deployed applications on AWS using Docker containers
    - Used Git for version control and Agile methodology
    - Implemented user authentication with JWT tokens
    - Created responsive UI with Bootstrap and CSS3
    
    Projects:
    1. E-commerce Platform
       - Technologies: React, Node.js, MongoDB, Express.js
       - Built shopping cart and payment integration
       - Deployed on AWS with Docker
    
    2. Task Management App
       - Technologies: Python, Django, PostgreSQL
       - Implemented real-time updates with WebSocket
       - Used Redis for caching
    
    Skills Listed: JavaScript, HTML, CSS (basic list)
    
    Education:
    Bachelor's in Computer Science
  `;
}
