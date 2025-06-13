// Complete test script to extract PDF content and parse with Gemini AI
import { MongoClient, ObjectId } from 'mongodb';
import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const DB_NAME = 'x-ceed-db';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function parseCompleteSavedJob() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    // Get the saved job
    const savedJobs = await db.collection('savedJobs').find({}).toArray();
    
    if (savedJobs.length === 0) {
      console.log('❌ No saved jobs found.');
      return;
    }
    
    const savedJob = savedJobs[0]; // Get the first saved job
    console.log(`📌 Processing saved job by applicant: ${savedJob.applicantId}`);
    
    // Get job details
    let jobQuery;
    if (typeof savedJob.jobId === 'string') {
      try {
        jobQuery = { _id: new ObjectId(savedJob.jobId) };
      } catch (e) {
        jobQuery = { _id: savedJob.jobId };
      }
    } else {
      jobQuery = { _id: savedJob.jobId };
    }
    
    const job = await db.collection('jobs').findOne(jobQuery);
    
    if (!job) {
      console.log('❌ Job not found');
      return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 JOB DETAILS');
    console.log('='.repeat(80));
    console.log(`🏢 Title: ${job.title}`);
    console.log(`🏢 Company: ${job.companyName || 'Not specified'}`);
    console.log(`📍 Location: ${job.location || job.workMode}`);
    console.log(`💰 Salary: $${job.salaryMin} - $${job.salaryMax} ${job.currency || 'USD'}`);
    console.log(`📝 Description Type: ${job.jobDescriptionType || 'text'}`);
    console.log(`📄 PDF File: ${job.jobDescriptionFile || 'None'}`);
    console.log(`📅 Status: ${job.status}`);
    
    // Extract PDF content if available
    let jobDescriptionText = job.description || '';
    
    if (job.jobDescriptionFile && (job.jobDescriptionType === 'file' || job.jobDescriptionType === 'pdf')) {
      console.log('\n📄 EXTRACTING PDF CONTENT...');
      console.log('-'.repeat(50));
      
      try {
        const fullPath = path.join(process.cwd(), 'public', job.jobDescriptionFile);
        console.log(`🔍 Looking for PDF at: ${fullPath}`);
        
        if (fs.existsSync(fullPath)) {
          console.log('✅ PDF file found! Extracting content...');
          
          const dataBuffer = fs.readFileSync(fullPath);
          const pdfData = await pdf(dataBuffer);
          
          jobDescriptionText = pdfData.text;
          
          console.log(`📊 PDF Stats:`);
          console.log(`   Pages: ${pdfData.numpages}`);
          console.log(`   Characters: ${jobDescriptionText.length}`);
          console.log(`   Words: ${jobDescriptionText.split(/\s+/).length}`);
          
          console.log('\n📝 PDF CONTENT PREVIEW:');
          console.log('-'.repeat(50));
          console.log(jobDescriptionText.substring(0, 500) + '...');
          
        } else {
          console.log('❌ PDF file not found at expected location');
          console.log('   Using text description instead');
        }
        
      } catch (pdfError) {
        console.log(`❌ Error extracting PDF: ${pdfError.message}`);
        console.log('   Using text description instead');
      }
    }
    
    // Parse with Gemini AI
    console.log('\n🤖 PARSING WITH GEMINI AI...');
    console.log('-'.repeat(50));
    
    const parseResult = await parseWithGeminiAI(job, jobDescriptionText);
    
    if (parseResult.success) {
      const data = parseResult.data;
      
      console.log('✅ SUCCESSFULLY PARSED WITH AI!');
      console.log(`🔥 Confidence: ${data.confidence}`);
      console.log(`🧠 Source: ${data.source}`);
      
      // Display all parsed information
      displayParsedResults(data);
      
      // Show how this would appear on the prep plan page
      console.log('\n' + '='.repeat(80));
      console.log('🎓 HOW THIS APPEARS ON PREP PLAN PAGE');
      console.log('='.repeat(80));
      showPrepPlanPreview(job, data);
      
    } else {
      console.log(`❌ Failed to parse: ${parseResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function parseWithGeminiAI(job, jobDescriptionText) {
  try {
    const prompt = `
You are an expert technical recruiter and career coach. Analyze this job description and extract the most critical skills and learning path.

Job Title: ${job.title}
Company: ${job.companyName || 'Company'}
Job Description: ${jobDescriptionText}

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
    "minYears": 0,
    "maxYears": 5,
    "level": "entry|mid|senior|lead"
  },
  "learningPath": {
    "mustLearn": ["absolutely critical skills for this role"],
    "highPriority": ["very important skills"],
    "mediumPriority": ["useful skills"],
    "niceToHave": ["bonus skills"],
    "learningOrder": ["skill1", "skill2", "skill3"],
    "estimatedTimeWeeks": 12,
    "difficultyLevel": "beginner|intermediate|advanced|expert"
  },
  "jobInsights": {
    "companyType": "startup|enterprise|mid-size|agency|consultancy",
    "workType": "remote|hybrid|onsite",
    "techStack": ["primary technologies used"],
    "projectTypes": ["types of projects you'll work on"]
  },
  "interviewPrep": {
    "technicalTopics": ["topics for technical interviews"],
    "codingChallenges": ["types of coding problems"],
    "behavioralQuestions": ["soft skill areas to prepare"]
  }
}

Focus on:
1. Identifying the 3-5 most CRITICAL skills that are absolutely mandatory
2. Creating a realistic learning timeline
3. Providing actionable career insights

Return ONLY the JSON object, no other text.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    console.log(`📤 Raw AI Response Length: ${generatedText.length} characters`);
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.confidence = 0.95;
        parsed.source = 'gemini-ai';
        return { success: true, data: parsed };
      } catch (parseError) {
        console.log('Raw response:', generatedText);
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
    }
    
    throw new Error('No valid JSON found in Gemini response');
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function displayParsedResults(data) {
  // Critical Skills
  if (data.requiredSkills?.critical && data.requiredSkills.critical.length > 0) {
    console.log('\n🚨 CRITICAL SKILLS (Must Have):');
    data.requiredSkills.critical.forEach((skill, index) => {
      console.log(`   ${index + 1}. ${skill}`);
    });
  }
  
  // Technical Skills
  if (data.requiredSkills?.technical && data.requiredSkills.technical.length > 0) {
    console.log('\n💻 TECHNICAL SKILLS:');
    data.requiredSkills.technical.forEach((skill, index) => {
      console.log(`   ${index + 1}. ${skill}`);
    });
  }
  
  // Programming Languages
  if (data.requiredSkills?.languages && data.requiredSkills.languages.length > 0) {
    console.log('\n🔤 PROGRAMMING LANGUAGES:');
    data.requiredSkills.languages.forEach((lang, index) => {
      console.log(`   ${index + 1}. ${lang}`);
    });
  }
  
  // Learning Path
  if (data.learningPath) {
    console.log('\n📚 LEARNING PATH:');
    
    if (data.learningPath.mustLearn && data.learningPath.mustLearn.length > 0) {
      console.log('   🎯 MUST LEARN FIRST:');
      data.learningPath.mustLearn.forEach((skill, index) => {
        console.log(`      ${index + 1}. ${skill}`);
      });
    }
    
    if (data.learningPath.highPriority && data.learningPath.highPriority.length > 0) {
      console.log('   🔥 HIGH PRIORITY:');
      data.learningPath.highPriority.forEach((skill, index) => {
        console.log(`      ${index + 1}. ${skill}`);
      });
    }
    
    if (data.learningPath.estimatedTimeWeeks) {
      console.log(`   ⏱️  ESTIMATED TIME: ${data.learningPath.estimatedTimeWeeks} weeks`);
    }
    
    if (data.learningPath.difficultyLevel) {
      console.log(`   🎚️  DIFFICULTY: ${data.learningPath.difficultyLevel}`);
    }
  }
  
  // Experience Requirements
  if (data.experience) {
    console.log('\n👤 EXPERIENCE REQUIREMENTS:');
    console.log(`   Level: ${data.experience.level || 'Not specified'}`);
    console.log(`   Years: ${data.experience.minYears || 0} - ${data.experience.maxYears || 0}`);
  }
  
  // Job Insights
  if (data.jobInsights) {
    console.log('\n🏢 JOB INSIGHTS:');
    if (data.jobInsights.companyType) console.log(`   Company Type: ${data.jobInsights.companyType}`);
    if (data.jobInsights.workType) console.log(`   Work Type: ${data.jobInsights.workType}`);
    if (data.jobInsights.techStack) console.log(`   Tech Stack: ${data.jobInsights.techStack.join(', ')}`);
  }
  
  // Interview Prep
  if (data.interviewPrep) {
    console.log('\n🧠 INTERVIEW PREPARATION:');
    if (data.interviewPrep.technicalTopics) {
      console.log('   Technical Topics:');
      data.interviewPrep.technicalTopics.forEach((topic, index) => {
        console.log(`      ${index + 1}. ${topic}`);
      });
    }
  }
}

function showPrepPlanPreview(job, data) {
  console.log(`📋 Job: ${job.title} at ${job.companyName || 'Company'}`);
  console.log(`📄 Source: PDF Job Description (${job.jobDescriptionFile})`);
  console.log(`🤖 AI Analysis: Gemini 1.5 Flash (Confidence: ${data.confidence})`);
  
  console.log('\n📌 CRITICAL SKILLS SECTION (Red Border):');
  if (data.requiredSkills?.critical) {
    data.requiredSkills.critical.forEach((skill, index) => {
      console.log(`   🚨 ${skill}`);
    });
  }
  
  console.log('\n📚 LEARNING PATH SECTION:');
  console.log(`   ⏱️  ${data.learningPath?.estimatedTimeWeeks || 'N/A'} weeks estimated`);
  console.log(`   🎚️  ${data.learningPath?.difficultyLevel || 'N/A'} difficulty level`);
  
  console.log('\n💡 This is what the applicant will see when they click "Create Prep Plan"!');
}

// Run the complete test
parseCompleteSavedJob();
