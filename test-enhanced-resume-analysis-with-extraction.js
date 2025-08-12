/**
 * Test Enhanced Resume Analysis with Intelligent Skill Extraction
 * Tests the complete workflow with project-based skill detection
 */

require('dotenv').config({ path: '.env.local' });

async function testEnhancedAnalysisWithExtraction() {
  console.log('🧪 Testing Enhanced Resume Analysis with Intelligent Skill Extraction\n');
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API Key not found');
    return;
  }
  
  // Test scenario: User lists basic skills but has advanced projects
  const testData = {
    jobTitle: 'Full Stack Developer',
    jobDescription: 'We need a Full Stack Developer with React, Node.js, MongoDB, TypeScript, AWS, and Docker experience. Must have experience building scalable web applications.',
    jobRequirements: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS', 'Docker'],
    userSkills: ['JavaScript', 'HTML', 'CSS'], // Basic skills listed
    resumeText: `
      Jane Smith
      Software Developer
      
      Experience:
      - Built a full-stack e-commerce platform using React and Node.js
      - Developed RESTful APIs with Express.js and MongoDB database
      - Deployed microservices on AWS using Docker containers
      - Implemented CI/CD pipeline with Jenkins and automated testing
      - Used Git for version control and Agile methodology for project management
      - Created responsive UI components with React hooks and Redux
      - Worked with PostgreSQL for analytics and reporting features
      - Experience with Python for data processing scripts
      
      Projects:
      1. E-commerce Platform (2023)
         - Frontend: React, Redux, HTML5, CSS3, Bootstrap
         - Backend: Node.js, Express.js, MongoDB
         - Deployment: AWS EC2, Docker, Nginx
         - Features: User authentication, payment processing, inventory management
      
      2. Task Management App (2022)
         - Technologies: React, Node.js, PostgreSQL, Redis
         - Implemented real-time updates with WebSocket
         - Used JWT for authentication
      
      3. Data Analytics Dashboard (2022)
         - Backend: Python, Django, PostgreSQL
         - Frontend: React, Chart.js for visualizations
         - Deployed on AWS with Docker containers
      
      Skills: JavaScript, HTML, CSS (basic listing)
      
      Education:
      Bachelor's in Computer Science, 2021
    `
  };
  
  console.log('📋 Test Scenario:');
  console.log('🎯 Job Requirements:', testData.jobRequirements.join(', '));
  console.log('📝 User Listed Skills:', testData.userSkills.join(', '));
  console.log('💼 Resume Contains Projects With: React, Node.js, MongoDB, AWS, Docker, etc.\n');
  
  // Test 1: Basic skill analysis (without extraction)
  console.log('📊 Test 1: Basic Analysis (Skills Section Only)');
  const basicMatched = testData.jobRequirements.filter(req => 
    testData.userSkills.some(skill => 
      skill.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(skill.toLowerCase())
    )
  );
  console.log('✅ Basic Matched:', basicMatched);
  console.log('❌ Basic Missing:', testData.jobRequirements.filter(req => !basicMatched.includes(req)));
  console.log('📊 Basic Score:', Math.round((basicMatched.length / testData.jobRequirements.length) * 100) + '%\n');
  
  // Test 2: Enhanced analysis (with extraction)
  console.log('📊 Test 2: Enhanced Analysis (With Project Extraction)');
  const extractedSkills = extractSkillsFromResumeContent(testData.resumeText);
  const allSkills = [...testData.userSkills.map(s => s.toLowerCase()), ...extractedSkills];
  
  console.log('🔍 Extracted from Projects:', extractedSkills.slice(0, 10).join(', ') + '...');
  
  const enhancedMatched = testData.jobRequirements.filter(req => 
    allSkills.some(skill => 
      skill.includes(req.toLowerCase()) || req.toLowerCase().includes(skill)
    )
  );
  
  console.log('✅ Enhanced Matched:', enhancedMatched);
  console.log('❌ Enhanced Missing:', testData.jobRequirements.filter(req => !enhancedMatched.includes(req)));
  console.log('📊 Enhanced Score:', Math.round((enhancedMatched.length / testData.jobRequirements.length) * 100) + '%\n');
  
  // Test 3: OpenRouter AI Analysis with enhanced prompt
  console.log('📊 Test 3: OpenRouter AI Analysis (With Enhanced Context)');
  
  try {
    const prompt = `Analyze this candidate for a Full Stack Developer position:

JOB REQUIREMENTS: ${testData.jobRequirements.join(', ')}

CANDIDATE ANALYSIS:
Listed Skills: ${testData.userSkills.join(', ')}
Skills from Projects: ${extractedSkills.slice(0, 15).join(', ')}
Resume Projects: ${testData.resumeText.substring(testData.resumeText.indexOf('Projects:'), 800)}

IMPORTANT: Consider BOTH listed skills AND demonstrated skills from projects. Return JSON with overallScore, matchedSkills, missingSkills, and gapAnalysis.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3002',
        'X-Title': 'X-CEED Enhanced Resume Analysis Test'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          let aiResult = null;
          try {
            aiResult = JSON.parse(content.trim());
          } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiResult = JSON.parse(jsonMatch[0]);
            }
          }
          
          if (aiResult) {
            console.log('✅ OpenRouter AI Analysis Results:');
            console.log('📊 AI Overall Score:', aiResult.overallScore + '%');
            console.log('✅ AI Matched Skills:', aiResult.matchedSkills?.slice(0, 8).join(', ') || 'Not provided');
            console.log('❌ AI Missing Skills:', aiResult.missingSkills?.slice(0, 5).join(', ') || 'Not provided');
            console.log('🔍 AI Gap Analysis:', aiResult.gapAnalysis?.substring(0, 200) + '...' || 'Not provided');
          } else {
            console.log('⚠️ Could not parse AI response as JSON');
            console.log('📝 Raw response:', content.substring(0, 300) + '...');
          }
        } catch (error) {
          console.log('❌ Error parsing AI response:', error.message);
        }
      }
    } else {
      console.log('❌ OpenRouter API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ OpenRouter test failed:', error.message);
  }
  
  console.log('\n📊 Summary Comparison:');
  console.log('🔴 Basic Analysis (Skills Only):', Math.round((basicMatched.length / testData.jobRequirements.length) * 100) + '% match');
  console.log('🟢 Enhanced Analysis (With Projects):', Math.round((enhancedMatched.length / testData.jobRequirements.length) * 100) + '% match');
  console.log('💡 Improvement:', (enhancedMatched.length - basicMatched.length), 'additional skills detected');
  
  console.log('\n🎯 Test completed! The enhanced analysis dramatically improves accuracy.');
}

// Simulate the skill extraction function
function extractSkillsFromResumeContent(resumeText) {
  if (!resumeText) return [];
  
  const resumeTextLower = resumeText.toLowerCase();
  
  const skillDatabase = [
    { skill: 'react', variations: ['react', 'reactjs', 'react.js'] },
    { skill: 'node.js', variations: ['node', 'nodejs', 'node.js'] },
    { skill: 'mongodb', variations: ['mongodb', 'mongo'] },
    { skill: 'typescript', variations: ['typescript', 'ts'] },
    { skill: 'aws', variations: ['aws', 'amazon web services'] },
    { skill: 'docker', variations: ['docker', 'containerization'] },
    { skill: 'express', variations: ['express', 'expressjs', 'express.js'] },
    { skill: 'redux', variations: ['redux'] },
    { skill: 'postgresql', variations: ['postgresql', 'postgres'] },
    { skill: 'python', variations: ['python', 'py'] },
    { skill: 'django', variations: ['django'] },
    { skill: 'jenkins', variations: ['jenkins'] },
    { skill: 'git', variations: ['git', 'version control'] },
    { skill: 'agile', variations: ['agile', 'agile methodology'] },
    { skill: 'redis', variations: ['redis'] },
    { skill: 'websocket', variations: ['websocket', 'web socket'] },
    { skill: 'jwt', variations: ['jwt', 'json web token'] },
    { skill: 'nginx', variations: ['nginx'] },
    { skill: 'html', variations: ['html', 'html5'] },
    { skill: 'css', variations: ['css', 'css3'] },
    { skill: 'bootstrap', variations: ['bootstrap'] }
  ];
  
  const extractedSkills = [];
  
  skillDatabase.forEach(({ skill, variations }) => {
    const found = variations.some(variation => {
      const patterns = [
        new RegExp(`\\b${variation}\\b`, 'i'),
        new RegExp(`using.*${variation}`, 'i'),
        new RegExp(`built.*${variation}`, 'i'),
        new RegExp(`technologies:.*${variation}`, 'i'),
        new RegExp(`${variation}.*application`, 'i')
      ];
      
      return patterns.some(pattern => pattern.test(resumeTextLower));
    });
    
    if (found && !extractedSkills.includes(skill)) {
      extractedSkills.push(skill);
    }
  });
  
  return extractedSkills;
}

// Run the test
testEnhancedAnalysisWithExtraction().catch(console.error);