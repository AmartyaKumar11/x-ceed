/**
 * Debug Skill Matching Logic
 * Test the skill extraction and matching logic
 */

function debugSkillMatching() {
  console.log('🔍 Debugging Skill Matching Logic\n');
  
  // Test data
  const resumeText = `
    Built RESTful APIs using Node.js and Express.js
    Implemented database operations with MongoDB and Mongoose
    Deployed applications on AWS using Docker containers
  `;
  
  const jobRequirements = ['Node.js', 'Express.js', 'MongoDB', 'Docker', 'AWS'];
  
  console.log('📋 Input Data:');
  console.log('Job Requirements:', jobRequirements);
  console.log('Resume Text:', resumeText.trim());
  
  // Simulate skill extraction
  const skillDatabase = [
    { skill: 'Node.js', variations: ['node', 'nodejs', 'node.js'] },
    { skill: 'Express.js', variations: ['express', 'expressjs', 'express.js'] },
    { skill: 'MongoDB', variations: ['mongodb', 'mongo'] },
    { skill: 'Docker', variations: ['docker', 'containerization'] },
    { skill: 'AWS', variations: ['aws', 'amazon web services'] }
  ];
  
  const resumeTextLower = resumeText.toLowerCase();
  const extractedSkills = [];
  
  skillDatabase.forEach(({ skill, variations }) => {
    const found = variations.some(variation => {
      const patterns = [
        new RegExp(`\\b${variation}\\b`, 'i'),
        new RegExp(`using.*${variation}`, 'i'),
        new RegExp(`with.*${variation}`, 'i')
      ];
      
      return patterns.some(pattern => pattern.test(resumeTextLower));
    });
    
    if (found) {
      extractedSkills.push(skill);
    }
  });
  
  console.log('\n🔍 Extracted Skills:', extractedSkills);
  
  // Test matching logic
  const matchedSkills = [];
  const missingSkills = [];
  
  jobRequirements.forEach(jobReq => {
    const jobReqLower = jobReq.toLowerCase();
    
    const foundInExtracted = extractedSkills.some(extracted => {
      const extractedLower = extracted.toLowerCase();
      return (
        extractedLower.includes(jobReqLower) ||
        jobReqLower.includes(extractedLower) ||
        (jobReqLower.includes('node') && extractedLower.includes('node')) ||
        (jobReqLower.includes('express') && extractedLower.includes('express')) ||
        (jobReqLower.includes('mongo') && extractedLower.includes('mongo')) ||
        (jobReqLower.includes('docker') && extractedLower.includes('docker')) ||
        (jobReqLower.includes('aws') && extractedLower.includes('aws'))
      );
    });
    
    console.log(`\n🔍 Checking "${jobReq}":`);
    console.log(`   Job requirement (lower): "${jobReqLower}"`);
    console.log(`   Found in extracted: ${foundInExtracted}`);
    
    if (foundInExtracted) {
      matchedSkills.push(jobReq);
      console.log(`   ✅ MATCHED`);
    } else {
      missingSkills.push(jobReq);
      console.log(`   ❌ MISSING`);
    }
  });
  
  console.log('\n📊 FINAL RESULTS:');
  console.log('✅ Matched Skills:', matchedSkills);
  console.log('❌ Missing Skills:', missingSkills);
  console.log('📈 Match Score:', Math.round((matchedSkills.length / jobRequirements.length) * 100) + '%');
  
  if (matchedSkills.length === jobRequirements.length) {
    console.log('🎉 PERFECT: All skills should be matched!');
  } else {
    console.log('⚠️ ISSUE: Some skills are not being matched properly');
  }
}

// Run the debug
debugSkillMatching();