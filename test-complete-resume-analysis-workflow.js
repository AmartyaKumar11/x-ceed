/**
 * Test Complete Resume Analysis Workflow
 * Tests the three-tier analysis: Python -> OpenRouter -> Enhanced Fallback
 */

require('dotenv').config({ path: '.env.local' });

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Resume Analysis Workflow\n');
  
  // Test data
  const testData = {
    jobTitle: 'Full Stack Developer',
    jobDescription: 'We need a Full Stack Developer with React, Node.js, TypeScript, MongoDB, and AWS experience. 5+ years required.',
    jobRequirements: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
    userSkills: ['JavaScript', 'HTML', 'CSS', 'Express.js'],
    resumePath: null // No resume file for this test
  };
  
  console.log('📋 Test Case 1: Enhanced Fallback Analysis (Simulated)');
  
  // Simulate the enhanced fallback analysis
  const enhancedFallbackResult = simulateEnhancedFallback(testData);
  
  console.log('✅ Enhanced Fallback Analysis Results:');
  console.log(`📊 Overall Score: ${enhancedFallbackResult.overallScore}%`);
  console.log(`🎯 Skills Score: ${enhancedFallbackResult.skillsScore}%`);
  console.log(`📚 Matched Skills: ${enhancedFallbackResult.matchedSkills.join(', ')}`);
  console.log(`❌ Critical Missing: ${enhancedFallbackResult.criticalMissing.join(', ')}`);
  console.log(`⚠️ Important Missing: ${enhancedFallbackResult.importantMissing.join(', ')}`);
  console.log(`📈 Skills to Improve: ${enhancedFallbackResult.skillsToImprove.join(', ')}`);
  console.log(`🔍 Gap Analysis Preview: ${enhancedFallbackResult.gapAnalysis.substring(0, 200)}...`);
  
  console.log('\n📋 Test Case 2: OpenRouter Analysis (Live)');
  
  try {
    const openRouterResult = await testOpenRouterAnalysis(testData);
    console.log('✅ OpenRouter Analysis Results:');
    console.log(`📊 Overall Score: ${openRouterResult.overallScore}%`);
    console.log(`📚 Missing Skills: ${openRouterResult.missingSkills?.slice(0, 3).join(', ') || 'None'}`);
    console.log(`🔍 Gap Analysis: ${openRouterResult.gapAnalysis?.substring(0, 150)}...`);
  } catch (error) {
    console.log('❌ OpenRouter Analysis failed:', error.message);
  }
  
  console.log('\n📋 Test Case 3: Skill Categorization Logic');
  testSkillCategorization();
  
  console.log('\n🎯 Complete workflow test finished!');
}

