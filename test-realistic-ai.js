// Test script with more realistic data to debug the frontend issue
const fetch = require('node-fetch');

async function testRealisticAIAPI() {
  console.log('🧪 Testing AI API with realistic data...');
  
  // More realistic test data that mimics what the frontend might send
  const testData = {
    jobId: '507f1f77bcf86cd799439011',
    jobTitle: 'Full Stack Developer',
    jobDescription: 'We are looking for an experienced full stack developer to join our team. You will be responsible for developing and maintaining web applications using modern technologies.',
    jobRequirements: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Express.js'],
    candidates: [
      {
        id: '507f1f77bcf86cd799439012',
        name: 'Alice Johnson',
        email: 'alice.johnson@email.com',
        skills: ['React', 'JavaScript', 'CSS', 'HTML'],
        resumeText: 'Experienced frontend developer with 4 years of experience in React development. Built multiple e-commerce applications and worked with modern JavaScript frameworks.',
        appliedAt: '2025-08-10T10:30:00.000Z',
        resumePath: '/uploads/resumes/alice-resume.pdf'
      },
      {
        id: '507f1f77bcf86cd799439013',
        name: 'Bob Smith',
        email: 'bob.smith@email.com',
        skills: ['Node.js', 'Express.js', 'MongoDB', 'JavaScript'],
        resumeText: 'Backend developer with 5 years of experience in Node.js and database management. Expertise in building scalable APIs and working with NoSQL databases.',
        appliedAt: '2025-08-11T14:20:00.000Z',
        resumePath: '/uploads/resumes/bob-resume.pdf'
      },
      {
        id: '507f1f77bcf86cd799439014',
        name: 'Carol Davis',
        email: 'carol.davis@email.com',
        skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Express.js', 'TypeScript'],
        resumeText: 'Full stack developer with 6 years of experience. Led multiple projects from conception to deployment. Expert in React, Node.js, and modern development practices.',
        appliedAt: '2025-08-12T09:15:00.000Z',
        resumePath: '/uploads/resumes/carol-resume.pdf'
      }
    ]
  };

  try {
    console.log('📤 Sending realistic request to API...');
    console.log('📋 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3002/api/ai/shortlist-candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token-for-testing'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📥 Success! Response summary:', {
      success: data.success,
      totalCandidates: data.data?.totalCandidates,
      analyzedCandidates: data.data?.analyzedCandidates,
      topCandidatesCount: data.data?.topCandidates?.length,
      firstCandidateScore: data.data?.topCandidates?.[0]?.score,
      firstCandidateRecommendation: data.data?.topCandidates?.[0]?.recommendation
    });

    // Show detailed analysis for first candidate
    if (data.data?.topCandidates?.[0]) {
      const topCandidate = data.data.topCandidates[0];
      console.log('🏆 Top candidate analysis:', {
        name: topCandidate.name,
        score: topCandidate.score,
        recommendation: topCandidate.recommendation,
        strengths: topCandidate.strengths,
        weaknesses: topCandidate.weaknesses,
        breakdown: topCandidate.breakdown
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

testRealisticAIAPI();
