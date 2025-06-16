// Test the resume analysis API directly
const fetch = require('node-fetch');

async function testResumeAnalysis() {
    console.log('🔍 Testing Resume Analysis API...\n');
    
    try {
        // Test data
        const testData = {
            action: 'analyze',
            jobTitle: 'Software Developer',
            jobDescription: 'We are looking for a skilled software developer with experience in JavaScript, React, and Node.js.',
            jobRequirements: ['JavaScript', 'React', 'Node.js'],
            resumeText: 'John Doe - Software Developer with 3 years experience in React, Node.js, and TypeScript. Worked on multiple web applications.'
        };
        
        console.log('📤 Sending request to:', 'http://localhost:3000/api/resume-rag-python');
        console.log('📊 Request data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch('http://localhost:3000/api/resume-rag-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📈 Response status:', response.status);
        console.log('📈 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const result = await response.text();
        console.log('📤 Raw response:', result);
        
        if (response.ok) {
            try {
                const jsonResult = JSON.parse(result);
                console.log('✅ Parsed JSON response:', JSON.stringify(jsonResult, null, 2));
            } catch (parseError) {
                console.log('❌ Failed to parse JSON:', parseError.message);
            }
        } else {
            console.log('❌ Request failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Also test the Python service directly
async function testPythonServiceDirect() {
    console.log('\n🐍 Testing Python service directly...\n');
    
    try {
        const testData = {
            job_title: 'Software Developer',
            job_description: 'We are looking for a skilled software developer with experience in JavaScript, React, and Node.js.',
            job_requirements: ['JavaScript', 'React', 'Node.js'],
            resume_text: 'John Doe - Software Developer with 3 years experience in React, Node.js, and TypeScript. Worked on multiple web applications.'
        };
        
        console.log('📤 Sending request to Python service:', 'http://localhost:8000/analyze');
        console.log('📊 Request data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📈 Python service response status:', response.status);
        
        const result = await response.text();
        console.log('📤 Python service raw response:', result);
        
        if (response.ok) {
            try {
                const jsonResult = JSON.parse(result);
                console.log('✅ Python service parsed response:', JSON.stringify(jsonResult, null, 2));
            } catch (parseError) {
                console.log('❌ Failed to parse Python service JSON:', parseError.message);
            }
        } else {
            console.log('❌ Python service failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Python service test failed:', error.message);
    }
}

async function runTests() {
    await testPythonServiceDirect();
    await testResumeAnalysis();
}

runTests();
