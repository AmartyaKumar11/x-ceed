// Test the Next.js API route directly
async function testNextjsAPI() {
    try {
        console.log('🧪 Testing Next.js API route directly...');
        
        const testData = {
            action: 'analyze',
            jobTitle: 'Software Developer',
            jobDescription: 'We are looking for a skilled software developer.',
            requirements: ['JavaScript', 'React'],
            resumePath: '/test/resume.pdf',
            resumeText: 'John Doe - Software Developer with 5 years experience'
        };
        
        console.log('📤 Sending data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch('/api/resume-rag-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        const result = await response.json();
        console.log('📥 Response data:', JSON.stringify(result, null, 2));
        
        if (response.ok && result.success) {
            console.log('✅ API test successful!');
            return true;
        } else {
            console.log('❌ API test failed:', result.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ API test error:', error);
        return false;
    }
}

// Run the test
testNextjsAPI();
