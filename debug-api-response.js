// Test script to verify structured analysis with separate cards
const axios = require('axios');

async function testStructuredAnalysis() {
  console.log('🧪 Testing structured analysis with React.js/React matching...\n');
  
  const testData = {
    resume_text: `
John Doe - Frontend Developer
Email: john@example.com

SKILLS:
- React.js (3 years experience)
- JavaScript/ES6+
- HTML5 & CSS3
- Node.js
- TypeScript
- MongoDB

EXPERIENCE:
Frontend Developer at TechCorp (2021-2024)
- Built responsive web applications using React.js
- Implemented state management with Redux
- Developed REST APIs with Node.js and Express
- Used TypeScript for type-safe development
    `,
    job_description: `
We are looking for a Frontend Developer to join our team.

REQUIREMENTS:
- 2+ years experience with React
- Strong JavaScript skills
- Experience with Node.js
- TypeScript knowledge preferred
- Database experience (MongoDB or PostgreSQL)
- HTML/CSS proficiency
    `,
    job_title: "Frontend Developer",
    job_requirements: [
      "React",
      "JavaScript", 
      "Node.js",
      "TypeScript",
      "HTML/CSS"
    ]
  };

  try {
    console.log('📤 Sending analysis request...');
    const response = await axios.post('http://localhost:8000/analyze', testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    });

    console.log('✅ Full API Response Structure:');
    console.log('=================================');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data?.analysis?.structuredAnalysis) {
      const structured = response.data.data.analysis.structuredAnalysis;
      
      console.log('\n🎯 STRUCTURED ANALYSIS SUMMARY:');
      console.log('==============================');
      console.log(`📊 Overall Match: ${structured.overallMatch?.score}% - ${structured.overallMatch?.level}`);
      console.log(`📝 Summary: ${structured.overallMatch?.summary}`);
      
      console.log('\n✅ Key Strengths:');
      structured.keyStrengths?.forEach((strength, i) => console.log(`  ${i+1}. ${strength}`));
      
      console.log('\n🎯 Matching Skills:');
      structured.matchingSkills?.forEach(skill => console.log(`  ✓ ${skill}`));
      
      console.log('\n❌ Missing Skills:');
      if (structured.missingSkills?.length > 0) {
        structured.missingSkills.forEach(skill => console.log(`  ✗ ${skill}`));
      } else {
        console.log('  🎉 No missing skills!');
      }
      
      // Check if React.js is properly matched with React requirement
      if (structured.matchingSkills?.some(skill => skill.toLowerCase().includes('react'))) {
        console.log('\n🎉 SUCCESS: React.js correctly identified as matching React requirement!');
      } else {
        console.log('\n❌ ISSUE: React.js not properly matched with React requirement');
      }
    } else {
      console.log('\n⚠️ Structured analysis not available, checking fallback...');
      if (response.data.data?.analysis?.comprehensiveAnalysis) {
        console.log('📄 Fallback to comprehensive text analysis available');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testStructuredAnalysis();
