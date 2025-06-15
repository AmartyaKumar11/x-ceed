const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test data
const testData = {
  action: 'analyze',
  jobId: '676e1e8bb48f05bf3c123456',
  jobDescription: 'We are looking for a skilled Frontend Developer with expertise in React, Next.js, and modern JavaScript. The ideal candidate should have experience with UI/UX design principles and be comfortable working in an agile environment.',
  jobTitle: 'Frontend Developer',
  jobRequirements: ['React', 'Next.js', 'JavaScript', 'HTML/CSS', 'Git'],
  resumeText: 'John Doe\nSoftware Engineer\n\nExperience:\n- 3 years of React development\n- Built multiple Next.js applications\n- Strong JavaScript skills\n- Experience with HTML, CSS, and responsive design\n\nEducation:\n- Bachelor of Computer Science\n\nSkills:\n- React, Next.js, JavaScript, TypeScript\n- HTML5, CSS3, Sass\n- Git, GitHub, Agile development'
};

async function testRAGAPI() {
  console.log('🧪 Testing RAG API...');
  
  try {
    // First, let's get a valid auth token
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: 'amartya3@gmail.com',
        password: 'password'
      })
    });

    const loginData = await loginResponse.json();
    console.log('🔐 Login response:', loginData);

    if (!loginData.success || !loginData.token) {
      console.error('❌ Failed to get auth token');
      return;
    }

    const token = loginData.token;

    // Test the RAG API
    console.log('🤖 Testing RAG analysis...');
    const ragResponse = await fetch('http://localhost:3002/api/resume-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 RAG API Status:', ragResponse.status);
    
    const ragData = await ragResponse.json();
    console.log('📋 RAG Response:', JSON.stringify(ragData, null, 2));

    if (!ragResponse.ok) {
      console.error('❌ RAG API failed:', ragData);
    } else {
      console.log('✅ RAG API succeeded!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRAGAPI();
