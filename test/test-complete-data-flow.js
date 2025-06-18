// Test script to verify complete data flow from frontend to Python service
const fs = require('fs');
const path = require('path');

async function testCompleteDataFlow() {
    console.log('🧪 Testing Complete Data Flow: Frontend → Backend → Python Service');
    console.log('=' .repeat(80));

    try {
        // Step 1: Test job data fetch from MongoDB
        console.log('\n📋 Step 1: Testing job data fetch from MongoDB...');
        
        const jobsResponse = await fetch('http://localhost:3002/api/jobs');
        if (!jobsResponse.ok) {
            throw new Error(`Jobs API failed: ${jobsResponse.status}`);
        }
        
        const jobs = await jobsResponse.json();
        console.log(`✅ Found ${jobs.length} jobs in database`);
        
        if (jobs.length === 0) {
            console.log('⚠️ No jobs found in database. Creating test job...');
            
            // Create a test job for debugging
            const testJob = {
                title: "Test Full Stack Developer",
                description: "We are looking for a skilled Full Stack Developer with experience in React, Node.js, and MongoDB. The ideal candidate will have strong problem-solving skills and experience with modern web development practices.",
                requirements: ["React", "Node.js", "MongoDB", "JavaScript", "HTML", "CSS"],
                company: "Test Company",
                location: "Remote",
                salary: "$80,000 - $100,000",
                type: "Full-time",
                status: "active",
                createdBy: "test-recruiter",
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            };
            
            const createJobResponse = await fetch('http://localhost:3002/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token' // This might be needed
                },
                body: JSON.stringify(testJob)
            });
            
            if (createJobResponse.ok) {
                const createdJob = await createJobResponse.json();
                console.log(`✅ Created test job with ID: ${createdJob._id}`);
                jobs.push(createdJob);
            } else {
                console.log('❌ Failed to create test job');
            }
        }
        
        const testJob = jobs[0];
        console.log(`📋 Using job for testing: "${testJob.title}"`);
        console.log(`   - Description length: ${testJob.description?.length || 0} characters`);
        console.log(`   - Requirements: ${testJob.requirements?.length || 0} items`);
        
        // Step 2: Test Python service availability
        console.log('\n🐍 Step 2: Testing Python service availability...');
        
        const pythonHealthResponse = await fetch('http://localhost:8000/');
        if (!pythonHealthResponse.ok) {
            throw new Error('Python service not available');
        }
        
        const pythonHealth = await pythonHealthResponse.json();
        console.log('✅ Python service is running:', pythonHealth.service);
        console.log(`   - Groq configured: ${pythonHealth.groq_configured}`);
        
        // Step 3: Test complete data flow through backend API
        console.log('\n🔄 Step 3: Testing complete data flow through backend API...');
        
        const requestBody = {
            action: 'analyze',
            jobId: testJob._id,
            jobTitle: testJob.title,
            jobDescription: testJob.description,
            requirements: testJob.requirements || [],
            resumeText: `John Doe
Senior Full Stack Developer
Email: john.doe@email.com
Phone: (555) 123-4567

PROFESSIONAL SUMMARY:
Experienced Full Stack Developer with 5+ years of expertise in modern web technologies.
Proficient in React, Node.js, JavaScript, HTML, CSS, and MongoDB.
Strong problem-solving skills and experience with agile development methodologies.

TECHNICAL SKILLS:
- Frontend: React, JavaScript, HTML5, CSS3, TypeScript
- Backend: Node.js, Express.js, RESTful APIs
- Databases: MongoDB, PostgreSQL, MySQL
- Tools: Git, Docker, AWS, Visual Studio Code

PROFESSIONAL EXPERIENCE:
Senior Full Stack Developer | Tech Corp | 2021-Present
- Developed and maintained web applications using React and Node.js
- Designed and implemented RESTful APIs and database schemas
- Collaborated with cross-functional teams using agile methodologies
- Mentored junior developers and conducted code reviews

Full Stack Developer | StartupXYZ | 2019-2021
- Built responsive web applications from scratch
- Implemented user authentication and authorization systems
- Optimized application performance and database queries
- Participated in requirements gathering and technical planning

EDUCATION:
Bachelor of Science in Computer Science
University of Technology | 2019

CERTIFICATIONS:
- AWS Certified Developer Associate
- MongoDB Certified Developer`
        };
        
        console.log('📤 Sending analysis request with data:');
        console.log(`   - Job Title: "${requestBody.jobTitle}"`);
        console.log(`   - Job Description: ${requestBody.jobDescription.substring(0, 100)}...`);
        console.log(`   - Requirements: ${requestBody.requirements.join(', ')}`);
        console.log(`   - Resume Text: ${requestBody.resumeText.substring(0, 100)}...`);
        
        const analysisResponse = await fetch('http://localhost:3002/api/resume-rag-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log(`📊 Analysis response status: ${analysisResponse.status}`);
        
        if (!analysisResponse.ok) {
            const errorData = await analysisResponse.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Analysis failed: ${analysisResponse.status} - ${errorData.message}`);
        }
        
        const analysisResult = await analysisResponse.json();
        console.log('✅ Analysis completed successfully!');
        
        // Step 4: Verify the analysis result contains job data
        console.log('\n🔍 Step 4: Verifying analysis result contains job data...');
        
        const analysis = analysisResult.data?.analysis;
        if (analysis) {
            console.log('✅ Analysis data received');
            
            if (analysis.structuredAnalysis) {
                console.log('✅ Structured analysis available');
                const structured = analysis.structuredAnalysis;
                
                console.log(`   - Overall Match Score: ${structured.overallMatch?.score || 'N/A'}`);
                console.log(`   - Match Level: ${structured.overallMatch?.level || 'N/A'}`);
                console.log(`   - Matching Skills: ${structured.matchingSkills?.length || 0} found`);
                console.log(`   - Missing Skills: ${structured.missingSkills?.length || 0} found`);
                console.log(`   - Key Strengths: ${structured.keyStrengths?.length || 0} identified`);
                
                // Check if job data was used in analysis
                const analysisText = JSON.stringify(structured).toLowerCase();
                const jobMatches = [
                    testJob.title.toLowerCase(),
                    ...testJob.requirements.map(req => req.toLowerCase())
                ];
                
                const matchedTerms = jobMatches.filter(term => analysisText.includes(term));
                console.log(`   - Job-specific terms found in analysis: ${matchedTerms.length}/${jobMatches.length}`);
                console.log(`   - Matched terms: ${matchedTerms.join(', ')}`);
                
                if (matchedTerms.length > 0) {
                    console.log('✅ Analysis correctly used job-specific data');
                } else {
                    console.log('⚠️ Analysis may not have used job-specific data');
                }
                
            } else {
                console.log('⚠️ No structured analysis found');
            }
        } else {
            console.log('❌ No analysis data in response');
        }
        
        // Save the full result for inspection
        const outputPath = path.join(process.cwd(), 'data-flow-test-result.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            testJob,
            requestBody,
            analysisResult
        }, null, 2));
        
        console.log(`\n📄 Full test result saved to: ${outputPath}`);
        console.log('\n🎉 Data flow test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Data flow test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    testCompleteDataFlow();
}

module.exports = { testCompleteDataFlow };
