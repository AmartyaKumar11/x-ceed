/**
 * Test Enhanced Resume RAG Python API with OpenRouter Fallback
 * Tests the actual endpoint that the frontend calls
 */

async function testEnhancedResumeRagPython() {
  console.log('🧪 Testing Enhanced Resume RAG Python API with OpenRouter Fallback\n');
  
  // Test data that matches what the frontend sends
  const testData = {
    action: 'analyze',
    jobId: 'test-job-id',
    jobTitle: 'Full Stack Developer',
    jobDescription: 'We are looking for a Full Stack Developer with experience in React, Node.js, MongoDB, TypeScript, and AWS. Must have 3+ years of experience building scalable web applications.',
    jobRequirements: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
    resumeText: `
      Sarah Johnson
      Software Engineer
      Email: sarah.johnson@email.com
      Phone: (555) 987-6543
      
      EXPERIENCE:
      Senior Software Developer | TechCorp | 2021-2024
      - Built full-stack e-commerce platform using React and Node.js
      - Developed RESTful APIs with Express.js and MongoDB database
      - Deployed microservices on AWS using Docker containers
      - Implemented CI/CD pipeline with Jenkins and automated testing
      - Led team of 3 developers using Agile methodology
      
      Software Developer | StartupCorp | 2019-2021
      - Created responsive web applications with React and Redux
      - Worked with PostgreSQL database for analytics features
      - Used Git for version control and collaborated with remote team
      
      PROJECTS:
      1. E-commerce Platform (2023)
         - Frontend: React, Redux, TypeScript, Tailwind CSS
         - Backend: Node.js, Express.js, MongoDB, JWT authentication
         - Deployment: AWS EC2, Docker, Nginx load balancer
         - Features: Payment processing, inventory management, admin dashboard
      
      2. Task Management System (2022)
         - Technologies: React, Node.js, PostgreSQL, Redis caching
         - Real-time updates with WebSocket connections
         - Microservices architecture with Docker containers
      
      3. Analytics Dashboard (2021)
         - Backend: Python, Django, PostgreSQL
         - Frontend: React with Chart.js visualizations
         - Deployed on AWS with automated CI/CD pipeline
      
      SKILLS:
      JavaScript, HTML, CSS (basic listing - doesn't include all technologies used)
      
      EDUCATION:
      Bachelor of Science in Computer Science
      University of Technology, 2019
    `
  };
  
  console.log('📋 Test Scenario:');
  console.log('🎯 Job Requirements:', testData.jobRequirements.join(', '));
  console.log('📝 Resume Skills Listed:', 'JavaScript, HTML, CSS (incomplete)');
  console.log('💼 Resume Projects Use:', 'React, Node.js, MongoDB, TypeScript, AWS, Docker, etc.');
  console.log('🔍 Expected: System should detect skills from projects, not just skills section\n');
  
  try {
    console.log('📤 Sending request to /api/resume-rag-python...');
    
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: No auth token for testing
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response received successfully!');
      
      if (result.success) {
        const analysis = result.data?.analysis;
        
        if (analysis) {
          console.log('\n📊 Analysis Results:');
          console.log('🎯 Overall Score:', analysis.overallScore + '%');
          console.log('📚 Skills Score:', analysis.skillsScore + '%');
          console.log('✅ Matched Skills:', analysis.matchedSkills?.slice(0, 8).join(', ') || 'Not provided');
          console.log('❌ Missing Skills:', analysis.missingSkills?.slice(0, 5).join(', ') || 'Not provided');
          console.log('🔍 Analysis Type:', analysis.analysisType || 'Not specified');
          console.log('🤖 Model Used:', analysis.model || 'Not specified');
          
          if (analysis.extractedSkills) {
            console.log('🎉 Extracted Skills:', analysis.extractedSkills.slice(0, 10).join(', ') + '...');
          }
          
          if (analysis.gapAnalysis) {
            console.log('📋 Gap Analysis:', analysis.gapAnalysis.substring(0, 200) + '...');
          }
          
          // Check if intelligent extraction worked
          const hasReact = analysis.matchedSkills?.some(skill => 
            skill.toLowerCase().includes('react')
          ) || analysis.extractedSkills?.includes('react');
          
          const hasMongoDB = analysis.matchedSkills?.some(skill => 
            skill.toLowerCase().includes('mongo')
          ) || analysis.extractedSkills?.includes('mongodb');
          
          console.log('\n🔍 Intelligent Extraction Test:');
          console.log('   React detected from projects:', hasReact ? '✅ YES' : '❌ NO');
          console.log('   MongoDB detected from projects:', hasMongoDB ? '✅ YES' : '❌ NO');
          
          if (hasReact && hasMongoDB) {
            console.log('🎉 SUCCESS: Intelligent skill extraction is working!');
          } else {
            console.log('⚠️ WARNING: Skill extraction may not be working properly');
          }
          
        } else {
          console.log('⚠️ No analysis data found in response');
          console.log('📝 Full response:', JSON.stringify(result, null, 2));
        }
      } else {
        console.log('❌ API returned success: false');
        console.log('📝 Error:', result.message || 'Unknown error');
        console.log('📝 Details:', result.error || 'No details');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API request failed:', response.status, response.statusText);
      console.log('📝 Error response:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('💡 If Python service fails, the system should automatically use OpenRouter AI');
  console.log('🔧 Check server logs to see which analysis method was used');
}

// Run the test
testEnhancedResumeRagPython().catch(console.error);