/**
 * Debug Matching Skills Card Issue
 * Check the actual data structure being returned
 */
async function debugMatchingSkills() {
  console.log('🔍 Debugging Matching Skills Card Issue\n');
  
  const testData = {
    action: 'analyze',
    jobId: 'debug-matching-skills',
    jobTitle: 'React Developer',
    jobDescription: 'We need a React Developer with JavaScript, TypeScript, and Node.js experience.',
    jobRequirements: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
    resumeText: `
      John Smith
      Frontend Developer
      
      EXPERIENCE:
      - Built responsive web applications using React and JavaScript
      - Developed component libraries with TypeScript
      - Created RESTful API integrations with Node.js backends
      
      PROJECTS:
      1. E-commerce Frontend (2023)
         - Technologies: React, JavaScript, TypeScript
         - Built product catalog and shopping cart
      
      Skills: HTML, CSS, JavaScript, React
    `
  };
  
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
      
      console.log('🔍 FULL API RESPONSE STRUCTURE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('\n📊 Top Level Keys:');
      console.log(`   success: ${result.success}`);
      console.log(`   data keys: [${Object.keys(result.data || {}).join(', ')}]`);
      
      if (result.data?.analysis) {
        console.log(`   analysis keys: [${Object.keys(result.data.analysis).join(', ')}]`);
        
        if (result.data.analysis.structuredAnalysis) {
          const sa = result.data.analysis.structuredAnalysis;
          console.log(`   structuredAnalysis keys: [${Object.keys(sa).join(', ')}]`);
          
          console.log('\n🎯 SKILLS DATA INSPECTION:');
          console.log(`   matchingSkills: ${JSON.stringify(sa.matchingSkills)}`);
          console.log(`   matchingSkills type: ${typeof sa.matchingSkills}`);
          console.log(`   matchingSkills length: ${sa.matchingSkills?.length || 'undefined'}`);
          
          console.log(`   missingSkills: ${JSON.stringify(sa.missingSkills)}`);
          console.log(`   missingSkills type: ${typeof sa.missingSkills}`);
          console.log(`   missingSkills length: ${sa.missingSkills?.length || 'undefined'}`);
          
          console.log(`   extractedSkills: ${JSON.stringify(sa.extractedSkills)}`);
          console.log(`   extractedSkills type: ${typeof sa.extractedSkills}`);
          console.log(`   extractedSkills length: ${sa.extractedSkills?.length || 'undefined'}`);
          
          console.log(`   keyStrengths: ${sa.keyStrengths?.length || 0} items`);
          if (sa.keyStrengths?.length > 0) {
            console.log(`   keyStrengths[0]: ${JSON.stringify(sa.keyStrengths[0])}`);
          }
          
          console.log('\n🔍 FRONTEND ACCESS SIMULATION:');
          console.log('   (How the frontend component tries to access the data)\n');
          
          // Simulate frontend access
          console.log('   ragAnalysis.structuredAnalysis.matchingSkills:');
          if (sa.matchingSkills && Array.isArray(sa.matchingSkills)) {
            console.log(`      ✅ Found array with ${sa.matchingSkills.length} items`);
            sa.matchingSkills.forEach((skill, i) => {
              console.log(`         ${i + 1}. "${skill}"`);
            });
          } else {
            console.log(`      ❌ Not found or not an array: ${sa.matchingSkills}`);
          }
          
          console.log('\n   ragAnalysis.structuredAnalysis.missingSkills:');
          if (sa.missingSkills && Array.isArray(sa.missingSkills)) {
            console.log(`      ✅ Found array with ${sa.missingSkills.length} items`);
            sa.missingSkills.forEach((skill, i) => {
              console.log(`         ${i + 1}. "${skill}"`);
            });
          } else {
            console.log(`      ❌ Not found or not an array: ${sa.missingSkills}`);
          }
          
          console.log('\n   ragAnalysis.structuredAnalysis.keyStrengths:');
          if (sa.keyStrengths && Array.isArray(sa.keyStrengths)) {
            console.log(`      ✅ Found array with ${sa.keyStrengths.length} items`);
            sa.keyStrengths.slice(0, 2).forEach((strength, i) => {
              console.log(`         ${i + 1}. title: "${strength.title}", description: "${strength.description}"`);
            });
          } else {
            console.log(`      ❌ Not found or not an array: ${sa.keyStrengths}`);
          }
          
        } else {
          console.log('   ❌ No structuredAnalysis found');
        }
      } else {
        console.log('   ❌ No analysis data found');
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Diagnosis
      console.log('\n🎯 DIAGNOSIS:');
      const sa = result.data?.analysis?.structuredAnalysis;
      
      if (!sa) {
        console.log('❌ PROBLEM: No structuredAnalysis object found');
        console.log('   SOLUTION: Check API response structure');
      } else if (!sa.matchingSkills || !Array.isArray(sa.matchingSkills)) {
        console.log('❌ PROBLEM: matchingSkills is missing or not an array');
        console.log(`   Current value: ${sa.matchingSkills}`);
        console.log('   SOLUTION: Fix API to return proper matchingSkills array');
      } else if (sa.matchingSkills.length === 0) {
        console.log('⚠️ PROBLEM: matchingSkills array is empty');
        console.log('   SOLUTION: Check skill matching logic in API');
      } else {
        console.log('✅ matchingSkills data looks correct');
        console.log('   PROBLEM: Might be a frontend rendering issue');
      }
      
    } else {
      console.log('❌ API request failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugMatchingSkills().catch(console.error);