#!/usr/bin/env node

/**
 * Test AI Question Generation
 * This script tests whether the OpenRouter AI API is working correctly
 * or if we're just getting fallback questions.
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Test the OpenRouter API directly
async function testOpenRouterAPI() {
    console.log('🤖 Testing OpenRouter AI API directly...');
    
    const apiKey = process.env.OPENROUTER_API_KEY || 'your-api-key-here';
    
    if (!apiKey || apiKey === 'your-api-key-here') {
        console.log('❌ OpenRouter API key not found in environment variables');
        return;
    }
    
    const requestData = JSON.stringify({
        "model": "mistralai/mistral-7b-instruct",
        "messages": [
            {"role": "system", "content": "You are an expert interviewer."},
            {"role": "user", "content": "Generate a technical interview question for a Software Developer position requiring Python and JavaScript skills."}
        ],
        "max_tokens": 200,
        "temperature": 0.7
    });

    const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`📊 API Response Status: ${res.statusCode}`);
                    console.log(`📋 Raw Response:`, JSON.stringify(response, null, 2));
                    
                    if (response.choices && response.choices.length > 0) {
                        console.log(`✅ AI Generated Question: "${response.choices[0].message.content.strip || response.choices[0].message.content}"`);
                        resolve(true);
                    } else {
                        console.log(`❌ No 'choices' in response - API might be failing`);
                        resolve(false);
                    }
                } catch (error) {
                    console.log(`❌ JSON Parse Error:`, error.message);
                    console.log(`📋 Raw Data:`, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request Error:`, error.message);
            resolve(false);
        });

        req.write(requestData);
        req.end();
    });
}

// Test our backend service
async function testBackendService() {
    console.log('\n🖥️  Testing our Backend Service...');
    
    const requestData = JSON.stringify({
        "job_description": "Software Developer position requiring Python and JavaScript skills. Must have experience with REST APIs and database design.",
        "previous_questions": []
    });

    const options = {
        hostname: 'localhost',
        port: 8008,
        path: '/generate-question',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`📊 Backend Response Status: ${res.statusCode}`);
                    console.log(`📋 Backend Response:`, JSON.stringify(response, null, 2));
                    
                    if (response.question) {
                        const question = response.question;
                        console.log(`📝 Generated Question: "${question}"`);
                        
                        // Check if it's the fallback question
                        const fallbackQuestion = "Tell me about your experience relevant to this position and how you would approach the key responsibilities mentioned in the job description.";
                        
                        if (question === fallbackQuestion) {
                            console.log(`⚠️  This is a FALLBACK question - AI API likely failed`);
                            resolve(false);
                        } else {
                            console.log(`✅ This appears to be an AI-generated question!`);
                            resolve(true);
                        }
                    } else {
                        console.log(`❌ No question in response`);
                        resolve(false);
                    }
                } catch (error) {
                    console.log(`❌ JSON Parse Error:`, error.message);
                    console.log(`📋 Raw Data:`, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request Error:`, error.message);
            resolve(false);
        });

        req.write(requestData);
        req.end();
    });
}

// Main test function
async function runTests() {
    console.log('🚀 AI Question Generation Test');
    console.log('==================================================\n');

    try {
        // Test 1: Direct API call
        const apiWorking = await testOpenRouterAPI();
        
        // Test 2: Backend service
        const backendWorking = await testBackendService();
        
        console.log('\n📊 Test Results:');
        console.log('==============================');
        console.log(`🤖 OpenRouter API: ${apiWorking ? '✅ WORKING' : '❌ FAILING'}`);
        console.log(`🖥️  Backend Service: ${backendWorking ? '✅ AI-Generated' : '⚠️  Using Fallback'}`);
        
        if (apiWorking && backendWorking) {
            console.log('\n🎉 AI Question Generation is FULLY WORKING!');
        } else if (apiWorking && !backendWorking) {
            console.log('\n⚠️  API works but backend is using fallback - check backend logs');
        } else if (!apiWorking) {
            console.log('\n❌ OpenRouter API is not working - could be:');
            console.log('   • Invalid API key');
            console.log('   • Rate limiting');
            console.log('   • API service down');
            console.log('   • Network issues');
        }
        
    } catch (error) {
        console.log(`❌ Test failed with error:`, error.message);
    }
}

// Run the tests
runTests();
