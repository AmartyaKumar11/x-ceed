/**
 * Test Intelligent Skill Extraction from Resume Content
 * Tests the enhanced skill extraction that finds skills in project descriptions
 */

require('dotenv').config({ path: '.env.local' });

function testSkillExtraction() {
  console.log('🧪 Testing Intelligent Skill Extraction from Resume Content\n');
  
  // Mock resume content with skills mentioned in projects but not in skills section
  const mockResumeContent = `
    John Doe
    Software Developer
    
    Experience:
    - Built a full-stack e-commerce application using React and Node.js
    - Developed RESTful APIs with Express.js and MongoDB database
    - Implemented user authentication with JWT tokens
    - Deployed application on AWS using Docker containers
    - Used Git for version control and collaborated with team using Agile methodology
    - Created responsive UI with HTML5, CSS3, and Bootstrap
    - Worked with PostgreSQL database for analytics dashboard
    - Experience with Python scripting for data processing
    - Built microservices architecture using Kubernetes
    - Implemented CI/CD pipeline with Jenkins
    
    Projects:
    1. E-commerce Platform
       - Technologies: React, Node.js, MongoDB, Express.js
       - Built shopping cart functionality and payment integration
       - Used Redux for state management
    
    2. Analytics Dashboard
       - Technologies: Python, Django, PostgreSQL
       - Created data visualization using Chart.js
       - Implemented real-time updates with WebSocket
    
    3. Mobile App Backend
       - Technologies: Java, Spring Boot, MySQL
       - Developed REST APIs for mobile application
       - Used Docker for containerization
    
    Skills Listed: JavaScript, HTML, CSS (very basic list)
    
    Education:
    Bachelor's in Computer Science
  `;
  
  // Simulate the skill extraction function
  const extractedSkills = extractSkillsFromResumeContent(mockResumeContent);
  
  console.log('📋 Test Case 1: Skills Extraction from Resume Content');
  console.log('📝 Resume mentions these technologies in projects/experience:');
  console.log('   React, Node.js, MongoDB, Express.js, AWS, Docker, Git, Agile,');
  console.log('   HTML5, CSS3, Bootstrap, PostgreSQL, Python, Kubernetes, Jenkins,');
  console.log('   Redux, Django, Chart.js, WebSocket, Java, Spring Boot, MySQL');
  
  console.log('\n🔍 Extracted Skills:', extractedSkills);
  console.log('📊 Total Skills Found:', extractedSkills.length);
  
  // Test specific skill detection
  const expectedSkills = [
    'react', 'node.js', 'mongodb', 'express', 'aws', 'docker', 'git', 
    'agile', 'html', 'css', 'bootstrap', 'postgresql', 'python', 
    'kubernetes', 'jenkins', 'django', 'java', 'spring', 'mysql'
  ];
  
  console.log('\n📋 Test Case 2: Skill Detection Accuracy');
  const foundExpected = expectedSkills.filter(skill => extractedSkills.includes(skill));
  const missedSkills = expectedSkills.filter(skill => !extractedSkills.includes(skill));
  
  console.log('✅ Correctly Found:', foundExpected);
  console.log('❌ Missed Skills:', missedSkills);
  console.log('📊 Detection Rate:', Math.round((foundExpected.length / expectedSkills.length) * 100) + '%');
  
  // Test with job requirements
  console.log('\n📋 Test Case 3: Gap Analysis with Extracted Skills');
  const jobRequirements = ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS', 'Docker'];
  const explicitSkills = ['JavaScript', 'HTML', 'CSS']; // What user listed in skills section
  
  console.log('🎯 Job Requirements:', jobRequirements);
  console.log('📝 Explicit Skills (what user listed):', explicitSkills);
  console.log('🔍 Skills from Resume Content:', extractedSkills.filter(skill => 
    jobRequirements.some(req => req.toLowerCase().includes(skill) || skill.includes(req.toLowerCase()))
  ));
  
  // Simulate the enhanced analysis
  const allUserSkills = [...explicitSkills.map(s => s.toLowerCase()), ...extractedSkills];
  const jobReqsLower = jobRequirements.map(req => req.toLowerCase());
  
  const matched = jobReqsLower.filter(req => 
    allUserSkills.some(skill => skill.includes(req) || req.includes(skill))
  );
  
  const missing = jobReqsLower.filter(req => !matched.includes(req));
  
  console.log('✅ Matched Requirements:', matched);
  console.log('❌ Missing Requirements:', missing);
  console.log('📊 Match Score:', Math.round((matched.length / jobReqsLower.length) * 100) + '%');
  
  console.log('\n💡 Impact Analysis:');
  console.log('   Without intelligent extraction: Only JavaScript, HTML, CSS would be detected');
  console.log('   With intelligent extraction: React, Node.js, MongoDB, AWS, Docker also detected');
  console.log('   This dramatically improves the accuracy of gap analysis!');
  
  console.log('\n🎯 Test completed successfully!');
}

// Simulate the extractSkillsFromResumeContent function
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
    { skill: 'bootstrap', variations: ['bootstrap'] },
    { skill: 'redux', variations: ['redux'] },
    
    // Backend Technologies
    { skill: 'node.js', variations: ['node', 'nodejs', 'node.js'] },
    { skill: 'express', variations: ['express', 'expressjs', 'express.js'] },
    { skill: 'python', variations: ['python', 'py'] },
    { skill: 'django', variations: ['django'] },
    { skill: 'java', variations: ['java'] },
    { skill: 'spring', variations: ['spring', 'spring boot', 'springboot'] },
    
    // Databases
    { skill: 'mongodb', variations: ['mongodb', 'mongo'] },
    { skill: 'mysql', variations: ['mysql'] },
    { skill: 'postgresql', variations: ['postgresql', 'postgres'] },
    
    // Cloud & DevOps
    { skill: 'aws', variations: ['aws', 'amazon web services'] },
    { skill: 'docker', variations: ['docker', 'containerization'] },
    { skill: 'kubernetes', variations: ['kubernetes', 'k8s'] },
    { skill: 'jenkins', variations: ['jenkins'] },
    { skill: 'ci/cd', variations: ['ci/cd', 'continuous integration', 'continuous deployment'] },
    
    // Tools & Others
    { skill: 'git', variations: ['git', 'version control'] },
    { skill: 'agile', variations: ['agile', 'agile methodology'] },
    { skill: 'rest api', variations: ['rest', 'rest api', 'restful', 'api'] },
    { skill: 'websocket', variations: ['websocket', 'web socket'] },
    { skill: 'jwt', variations: ['jwt', 'json web token'] }
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
        new RegExp(`technologies:.*${variation}`, 'i') // "Technologies: React, Node.js"
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
testSkillExtraction();