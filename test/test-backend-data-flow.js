// Quick test to check what data flows through the backend API
const fs = require('fs');

async function testBackendDataFlow() {
    console.log('🧪 Testing Backend Data Flow');
    console.log('=' .repeat(50));

    try {
        // Get a specific job from the database
        const jobsResponse = await fetch('http://localhost:3002/api/jobs?public=true');
        if (!jobsResponse.ok) {
            throw new Error(`Jobs API failed: ${jobsResponse.status}`);
        }
        
        const jobsData = await jobsResponse.json();
        const jobs = jobsData.data || jobsData;
        
        if (!jobs || jobs.length === 0) {
            throw new Error('No jobs found');
        }
        
        const testJob = jobs[0]; // Use first available job
        console.log(`📋 Selected job: "${testJob.title}"`);
        console.log(`   - Company: ${testJob.company || 'N/A'}`);
        console.log(`   - Description: ${testJob.description ? testJob.description.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`   - Requirements: ${testJob.requirements ? testJob.requirements.join(', ') : 'N/A'}`);
        
        // Test the backend API with this job
        const analysisRequest = {
            action: 'analyze',
            jobId: testJob._id,
            jobTitle: testJob.title,
            jobDescription: testJob.description,
            requirements: testJob.requirements || [],
            resumeText: `Sarah Johnson
Senior Software Developer
Email: sarah.johnson@example.com
Phone: (555) 123-4567

PROFESSIONAL SUMMARY:
Experienced software developer with 6+ years in full-stack development.
Proficient in JavaScript, React, Node.js, and modern web technologies.
Strong problem-solving skills and experience with agile methodologies.

TECHNICAL SKILLS:
- Frontend: React, JavaScript, TypeScript, HTML5, CSS3
- Backend: Node.js, Express.js, Python, RESTful APIs
- Databases: MongoDB, PostgreSQL, MySQL
- Tools: Git, Docker, AWS, Jenkins
- Testing: Jest, Mocha, Cypress

PROFESSIONAL EXPERIENCE:
Senior Software Developer | Tech Solutions Inc | 2021-Present
- Lead development of scalable web applications using React and Node.js
- Architect and implement microservices architecture
- Mentor junior developers and conduct code reviews
- Collaborate with product managers and designers on feature development

Software Developer | Digital Innovations LLC | 2018-2021
- Developed responsive web applications using modern JavaScript frameworks
- Implemented RESTful APIs and integrated third-party services
- Optimized application performance and database queries
- Participated in agile development processes and sprint planning

EDUCATION:
Bachelor of Science in Computer Science
University of Technology | 2018

CERTIFICATIONS:
- AWS Certified Developer Associate
- Certified Scrum Master`
        };
        
        console.log('\n📤 Sending analysis request to backend...');
        console.log(`   Request size: ${JSON.stringify(analysisRequest).length} bytes`);
        
        const response = await fetch('http://localhost:3002/api/resume-rag-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(analysisRequest)
        });
        
        console.log(`\n📊 Backend Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend Error:', errorText);
            return;
        }
        
        const result = await response.json();
        console.log('✅ Analysis completed successfully!');
        
        // Check if the result contains job-specific information
        const analysisData = result.data?.analysis;
        if (analysisData?.structuredAnalysis) {
            const structured = analysisData.structuredAnalysis;
            console.log('\n🔍 Analysis Results:');
            console.log(`   - Overall Score: ${structured.overallMatch?.score || 'N/A'}%`);
            console.log(`   - Match Level: ${structured.overallMatch?.level || 'N/A'}`);
            console.log(`   - Matching Skills: ${structured.matchingSkills?.join(', ') || 'None'}`);
            console.log(`   - Missing Skills: ${structured.missingSkills?.join(', ') || 'None'}`);
            
            // Check if job-specific terms appear in the analysis
            const analysisText = JSON.stringify(structured).toLowerCase();
            const jobTerms = [
                testJob.title.toLowerCase(),
                ...(testJob.requirements || []).map(req => req.toLowerCase()),
                ...(testJob.description ? testJob.description.toLowerCase().split(' ').filter(word => word.length > 4).slice(0, 10) : [])
            ];
            
            const foundTerms = jobTerms.filter(term => analysisText.includes(term));
            console.log(`\n🎯 Job-specific terms in analysis: ${foundTerms.length}/${jobTerms.length}`);
            console.log(`   - Found: ${foundTerms.slice(0, 5).join(', ')}${foundTerms.length > 5 ? '...' : ''}`);
            
            if (foundTerms.length > 2) {
                console.log('✅ Analysis appears to use job-specific data correctly');
            } else {
                console.log('⚠️ Analysis may not be using job-specific data properly');
            }
        }
        
        // Save the full result for inspection
        fs.writeFileSync('backend-data-flow-test.json', JSON.stringify({
            selectedJob: testJob,
            request: analysisRequest,
            response: result
        }, null, 2));
        
        console.log('\n📄 Full test data saved to: backend-data-flow-test.json');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

testBackendDataFlow();
