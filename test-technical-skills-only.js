/**
 * Test Technical Skills Only Analysis
 * Verifies that we only get technical skills, no generic soft skills
 */

async function testTechnicalSkillsOnly() {
  console.log('🧪 Testing Technical Skills Only Analysis\n');
  
  const testData = {
    action: 'analyze',
    jobId: 'test-job-id',
    jobTitle: 'Backend Developer',
    jobDescription: 'We are looking for a Backend Developer with Node.js, Express.js, MongoDB, Docker, and AWS experience. Must be self-motivated and have reliable internet connection for remote work.',
    jobRequirements: ['Node.js', 'Express.js', 'MongoDB', 'Docker', 'AWS'],
    resumeText: `
      Alex Rodriguez
      Backend Developer
      
      EXPERIENCE:
      - Built RESTful APIs using Node.js and Express.js
      - Implemented database operations with MongoDB and Mongoose
      - Deployed applications on AWS using Docker containers
      - Created microservices architecture for e-commerce platform
      - Worked remotely with distributed team using Agile methodology
      
      PROJECTS:
      1. E-commerce API (2023)
         - Backend: Node.js, Express.js, MongoDB
         - Authentication: JWT tokens
         - Deployment: AWS EC2, Docker, Nginx
         - Payment integration with Stripe API
      
      2. Analytics Service (2022)
         - Technologies: Python, Django, PostgreSQL
         - Real-time data processing with Redis
         - Containerized with Docker and Kubernetes
      
      Skills: JavaScript, Python, SQL
    `
  };
  
  console.log('📋 Test Scenario:');
  console.log('🎯 Job Requirements:', testData.jobRequirements.join(', '));
  console.log('💼 Resume Contains:', 'Node.js, Express.js, MongoDB, Docker, AWS, Python, Django, PostgreSQL, Redis, Kubernetes');
  console.log('🚫 Job Description Also Mentions:', 'self-motivated, reliable internet connection (should be IGNORED)');
  console.log('✅ Expected: Only technical skills in analysis\n');
  
  try {
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data?.analysis?.structuredAnalysis) {
        const sa = result.data.analysis.structuredAnalysis;
        
        console.log('🎯 TECHNICAL SKILLS ANALYSIS RESULTS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n✅ Matching Technical Skills:');
        console.log('   Count:', sa.matchingSkills?.length || 0);
        console.log('   Skills:', sa.matchingSkills?.join(', ') || 'None');
        
        console.log('\n❌ Missing Technical Skills:');
        console.log('   Count:', sa.missingSkills?.length || 0);
        console.log('   Skills:', sa.missingSkills?.join(', ') || 'None');
        
        console.log('\n🔍 Skills to Improve:');
        console.log('   Count:', sa.skillsToImprove?.length || 0);
        console.log('   Skills:', sa.skillsToImprove?.join(', ') || 'None');
        
        console.log('\n📊 Overall Assessment:');
        console.log('   Score:', sa.overallMatch?.score + '%');
        console.log('   Level:', sa.overallMatch?.level);
        console.log('   Summary:', sa.overallMatch?.summary);
        
        // Check for unwanted generic skills
        const allSkills = [
          ...(sa.matchingSkills || []),
          ...(sa.missingSkills || []),
          ...(sa.skillsToImprove || [])
        ].map(skill => skill.toLowerCase());
        
        const genericSkills = [
          'self-motivated', 'communication', 'reliable internet', 'home office',
          'remote work', 'independent', 'motivated', 'organized', 'detail-oriented',
          'team player', 'problem solving', 'analytical thinking'
        ];
        
        const foundGenericSkills = genericSkills.filter(generic => 
          allSkills.some(skill => skill.includes(generic))
        );
        
        console.log('\n🚫 Generic Skills Check:');
        if (foundGenericSkills.length === 0) {
          console.log('✅ PERFECT: No generic/soft skills found in analysis');
          console.log('✅ Analysis focuses only on technical skills');
        } else {
          console.log('❌ WARNING: Found generic skills:', foundGenericSkills.join(', '));
          console.log('🔧 These should be filtered out');
        }
        
        // Check for expected technical skills
        const expectedTechnicalSkills = ['node.js', 'express', 'mongodb', 'docker', 'aws'];
        const foundTechnicalSkills = expectedTechnicalSkills.filter(tech => 
          allSkills.some(skill => skill.toLowerCase().includes(tech))
        );
        
        console.log('\n🎯 Technical Skills Detection:');
        expectedTechnicalSkills.forEach(tech => {
          const found = allSkills.some(skill => skill.toLowerCase().includes(tech));
          console.log(`   ${tech}:`, found ? '✅ DETECTED' : '❌ MISSED');
        });
        
        console.log('\n📱 Frontend Card Impact:');
        console.log('   Matching Skills Card:', sa.matchingSkills?.length || 0, 'technical skills');
        console.log('   Missing Skills Card:', sa.missingSkills?.length || 0, 'technical skills');
        console.log('   Key Strengths Card:', sa.keyStrengths?.length || 0, 'strengths');
        
        if ((sa.matchingSkills?.length || 0) > 0 && (sa.missingSkills?.length || 0) <= 4) {
          console.log('✅ Cards should display clean, professional technical analysis');
        } else {
          console.log('⚠️ Cards may still show too many or too few skills');
        }
        
      } else {
        console.log('❌ No structured analysis found in response');
      }
    } else {
      console.log('❌ API request failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n🎯 EXPECTED IMPROVEMENTS:');
  console.log('✅ Matching Skills: Node.js, Express.js, MongoDB, Docker, AWS');
  console.log('❌ Missing Skills: Only 2-3 most important technical skills');
  console.log('🚫 NO Generic Skills: No "self-motivated", "reliable internet", etc.');
  console.log('💡 Clean, Professional Analysis: Focus on what matters for the job');
}

// Run the test
testTechnicalSkillsOnly().catch(console.error);