// Test recruiter login and token validation
const fetch = require('node-fetch');

async function testRecruiterLogin() {
    try {
        console.log('=== TESTING RECRUITER LOGIN ===\n');
          // Test login with a known recruiter
        const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test.recruiter@example.com',
                password: 'testpass123'
            })
        });
        
        console.log('Login response status:', loginResponse.status);
        
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log('Login failed:', errorText);
            return;
        }
        
        const loginResult = await loginResponse.json();
        console.log('✅ Login successful!');
        console.log('Token received:', loginResult.token);
        
        // Now test the job creation API with this token
        console.log('\n=== TESTING JOB CREATION API ===');
          const jobData = {
            title: 'Test Job Position',
            department: 'Engineering',
            level: 'mid',
            description: 'This is a test job description',
            jobDescriptionType: 'text',
            jobDescriptionText: 'Detailed job description text',
            workMode: 'remote',
            location: 'Remote',
            jobType: 'full-time',
            duration: 'permanent',
            salaryMin: '50000',
            salaryMax: '80000',
            currency: 'USD',
            benefits: 'Health insurance, dental, vision',
            numberOfOpenings: '2',
            applicationStart: new Date().toISOString(),
            applicationEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            priority: 'medium',
            status: 'active'
        };
        
        const jobResponse = await fetch('http://localhost:3002/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginResult.token}`
            },
            body: JSON.stringify(jobData)
        });
        
        console.log('Job creation response status:', jobResponse.status);
        
        if (!jobResponse.ok) {
            const errorText = await jobResponse.text();
            console.log('❌ Job creation failed:', errorText);
            return;
        }
        
        const jobResult = await jobResponse.json();
        console.log('✅ Job creation successful!');
        console.log('Job created:', jobResult);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testRecruiterLogin();
