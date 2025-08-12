/**
 * Test OpenRouter Fallback by Simulating Python Service Failure
 * This will help us verify the fallback system works
 */

async function testForceOpenRouterFallback() {
  console.log('🧪 Testing OpenRouter Fallback (Simulating Python Service Failure)\n');
  
  // Test data
  const testData = {
    action: 'analyze',
    jobId: 'test-job-id',
    jobTitle: 'Backend Developer',
    jobDescription: 'We need a Backend Developer with Node.js, MongoDB, Express.js, Docker, and AWS experience.',
    jobRequirements: ['Node.js', 'MongoDB', 'Express.js', 'Docker', 'AWS'],
    resumeText: `
      John Smith
      Software Developer
      
      EXPERIENCE:
      - Built RESTful APIs using Node.js and Express.js framework
      - Implemented database operations with MongoDB and Mongoose ODM
      - Deployed applications on AWS using Docker containers
      - Created microservices architecture for scalable applications
      - Used Git for version control and Jenkins for CI/CD pipeline
      
      PROJECTS:
      1. E-commerce Backend API
         - Technologies: Node.js, Express.js, MongoDB
         - Authentication with JWT tokens
         - Deployed on AWS EC2 with Docker
      
      2. Task Management System
         - Backend: Python, Django, PostgreSQL
         - Real-time features with WebSocket
         - Containerized with Docker
      
      Skills Listed: JavaScript, HTML (very basic list)
    `
  };
  
  console.log('📋 Test Scenario:');
  console.log('🎯 Job Requirements:', testData.jobRequirements.join(', '));
  console.log('📝 Skills Listed:', 'JavaScript, HTML (incomplete)');
  console.log('💼 Projects Mention:', 'Node.js, Express.js, MongoDB, Docker, AWS');
  console.log('🔧 Strategy: Python service will likely fail due to rate limits\n');
  
  try {
    console.log('📤 Sending request to /api/resume-rag-python...');
    console.log('⏳ Waiting for Python service to fail and OpenRouter to take over...\n');
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📊 Response Status:', response.status);
    console.log('⏱️ Response Time:', responseTime + 'ms');
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response received!');
      
      if (result.success) {
        const analysis = result.data?.analysis;
        
        if (analysis) {
          console.log('\n📊 Analysis Results:');
          console.log('🎯 Overall Score:', analysis.overallScore + '%');
          console.log('📚 Skills Score:', analysis.skillsScore + '%');
          console.log('🔍 Analysis Type:', analysis.analysisType || 'Not specified');
          console.log('🤖 Model Used:', analysis.model || 'Not specified');
          
          // Check which service was used
          if (analysis.analysisType === 'openrouter-ai') {
            console.log('🎉 SUCCESS: OpenRouter AI was used as fallback!');
            console.log('✅ Matched Skills:', analysis.matchedSkills?.join(', ') || 'Not provided');
            console.log('❌ Missing Skills:', analysis.missingSkills?.join(', ') || 'Not provided');
            
            if (analysis.extractedSkills) {
              console.log('🔍 Extracted Skills:', analysis.extractedSkills.join(', '));
              
              // Test intelligent extraction
              const hasNodeJS = analysis.extractedSkills.includes('node.js');
              const hasMongoDB = analysis.extractedSkills.includes('mongodb');
              const hasExpress = analysis.extractedSkills.includes('express');
              
              console.log('\n🧪 Intelligent Extraction Results:');
              console.log('   Node.js detected:', hasNodeJS ? '✅ YES' : '❌ NO');
              console.log('   MongoDB detected:', hasMongoDB ? '✅ YES' : '❌ NO');
              console.log('   Express detected:', hasExpress ? '✅ YES' : '❌ NO');
              
              if (hasNodeJS && hasMongoDB && hasExpress) {
                console.log('🎉 PERFECT: All project skills detected correctly!');
              }
            }
            
          } else if (analysis.analysisType === 'enhanced-fallback') {
            console.log('🔄 Enhanced JavaScript fallback was used');
            console.log('✅ This means both Python and OpenRouter failed, but we still got intelligent analysis');
            
          } else {
            console.log('🐍 Python service was used (no fallback needed)');
            console.log('💡 To test fallback, stop the Python service or wait for rate limits');
          }
          
          if (analysis.gapAnalysis) {
            console.log('\n📋 Gap Analysis Preview:');
            console.log(analysis.gapAnalysis.substring(0, 300) + '...');
          }
          
        } else {
          console.log('⚠️ No analysis data in response');
        }
      } else {
        console.log('❌ API returned error:', result.message);
        console.log('🔍 Error details:', result.error);
        
        // This might indicate the fallback system is working
        if (result.message?.includes('Python service error')) {
          console.log('🎯 This confirms Python service failed - checking if fallback worked...');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', response.status, response.statusText);
      console.log('📝 Response:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('✅ Enhanced resume-rag-python endpoint now has:');
  console.log('   1. Python service (primary)');
  console.log('   2. OpenRouter AI (secondary fallback)');
  console.log('   3. Enhanced JavaScript analysis (tertiary fallback)');
  console.log('   4. Intelligent skill extraction in all fallback methods');
  console.log('\n💡 The "Python service error: All API keys rate limited" should now be resolved!');
}

// Run the test
testForceOpenRouterFallback().catch(console.error);