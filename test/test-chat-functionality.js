// Test script to check chat functionality
const fs = require('fs');

async function testChatFunctionality() {
    console.log('🧪 Testing Chat Functionality');
    console.log('=' .repeat(50));

    try {
        // First, get a job to test with
        const jobsResponse = await fetch('http://localhost:3002/api/jobs?public=true');
        if (!jobsResponse.ok) {
            throw new Error(`Jobs API failed: ${jobsResponse.status}`);
        }
        
        const jobsData = await jobsResponse.json();
        const jobs = jobsData.data || jobsData;
        const testJob = jobs[0];
        
        console.log(`📋 Using job: "${testJob.title}"`);
        
        // Simulate a chat request with proper context
        const chatRequest = {
            action: 'chat',
            question: 'hi',
            conversationHistory: [],
            analysisContext: {
                jobTitle: testJob.title,
                jobDescription: testJob.description,
                analysisResult: 'Sample analysis result for testing purposes'
            }
        };
        
        console.log('\n💬 Sending chat request...');
        console.log(`   - Question: "${chatRequest.question}"`);
        console.log(`   - Job Title: "${chatRequest.analysisContext.jobTitle}"`);
        console.log(`   - Has Job Description: ${!!chatRequest.analysisContext.jobDescription}`);
        
        const response = await fetch('http://localhost:3002/api/resume-rag-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatRequest)
        });
        
        console.log(`\n📊 Response Status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }
        
        const result = await response.json();
        console.log('✅ Chat response received');
        
        const chatResponse = result.data?.response || result.response;
        console.log('\n💭 Chat Response:');
        console.log('=' .repeat(40));
        console.log(chatResponse);
        
        // Check if the response mentions the job title or job-specific terms
        const jobTerms = [testJob.title.toLowerCase()];
        if (testJob.requirements) {
            jobTerms.push(...testJob.requirements.map(r => r.toLowerCase()));
        }
        
        const responseText = chatResponse.toLowerCase();
        const foundTerms = jobTerms.filter(term => responseText.includes(term));
        
        console.log('\n🔍 Analysis:');
        console.log(`   - Job-specific terms found: ${foundTerms.length}/${jobTerms.length}`);
        console.log(`   - Found terms: ${foundTerms.join(', ') || 'None'}`);
        
        if (foundTerms.length > 0) {
            console.log('✅ Chat is using job-specific context');
        } else {
            console.log('⚠️ Chat may not be using job-specific context');
        }
        
        // Save the result
        fs.writeFileSync('chat-test-result.json', JSON.stringify({
            request: chatRequest,
            response: result,
            analysis: {
                jobTermsFound: foundTerms,
                contextUsed: foundTerms.length > 0
            }
        }, null, 2));
        
        console.log('\n📄 Full test data saved to: chat-test-result.json');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

testChatFunctionality();
