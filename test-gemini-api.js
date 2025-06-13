// Test script to verify Gemini API integration with the provided API key
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🔑 API Key found:', GEMINI_API_KEY.substring(0, 10) + '...');

// Test job description
const testJobDescription = `
Senior Full Stack Developer - React & Node.js

We are looking for an experienced Full Stack Developer to join our growing team. The ideal candidate will have strong experience with React.js, Node.js, and modern web development practices.

Key Requirements:
- 5+ years of experience in full-stack development
- Expert-level proficiency in React.js and JavaScript (ES6+)
- Strong experience with Node.js and Express.js
- Experience with PostgreSQL or MongoDB
- Knowledge of AWS services (EC2, S3, Lambda)
- Experience with Docker and containerization
- Understanding of CI/CD pipelines
- Strong problem-solving skills and attention to detail
- Excellent communication and teamwork abilities

Nice to Have:
- Experience with TypeScript
- Knowledge of GraphQL
- Experience with microservices architecture
- AWS certifications

Responsibilities:
- Develop and maintain web applications using React and Node.js
- Collaborate with design and product teams to implement new features
- Write clean, maintainable, and well-tested code
- Participate in code reviews and technical discussions
- Optimize applications for maximum speed and scalability
- Troubleshoot and debug applications

This is a full-time remote position with competitive salary and benefits.
`;

async function testGeminiAPI() {
  try {
    console.log('🧠 Testing Gemini API for job description parsing...\n');

    const prompt = `
You are an expert technical recruiter and career coach. Analyze this job description and extract the most critical skills and learning path.

Job Title: Senior Full Stack Developer
Company: TechCorp
Job Description: ${testJobDescription}

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
    "minYears": 5,
    "maxYears": 8,
    "level": "senior"
  },
  "learningPath": {
    "mustLearn": ["absolutely critical skills for this role"],
    "highPriority": ["very important skills"],
    "mediumPriority": ["useful skills"],
    "niceToHave": ["bonus skills"],
    "learningOrder": ["skill1", "skill2", "skill3", "..."],
    "estimatedTimeWeeks": 12,
    "difficultyLevel": "advanced"
  },
  "jobInsights": {
    "companyType": "startup|enterprise|mid-size|agency|consultancy",
    "workType": "remote|hybrid|onsite",
    "techStack": ["primary technologies used"],
    "projectTypes": ["types of projects you'll work on"]
  }
}

Focus on:
1. Identifying the 3-5 most CRITICAL skills that are absolutely mandatory
2. Creating a realistic learning timeline
3. Providing actionable career insights

Return ONLY the JSON object, no other text.
`;    const response = await fetch(
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

    console.log('📡 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📦 Raw API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No candidates in response');
      return;
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('\n🤖 Generated Text:');
    console.log(generatedText);

    // Try to extract and parse JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        console.log('\n✅ Successfully parsed JSON:');
        console.log(JSON.stringify(parsedData, null, 2));

        // Highlight critical skills
        if (parsedData.requiredSkills?.critical) {
          console.log('\n🎯 CRITICAL SKILLS IDENTIFIED:');
          parsedData.requiredSkills.critical.forEach((skill, index) => {
            console.log(`${index + 1}. ${skill}`);
          });
        }

        if (parsedData.learningPath?.mustLearn) {
          console.log('\n📚 MUST LEARN (Priority Order):');
          parsedData.learningPath.mustLearn.forEach((skill, index) => {
            console.log(`${index + 1}. ${skill}`);
          });
        }

        console.log('\n🎉 Gemini API test successful!');
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        console.log('Raw text that failed to parse:', jsonMatch[0]);
      }
    } else {
      console.error('❌ No valid JSON found in response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGeminiAPI();
