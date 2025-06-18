// Test script to verify improved skill matching (React vs React.js)
const axios = require('axios');

async function testSkillMatching() {
  console.log('🧪 Testing improved skill matching logic...\n');
  
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
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.success) {
      console.log('✅ Analysis completed successfully!\n');
      console.log('📊 ANALYSIS RESULT:');
      console.log('==================');
      console.log(response.data.data.comprehensiveAnalysis);
      
      // Check if React.js is properly matched with React requirement
      const analysis = response.data.data.comprehensiveAnalysis;
      if (analysis.includes('React.js') && analysis.includes('MATCHING SKILLS')) {
        const matchingSection = analysis.split('MATCHING SKILLS:')[1]?.split('MISSING SKILLS:')[0];
        if (matchingSection && matchingSection.includes('React')) {
          console.log('\n🎉 SUCCESS: React.js correctly identified as matching React requirement!');
        } else {
          console.log('\n❌ ISSUE: React.js not properly matched with React requirement');
        }
      }
    } else {
      console.log('❌ Analysis failed:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSkillMatching();
