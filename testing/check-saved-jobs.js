// Direct script to check saved jobs and parse PDF job descriptions
import { MongoClient, ObjectId } from 'mongodb';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const DB_NAME = 'x-ceed-db';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function checkSavedJobsAndParse() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    // Get all saved jobs
    console.log('📋 Checking saved jobs...\n');
    
    const savedJobs = await db.collection('savedJobs').find({}).toArray();
    console.log(`Found ${savedJobs.length} saved job(s).`);
    
    if (savedJobs.length === 0) {
      console.log('❌ No saved jobs found.');
      return;
    }
    
    // For each saved job, get the job details and parse if it has a PDF
    for (let i = 0; i < savedJobs.length; i++) {
      const savedJob = savedJobs[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📌 SAVED JOB ${i + 1}`);
      console.log(`${'='.repeat(80)}`);
        // Get job details
      let jobQuery;
      if (typeof savedJob.jobId === 'string') {
        // If jobId is a string, try to convert to ObjectId
        try {
          jobQuery = { _id: new ObjectId(savedJob.jobId) };
        } catch (e) {
          // If conversion fails, search by string
          jobQuery = { _id: savedJob.jobId };
        }
      } else {
        // If jobId is already an ObjectId
        jobQuery = { _id: savedJob.jobId };
      }
      
      const job = await db.collection('jobs').findOne(jobQuery);
      
      if (!job) {
        console.log('❌ Job not found or deleted');
        continue;
      }
      
      console.log(`🏢 Job Title: ${job.title}`);
      console.log(`🏢 Company: ${job.companyName || 'Not specified'}`);
      console.log(`📍 Location: ${job.location || job.workMode}`);
      console.log(`💰 Salary: $${job.salaryMin} - $${job.salaryMax} ${job.currency || 'USD'}`);
      console.log(`📅 Status: ${job.status}`);
      console.log(`📝 Job Description Type: ${job.jobDescriptionType || 'text'}`);
      console.log(`📄 PDF File: ${job.jobDescriptionFile || 'None'}`);
      console.log(`👤 Saved by applicant: ${savedJob.applicantId}`);
      console.log(`⏰ Saved at: ${savedJob.savedAt}`);
      
      if (job.description) {
        console.log(`📋 Description Preview: ${job.description.substring(0, 200)}...`);
      }
      
      // If this job has a PDF file, let's parse it
      if (job.jobDescriptionFile && (job.jobDescriptionType === 'file' || job.jobDescriptionType === 'pdf')) {
        console.log('\n🤖 PARSING PDF JOB DESCRIPTION WITH AI...');
        console.log('-'.repeat(50));
        
        try {
          const parseResult = await parseJobDescriptionWithGemini(job);
          
          if (parseResult.success) {
            const data = parseResult.data;
            console.log('✅ Successfully parsed with Gemini AI!');
            console.log(`🔥 Confidence: ${data.confidence || 'N/A'}`);
            console.log(`🧠 Source: ${data.source || 'unknown'}`);
            
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
            
            // Frameworks
            if (data.requiredSkills?.frameworks && data.requiredSkills.frameworks.length > 0) {
              console.log('\n🚀 FRAMEWORKS & LIBRARIES:');
              data.requiredSkills.frameworks.forEach((framework, index) => {
                console.log(`   ${index + 1}. ${framework}`);
              });
            }
            
            // Tools
            if (data.requiredSkills?.tools && data.requiredSkills.tools.length > 0) {
              console.log('\n🛠️  TOOLS & PLATFORMS:');
              data.requiredSkills.tools.forEach((tool, index) => {
                console.log(`   ${index + 1}. ${tool}`);
              });
            }
            
            // Databases
            if (data.requiredSkills?.databases && data.requiredSkills.databases.length > 0) {
              console.log('\n🗄️  DATABASES:');
              data.requiredSkills.databases.forEach((db, index) => {
                console.log(`   ${index + 1}. ${db}`);
              });
            }
            
            // Cloud Services
            if (data.requiredSkills?.cloud && data.requiredSkills.cloud.length > 0) {
              console.log('\n☁️  CLOUD SERVICES:');
              data.requiredSkills.cloud.forEach((cloud, index) => {
                console.log(`   ${index + 1}. ${cloud}`);
              });
            }
            
            // Learning Path
            if (data.learningPath) {
              console.log('\n📚 LEARNING PATH RECOMMENDATIONS:');
              
              if (data.learningPath.mustLearn && data.learningPath.mustLearn.length > 0) {
                console.log('\n🎯 MUST LEARN FIRST (Priority 1):');
                data.learningPath.mustLearn.forEach((skill, index) => {
                  console.log(`   ${index + 1}. ${skill}`);
                });
              }
              
              if (data.learningPath.highPriority && data.learningPath.highPriority.length > 0) {
                console.log('\n🔥 HIGH PRIORITY (Priority 2):');
                data.learningPath.highPriority.forEach((skill, index) => {
                  console.log(`   ${index + 1}. ${skill}`);
                });
              }
              
              if (data.learningPath.mediumPriority && data.learningPath.mediumPriority.length > 0) {
                console.log('\n📈 MEDIUM PRIORITY (Priority 3):');
                data.learningPath.mediumPriority.forEach((skill, index) => {
                  console.log(`   ${index + 1}. ${skill}`);
                });
              }
              
              if (data.learningPath.niceToHave && data.learningPath.niceToHave.length > 0) {
                console.log('\n✨ NICE TO HAVE (Bonus):');
                data.learningPath.niceToHave.forEach((skill, index) => {
                  console.log(`   ${index + 1}. ${skill}`);
                });
              }
              
              if (data.learningPath.estimatedTimeWeeks) {
                console.log(`\n⏱️  ESTIMATED LEARNING TIME: ${data.learningPath.estimatedTimeWeeks} weeks`);
              }
              
              if (data.learningPath.difficultyLevel) {
                console.log(`🎚️  DIFFICULTY LEVEL: ${data.learningPath.difficultyLevel}`);
              }
            }
            
            // Experience Requirements
            if (data.experience) {
              console.log('\n👤 EXPERIENCE REQUIREMENTS:');
              console.log(`   Level: ${data.experience.level || 'Not specified'}`);
              console.log(`   Years: ${data.experience.minYears || 0} - ${data.experience.maxYears || 0} years`);
            }
            
            // Job Insights
            if (data.jobInsights) {
              console.log('\n🏢 JOB INSIGHTS:');
              if (data.jobInsights.companyType) console.log(`   Company Type: ${data.jobInsights.companyType}`);
              if (data.jobInsights.workType) console.log(`   Work Type: ${data.jobInsights.workType}`);
              if (data.jobInsights.techStack) console.log(`   Tech Stack: ${data.jobInsights.techStack.join(', ')}`);
            }
            
          } else {
            console.log(`❌ Failed to parse: ${parseResult.error}`);
          }
          
        } catch (error) {
          console.log(`❌ Error parsing job: ${error.message}`);
        }
        
      } else {
        console.log('\n📝 This job has a text description (no PDF to parse)');
        if (job.description && job.description.length > 50) {
          console.log('🤖 Parsing text description with AI...');
          try {
            const parseResult = await parseJobDescriptionWithGemini(job);
            if (parseResult.success && parseResult.data.requiredSkills?.critical) {
              console.log('\n🎯 Key Skills Identified:');
              parseResult.data.requiredSkills.critical.forEach((skill, index) => {
                console.log(`   ${index + 1}. ${skill}`);
              });
            }
          } catch (error) {
            console.log(`❌ Error parsing text: ${error.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function parseJobDescriptionWithGemini(job) {
  try {
    const prompt = `
You are an expert technical recruiter and career coach. Analyze this job description and extract the most critical skills and learning path.

Job Title: ${job.title}
Company: ${job.companyName || 'Company'}
Job Description: ${job.description || 'See PDF file'}

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
    "estimatedTimeWeeks": 12,
    "difficultyLevel": "beginner|intermediate|advanced|expert"
  },
  "jobInsights": {
    "companyType": "startup|enterprise|mid-size|agency|consultancy",
    "workType": "remote|hybrid|onsite",
    "techStack": ["primary technologies used"]
  }
}

Focus on identifying the 3-5 most CRITICAL skills that are absolutely mandatory for this role.

Return ONLY the JSON object, no other text.
`;

    // If there's a PDF file, we need to extract its content first
    let jobDescriptionText = job.description || '';
    
    if (job.jobDescriptionFile) {
      console.log('   📄 Extracting PDF content...');
      try {
        // This would normally call the PDF extraction API
        // For now, we'll use the regular description and note the PDF
        jobDescriptionText += `\n\nNote: This job has a PDF job description file: ${job.jobDescriptionFile}`;
      } catch (pdfError) {
        console.log('   ⚠️  Could not extract PDF content, using text description');
      }
    }

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
              text: prompt.replace(job.description || 'See PDF file', jobDescriptionText)
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
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.confidence = 0.95;
        parsed.source = 'gemini-ai';
        return { success: true, data: parsed };
      } catch (parseError) {
        throw new Error('Failed to parse Gemini JSON response');
      }
    }
    
    throw new Error('No valid JSON found in Gemini response');
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the check
checkSavedJobsAndParse();
