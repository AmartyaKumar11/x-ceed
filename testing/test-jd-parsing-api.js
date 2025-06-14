// Comprehensive test for the job description parsing API
// This tests the complete flow: input -> Gemini API -> parsed output

const testJobDescriptionAPI = async () => {
  try {
    console.log('🚀 Testing Job Description Parsing API...\n');

    // Test case 1: Text-based job description
    const testJob1 = {
      jobDescription: `
Senior React Developer - Remote

We're looking for a talented Senior React Developer to join our team! 

Key Requirements:
- 4+ years of experience with React.js and JavaScript
- Strong knowledge of Redux, Context API, and state management
- Experience with TypeScript and modern ES6+ features
- Proficiency in Node.js and Express.js for backend development
- Understanding of PostgreSQL database design
- Experience with AWS services (S3, EC2, Lambda)
- Docker and containerization experience
- Excellent problem-solving and communication skills

Responsibilities:
- Build responsive web applications using React
- Develop RESTful APIs with Node.js
- Collaborate with designers and product managers
- Write clean, testable code
- Optimize applications for performance

This is a full-time remote position with competitive salary and great benefits.
      `,
      jobTitle: 'Senior React Developer',
      companyName: 'TechStartup Inc',
      jobId: 'test-job-1'
    };

    // Test case 2: Job with recruiter-uploaded PDF (simulated)
    const testJob2 = {
      jobDescription: 'Brief description...',
      jobTitle: 'Full Stack Engineer',
      companyName: 'Enterprise Corp',
      jobId: 'test-job-2',
      jobDescriptionFile: '/uploads/job-descriptions/job-2-detailed.pdf'
    };

    console.log('📋 Test Case 1: Text-based Job Description');
    console.log('======================================================');
    
    const response1 = await fetch('http://localhost:3002/api/parse-job-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testJob1)
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ API Response Status:', response1.status);
      console.log('📊 Success:', result1.success);
      
      if (result1.success) {
        const data = result1.data;
        console.log('🤖 Parsing Source:', data.source || 'rule-based');
        console.log('🎯 Confidence Score:', data.confidence);
        
        console.log('\n🚨 CRITICAL SKILLS:');
        if (data.requiredSkills?.critical) {
          data.requiredSkills.critical.forEach((skill, index) => {
            console.log(`   ${index + 1}. ${skill}`);
          });
        }

        console.log('\n💻 TECHNICAL SKILLS:');
        if (data.requiredSkills?.technical) {
          data.requiredSkills.technical.forEach((skill, index) => {
            console.log(`   ${index + 1}. ${skill}`);
          });
        }

        console.log('\n📚 LEARNING PATH:');
        if (data.learningPath?.mustLearn) {
          console.log('   Must Learn:');
          data.learningPath.mustLearn.forEach((skill, index) => {
            console.log(`     ${index + 1}. ${skill}`);
          });
        }
        if (data.learningPath?.highPriority) {
          console.log('   High Priority:');
          data.learningPath.highPriority.forEach((skill, index) => {
            console.log(`     ${index + 1}. ${skill}`);
          });
        }

        console.log('\n📈 EXPERIENCE REQUIREMENTS:');
        console.log(`   Level: ${data.experience?.level}`);
        console.log(`   Years: ${data.experience?.minYears}-${data.experience?.maxYears}`);

        console.log('\n🏢 JOB INSIGHTS:');
        console.log(`   Company Type: ${data.jobInsights?.companyType}`);
        console.log(`   Work Type: ${data.jobInsights?.workType}`);
        console.log(`   Tech Stack: ${data.jobInsights?.techStack?.join(', ')}`);

        if (data.learningPath?.estimatedTimeWeeks) {
          console.log(`\n⏱️  ESTIMATED LEARNING TIME: ${data.learningPath.estimatedTimeWeeks} weeks`);
        }
      }
    } else {
      console.error('❌ API Error:', response1.status, response1.statusText);
      const errorText = await response1.text();
      console.error('Error details:', errorText);
    }

    console.log('\n\n📋 Test Case 2: PDF-based Job Description');
    console.log('======================================================');
    console.log('⚠️  This test requires a PDF file to exist in the uploads folder');
    console.log('    Skipping PDF test for now, but the API supports it');

    // You can uncomment this to test PDF parsing if you have a test PDF file
    /*
    const response2 = await fetch('http://localhost:3002/api/parse-job-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testJob2)
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('PDF parsing result:', result2);
    }
    */

    console.log('\n✅ Job Description Parsing API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test if the development server is running
console.log('🔍 Make sure your Next.js development server is running on http://localhost:3002');
console.log('   Run: npm run dev\n');

testJobDescriptionAPI();
