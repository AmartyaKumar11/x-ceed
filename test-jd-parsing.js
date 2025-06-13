// Test script for job description parsing
// Run with: node test-jd-parsing.js

const testJobDescription = `
We are looking for a Senior Full Stack Developer to join our growing team at TechCorp Inc.

Requirements:
- 5+ years of experience in web development
- Strong proficiency in JavaScript, React, Node.js
- Experience with MongoDB, PostgreSQL
- Knowledge of AWS, Docker, Kubernetes
- Familiarity with Git, CI/CD pipelines
- Bachelor's degree in Computer Science or related field
- Experience with RESTful APIs and microservices architecture
- Strong problem-solving and communication skills
- Ability to work in a fast-paced startup environment

Responsibilities:
- Develop and maintain web applications using React and Node.js
- Design and implement RESTful APIs
- Collaborate with cross-functional teams
- Optimize application performance and scalability
- Participate in code reviews and mentoring junior developers
- Deploy applications to AWS infrastructure

We offer:
- Competitive salary $120k - $150k
- Remote work options
- Health insurance and 401k matching
- Professional development opportunities

This is a remote position with occasional travel to our San Francisco office.
`;

async function testParsing() {
    try {
        console.log('🧪 Testing Job Description Parsing API...\n');
        
        const response = await fetch('http://localhost:3002/api/parse-job-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobDescription: testJobDescription,
                jobTitle: 'Senior Full Stack Developer',
                companyName: 'TechCorp Inc',
                jobId: 'test-job-123'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Parsing successful!');
            console.log('\n📊 Parsed Results:');
            console.log(JSON.stringify(result.data, null, 2));
            
            console.log('\n🎯 Quick Summary:');
            console.log('- Technical Skills:', result.data.requiredSkills.technical.join(', '));
            console.log('- Frameworks:', result.data.requiredSkills.frameworks.join(', '));
            console.log('- Experience Level:', result.data.experience.level);
            console.log('- Years Required:', `${result.data.experience.minYears}-${result.data.experience.maxYears}`);
            console.log('- Work Type:', result.data.workType);
            console.log('- Difficulty:', result.data.difficulty);
            console.log('- Must Learn:', result.data.learningPath.mustLearn.join(', '));
            
        } else {
            console.error('❌ API Error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

// Run the test
testParsing();
