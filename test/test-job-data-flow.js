// Simple test to verify job data is being sent correctly to Python service
const fs = require('fs');

async function testJobDataFlow() {
    console.log('🧪 Testing Job Data Flow to Python Service');
    console.log('=' .repeat(50));

    try {
        // Test 1: Check if Python service is running
        console.log('\n🐍 Testing Python service...');
        const pythonResponse = await fetch('http://localhost:8000/');
        
        if (!pythonResponse.ok) {
            throw new Error('Python service not available on port 8000');
        }
        
        const pythonHealth = await pythonResponse.json();
        console.log('✅ Python service running:', pythonHealth.service);
        console.log(`   - Groq configured: ${pythonHealth.groq_configured}`);
        
        // Test 2: Send a direct analysis request to backend API (simulating frontend)
        console.log('\n📋 Testing job data analysis...');
        
        const testJobData = {
            action: 'analyze',
            jobId: 'test-job-123',
            jobTitle: 'Senior React Developer',
            jobDescription: 'We are seeking a Senior React Developer with expertise in modern JavaScript frameworks. The ideal candidate will have 5+ years of experience with React, Node.js, TypeScript, and RESTful APIs. Experience with state management libraries like Redux and testing frameworks is preferred.',
            requirements: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Redux', 'RESTful APIs', 'Testing'],
            resumeText: `Sarah Johnson
Senior Frontend Developer
Email: sarah.johnson@email.com
Phone: (555) 987-6543

PROFESSIONAL SUMMARY:
Experienced Senior Frontend Developer with 6+ years specializing in React and modern JavaScript.
Expert in React, TypeScript, Redux, and building scalable web applications.
Strong background in UI/UX design and cross-functional team collaboration.

TECHNICAL SKILLS:
- Frontend: React, JavaScript, TypeScript, HTML5, CSS3, SASS
- State Management: Redux, Context API, Zustand
- Testing: Jest, React Testing Library, Cypress
- Build Tools: Webpack, Vite, Babel
- Backend: Node.js, Express.js, RESTful APIs
- Databases: MongoDB, PostgreSQL
- Tools: Git, Docker, AWS, Figma

PROFESSIONAL EXPERIENCE:
Senior Frontend Developer | TechCorp Inc | 2020-Present
- Lead development of React applications serving 100k+ users
- Implemented Redux for state management across complex applications
- Built responsive components using modern CSS and JavaScript
- Mentored junior developers and established coding best practices
- Collaborated with backend team to design and consume RESTful APIs

Frontend Developer | WebSolutions LLC | 2018-2020
- Developed interactive web applications using React and JavaScript
- Created reusable component libraries for consistent UI/UX
- Integrated third-party APIs and payment systems
- Optimized application performance and loading times

EDUCATION:
Bachelor of Science in Computer Science
State University | 2018

CERTIFICATIONS:
- React Developer Certification
- AWS Certified Cloud Practitioner`
        };
        
        console.log(`📤 Sending analysis request for: "${testJobData.jobTitle}"`);
        console.log(`   - Job Description Length: ${testJobData.jobDescription.length} chars`);
        console.log(`   - Requirements: ${testJobData.requirements.join(', ')}`);
        console.log(`   - Resume Length: ${testJobData.resumeText.length} chars`);
        
        const analysisResponse = await fetch('http://localhost:3002/api/resume-rag-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testJobData)
        });
        
        console.log(`\n📊 Response Status: ${analysisResponse.status}`);
        
        if (!analysisResponse.ok) {
            const errorText = await analysisResponse.text();
            console.error('❌ API Error Response:', errorText);
            return;
        }
        
        const result = await analysisResponse.json();
        console.log('✅ Analysis completed successfully!');
        
        // Analyze the result to check if job data was used
        console.log('\n🔍 Analyzing result for job-specific content...');
        
        const analysis = result.data?.analysis;
        if (analysis && analysis.structuredAnalysis) {
            const structured = analysis.structuredAnalysis;
            console.log('✅ Structured analysis found');
            
            console.log(`   - Overall Match Score: ${structured.overallMatch?.score || 'N/A'}%`);
            console.log(`   - Match Level: ${structured.overallMatch?.level || 'N/A'}`);
            console.log(`   - Matching Skills: ${structured.matchingSkills?.length || 0} found`);
            console.log(`   - Missing Skills: ${structured.missingSkills?.length || 0} found`);
            
            // Check if job-specific terms appear in analysis
            const analysisString = JSON.stringify(structured).toLowerCase();
            const jobTerms = ['react', 'typescript', 'redux', 'restful', 'node.js'];
            const foundTerms = jobTerms.filter(term => analysisString.includes(term));
            
            console.log(`   - Job-specific terms found: ${foundTerms.length}/${jobTerms.length}`);
            console.log(`   - Found terms: ${foundTerms.join(', ')}`);
            
            // Display some key analysis points
            if (structured.matchingSkills && structured.matchingSkills.length > 0) {
                console.log(`   - Top matching skills: ${structured.matchingSkills.slice(0, 3).join(', ')}`);
            }
            
            if (structured.missingSkills && structured.missingSkills.length > 0) {
                console.log(`   - Missing skills: ${structured.missingSkills.slice(0, 3).join(', ')}`);
            }
            
            if (foundTerms.length >= 3) {
                console.log('✅ Job data appears to be correctly used in analysis');
            } else {
                console.log('⚠️ Job data may not be fully utilized in analysis');
            }
            
        } else if (analysis && analysis.comprehensiveAnalysis) {
            console.log('✅ Comprehensive analysis found (text format)');
            const analysisText = analysis.comprehensiveAnalysis.toLowerCase();
            const jobTerms = ['react', 'typescript', 'redux', 'restful', 'node.js'];
            const foundTerms = jobTerms.filter(term => analysisText.includes(term));
            
            console.log(`   - Job-specific terms found: ${foundTerms.length}/${jobTerms.length}`);
            console.log(`   - Found terms: ${foundTerms.join(', ')}`);
        } else {
            console.log('❌ No analysis data found in response');
        }
        
        // Save result for inspection
        const outputFile = 'job-data-flow-test-result.json';
        fs.writeFileSync(outputFile, JSON.stringify({
            request: testJobData,
            response: result,
            timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`\n📄 Full result saved to: ${outputFile}`);
        console.log('\n🎉 Job data flow test completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

testJobDataFlow();