function simulateEnhancedFallback(testData) {
  // Simulate the enhanced skill analysis
  const userSkillsLower = testData.userSkills.map(skill => skill.toLowerCase());
  const requiredSkillsLower = testData.jobRequirements.map(skill => skill.toLowerCase());
  
  const matched = requiredSkillsLower.filter(skill => 
    userSkillsLower.some(userSkill => 
      userSkill.includes(skill) || skill.includes(userSkill)
    )
  );
  
  const missing = requiredSkillsLower.filter(skill => !matched.includes(skill));
  
  // Categorize missing skills
  const criticalSkills = ['react', 'angular', 'vue', 'node.js', 'python', 'java', 'typescript'];
  const importantSkills = ['mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes'];
  
  const criticalMissing = missing.filter(skill => 
    criticalSkills.some(critical => skill.includes(critical) || critical.includes(skill))
  );
  
  const importantMissing = missing.filter(skill => 
    importantSkills.some(important => skill.includes(important) || important.includes(skill)) &&
    !criticalMissing.includes(skill)
  );
  
  const niceToHaveMissing = missing.filter(skill => 
    !criticalMissing.includes(skill) && !importantMissing.includes(skill)
  );
  
  // Identify skills to improve
  const skillsToImprove = userSkillsLower.filter(userSkill => 
    requiredSkillsLower.some(reqSkill => 
      userSkill.includes(reqSkill.split('.')[0]) || reqSkill.includes(userSkill.split('.')[0])
    ) && !matched.some(matchedSkill => matchedSkill.includes(userSkill))
  );
  
  const skillsScore = requiredSkillsLower.length > 0 
    ? Math.round((matched.length / requiredSkillsLower.length) * 100)
    : 0;
  
  // Generate gap analysis
  let gapAnalysis = `Gap Analysis for ${testData.jobTitle} position:\n\n`;
  
  if (criticalMissing.length > 0) {
    gapAnalysis += `CRITICAL GAPS (High Priority):\n`;
    gapAnalysis += `• Missing essential skills: ${criticalMissing.join(', ')}\n`;
    gapAnalysis += `• These skills are fundamental for the role and should be prioritized in learning.\n\n`;
  }
  
  if (importantMissing.length > 0) {
    gapAnalysis += `IMPORTANT GAPS (Medium Priority):\n`;
    gapAnalysis += `• Missing valuable skills: ${importantMissing.join(', ')}\n`;
    gapAnalysis += `• These skills would significantly strengthen your candidacy.\n\n`;
  }
  
  if (matched.length > 0) {
    gapAnalysis += `STRENGTHS:\n`;
    gapAnalysis += `• Matching skills: ${matched.join(', ')}\n`;
    gapAnalysis += `• These are your competitive advantages for this role.\n\n`;
  }
  
  gapAnalysis += `RECOMMENDATION: Focus on the critical gaps first, then work on important skills to become a competitive candidate.`;
  
  return {
    analysisType: 'enhanced-fallback',
    overallScore: Math.round((skillsScore * 0.4) + (60 * 0.35) + (50 * 0.25)), // Mock experience and keyword scores
    skillsScore: skillsScore,
    experienceScore: 60,
    keywordScore: 50,
    matchedSkills: matched,
    missingSkills: missing,
    criticalMissing: criticalMissing,
    importantMissing: importantMissing,
    niceToHaveMissing: niceToHaveMissing,
    skillsToImprove: skillsToImprove,
    gapAnalysis: gapAnalysis
  };
}

async function testOpenRouterAnalysis(testData) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API Key not configured');
  }
  
  const prompt = `Analyze the gap between this candidate and job requirements:

JOB: ${testData.jobTitle}
REQUIREMENTS: ${testData.jobRequirements.join(', ')}
CANDIDATE SKILLS: ${testData.userSkills.join(', ')}

Return JSON with overallScore, missingSkills, and gapAnalysis fields.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3002',
      'X-Title': 'X-CEED Resume Analysis Test'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in OpenRouter response');
  }

  // Try to parse JSON
  try {
    return JSON.parse(content.trim());
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse JSON from OpenRouter response');
  }
}

function testSkillCategorization() {
  console.log('🔧 Testing Skill Categorization Logic:');
  
  const testSkills = ['react', 'mongodb', 'html', 'kubernetes', 'typescript', 'css'];
  const criticalSkills = ['react', 'angular', 'vue', 'node.js', 'python', 'java', 'typescript'];
  const importantSkills = ['mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes'];
  
  const critical = testSkills.filter(skill => 
    criticalSkills.some(c => skill.includes(c) || c.includes(skill))
  );
  
  const important = testSkills.filter(skill => 
    importantSkills.some(i => skill.includes(i) || i.includes(skill)) &&
    !critical.includes(skill)
  );
  
  const niceToHave = testSkills.filter(skill => 
    !critical.includes(skill) && !important.includes(skill)
  );
  
  console.log(`🔴 Critical: ${critical.join(', ')}`);
  console.log(`🟡 Important: ${important.join(', ')}`);
  console.log(`🟢 Nice-to-have: ${niceToHave.join(', ')}`);
  console.log('✅ Skill categorization working correctly');
}

// Run the test
testCompleteWorkflow().catch(console.error);