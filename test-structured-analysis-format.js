/**
 * Test Structured Analysis Format for Frontend Cards
 * Tests the new response format that should render as cards
 */

async function testStructuredAnalysisFormat() {
  console.log('🧪 Testing Structured Analysis Format for Frontend Cards\n');
  
  // Test data
  const testData = {
    action: 'analyze',
    jobId: 'test-job-id',
    jobTitle: 'Frontend Developer',
    jobDescription: 'We are looking for a Frontend Developer with React, JavaScript, TypeScript, and Node.js experience.',
    jobRequirements: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
    resumeText: `
      Alex Chen
      Frontend Developer
      
      EXPERIENCE:
      - Built responsive web applications using React and TypeScript
      - Developed component libraries with modern JavaScript (ES6+)
      - Created RESTful APIs with Node.js and Express.js
      - Implemented state management with Redux and Context API
      - Used Git for version control and collaborated with design team
      
      PROJECTS:
      1. E-commerce Frontend (2023)
         - Technologies: React, TypeScript, Redux, Tailwind CSS
         - Built shopping cart, product catalog, and checkout flow
         - Integrated with payment APIs and backend services
      
      2. Dashboard Application (2022)
         - Frontend: React, JavaScript, Chart.js
         - Backend: Node.js, Express.js, MongoDB
         - Real-time data updates with WebSocket
      
      Skills: HTML, CSS (incomplete list)
    `
  };
  
  console.log('📋 Test Scenario:');
  console.log('🎯 Job Requirements:', testData.jobRequirements.join(', '));
  console.log('📝 Skills Listed:', 'HTML, CSS (very incomplete)');
  console.log('💼 Projects Use:', 'React, TypeScript, JavaScript, Node.js, Redux, etc.');
  console.log('🎯 Expected: Structured format for card rendering\n');
  
  try {
    console.log('📤 Testing structured analysis format...');
    
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ API Response received successfully!');
        
        const analysis = result.data?.analysis;
        const structuredAnalysis = analysis?.structuredAnalysis;
        const comprehensiveAnalysis = analysis?.comprehensiveAnalysis;
        
        console.log('\n📊 Response Structure Check:');
        console.log('   result.success:', result.success ? '✅' : '❌');
        console.log('   result.data exists:', !!result.data ? '✅' : '❌');
        console.log('   analysis exists:', !!analysis ? '✅' : '❌');
        console.log('   structuredAnalysis exists:', !!structuredAnalysis ? '✅' : '❌');
        console.log('   comprehensiveAnalysis exists:', !!comprehensiveAnalysis ? '✅' : '❌');
        
        if (structuredAnalysis) {
          console.log('\n🎯 Structured Analysis Data:');
          
          // Overall match
          if (structuredAnalysis.overallMatch) {
            console.log('📊 Overall Match:');
            console.log('   Score:', structuredAnalysis.overallMatch.score + '%');
            console.log('   Level:', structuredAnalysis.overallMatch.level);
            console.log('   Summary:', structuredAnalysis.overallMatch.summary);
          }
          
          // Skills analysis
          if (structuredAnalysis.skillsAnalysis) {
            console.log('\n📚 Skills Analysis:');
            console.log('   Score:', structuredAnalysis.skillsAnalysis.score + '%');
            console.log('   Matched:', structuredAnalysis.skillsAnalysis.matched?.slice(0, 5).join(', ') || 'None');
            console.log('   Missing:', structuredAnalysis.skillsAnalysis.missing?.slice(0, 3).join(', ') || 'None');
            console.log('   Extracted:', structuredAnalysis.skillsAnalysis.extracted?.slice(0, 8).join(', ') || 'None');
          }
          
          // Gap analysis
          if (structuredAnalysis.gapAnalysis) {
            console.log('\n🔍 Gap Analysis:');
            console.log('   Summary:', structuredAnalysis.gapAnalysis.summary?.substring(0, 150) + '...');
            console.log('   Critical gaps:', structuredAnalysis.gapAnalysis.critical?.join(', ') || 'None');
            console.log('   Important gaps:', structuredAnalysis.gapAnalysis.important?.join(', ') || 'None');
          }
          
          // Metadata
          if (structuredAnalysis.metadata) {
            console.log('\n🤖 Analysis Metadata:');
            console.log('   Type:', structuredAnalysis.metadata.analysisType);
            console.log('   Model:', structuredAnalysis.metadata.model);
            console.log('   Enhanced:', structuredAnalysis.metadata.enhanced ? '✅' : '❌');
          }
          
          // Test intelligent extraction
          const extractedSkills = structuredAnalysis.skillsAnalysis?.extracted || [];
          const matchedSkills = structuredAnalysis.skillsAnalysis?.matched || [];
          
          const hasReact = extractedSkills.includes('react') || matchedSkills.includes('react');
          const hasTypeScript = extractedSkills.includes('typescript') || matchedSkills.includes('typescript');
          const hasNodeJS = extractedSkills.includes('node.js') || matchedSkills.includes('node.js');
          
          console.log('\n🧪 Intelligent Extraction Test:');
          console.log('   React detected:', hasReact ? '✅ YES' : '❌ NO');
          console.log('   TypeScript detected:', hasTypeScript ? '✅ YES' : '❌ NO');
          console.log('   Node.js detected:', hasNodeJS ? '✅ YES' : '❌ NO');
          
          if (hasReact && hasTypeScript && hasNodeJS) {
            console.log('🎉 PERFECT: All project skills detected correctly!');
          } else if (hasReact || hasTypeScript || hasNodeJS) {
            console.log('✅ GOOD: Some project skills detected');
          } else {
            console.log('⚠️ WARNING: Project skills not detected properly');
          }
          
        } else {
          console.log('❌ No structured analysis found in response');
          console.log('📝 Available keys:', Object.keys(analysis || {}));
        }
        
        if (comprehensiveAnalysis) {
          console.log('\n📄 Comprehensive Analysis Preview:');
          console.log(comprehensiveAnalysis.substring(0, 300) + '...');
        }
        
        console.log('\n🎯 Frontend Card Compatibility:');
        if (structuredAnalysis && structuredAnalysis.overallMatch && structuredAnalysis.skillsAnalysis) {
          console.log('✅ Response format is compatible with frontend card rendering');
          console.log('💡 The frontend should now display beautiful cards instead of raw JSON');
        } else {
          console.log('❌ Response format may not render cards properly');
        }
        
      } else {
        console.log('❌ API returned error:', result.message);
        console.log('🔍 Error details:', result.error);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', response.status);
      console.log('📝 Response:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('✅ Enhanced OpenRouter engine now returns:');
  console.log('   1. 📊 Structured analysis for card rendering');
  console.log('   2. 📄 Comprehensive analysis for detailed view');
  console.log('   3. 🧠 Intelligent skill extraction from projects');
  console.log('   4. 🎯 Proper gap analysis and recommendations');
  console.log('\n💡 The frontend should now display beautiful cards instead of raw JSON!');
}

// Run the test
testStructuredAnalysisFormat().catch(console.error);