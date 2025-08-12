/**
 * Debug Key Strengths Card Issue
 * Test what data is being passed to generateKeyStrengths
 */
async function debugKeyStrengths() {
  console.log('🔍 Debugging Key Strengths Card Issue\n');
  
  const testData = {
    action: 'analyze',
    jobId: 'debug-key-strengths',
    jobTitle: 'React Developer',
    jobDescription: 'We need a React Developer with JavaScript and Node.js experience.',
    jobRequirements: ['React', 'JavaScript', 'Node.js'],
    resumeText: `
      John Smith
      Frontend Developer
      
      EXPERIENCE:
      - Built responsive web applications using React and JavaScript
      - Developed component libraries with modern ES6+ features
      - Created RESTful API integrations with Node.js backends
      
      PROJECTS:
      1. E-commerce Frontend (2023)
         - Technologies: React, JavaScript, CSS3
         - Built product catalog and shopping cart
      
      Skills: HTML, CSS, JavaScript
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
      
      if (result.success && result.data?.analysis?.structuredAnalysis) {
        const sa = result.data.analysis.structuredAnalysis;
        
        console.log('🔍 DEBUG DATA:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n📊 Input Data for Key Strengths:');
        console.log(`   Matching Skills: [${sa.matchingSkills?.join(', ') || 'EMPTY'}]`);
        console.log(`   Extracted Skills: [${sa.extractedSkills?.join(', ') || 'EMPTY'}]`);
        console.log(`   Matching Skills Length: ${sa.matchingSkills?.length || 0}`);
        console.log(`   Extracted Skills Length: ${sa.extractedSkills?.length || 0}`);
        
        console.log('\n💪 Key Strengths Output:');
        console.log(`   Key Strengths Count: ${sa.keyStrengths?.length || 0}`);
        
        if (sa.keyStrengths && sa.keyStrengths.length > 0) {
          sa.keyStrengths.forEach((strength, i) => {
            console.log(`   ${i + 1}. Title: "${strength.title || 'MISSING TITLE'}"`);
            console.log(`      Description: "${strength.description || 'MISSING DESCRIPTION'}"`);
            console.log(`      Relevance: "${strength.relevance || 'MISSING RELEVANCE'}"`);
          });
        } else {
          console.log('   ❌ NO KEY STRENGTHS GENERATED');
        }
        
        console.log('\n🔍 Raw Analysis Data:');
        console.log('   Analysis Type:', sa.metadata?.analysisType);
        console.log('   Model Used:', sa.metadata?.model);
        
        // Test the function directly
        console.log('\n🧪 DIRECT FUNCTION TEST:');
        const testMatchedSkills = sa.matchingSkills || [];
        const testExtractedSkills = sa.extractedSkills || [];
        
        console.log(`   Test Input - Matched: [${testMatchedSkills.join(', ')}]`);
        console.log(`   Test Input - Extracted: [${testExtractedSkills.join(', ')}]`);
        
        // Simulate the function
        const allSkills = [...new Set([...testMatchedSkills, ...testExtractedSkills])];
        console.log(`   Combined Skills: [${allSkills.join(', ')}]`);
        
        const testKeyStrengths = allSkills.slice(0, 5).map(skill => ({
          title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Proficiency`,
          description: `Demonstrated experience with ${skill} through projects and work experience`,
          relevance: 'High'
        }));
        
        console.log(`   Generated Key Strengths: ${testKeyStrengths.length}`);
        testKeyStrengths.forEach((strength, i) => {
          console.log(`      ${i + 1}. "${strength.title}" - ${strength.description}`);
        });
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Diagnosis
        console.log('\n🎯 DIAGNOSIS:');
        if (sa.keyStrengths?.length === 0) {
          console.log('❌ PROBLEM: Key Strengths array is empty');
          if (testMatchedSkills.length === 0 && testExtractedSkills.length === 0) {
            console.log('   ROOT CAUSE: No skills detected (both matched and extracted are empty)');
          } else {
            console.log('   ROOT CAUSE: generateKeyStrengths function not being called properly');
          }
        } else if (sa.keyStrengths?.some(s => !s.title || s.title === 'High Relevance')) {
          console.log('❌ PROBLEM: Key Strengths have missing or incorrect titles');
          console.log('   ROOT CAUSE: Data structure mismatch or function error');
        } else {
          console.log('✅ Key Strengths appear to be working correctly');
        }
        
      } else {
        console.log('❌ No structured analysis found');
      }
      
    } else {
      console.log('❌ API request failed:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugKeyStrengths().catch(console.error);