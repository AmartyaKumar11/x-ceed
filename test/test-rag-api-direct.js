// Test the RAG API endpoint directly with authentication bypass
const testData = {
  action: 'analyze',
  jobId: '676e1e8bb48f05bf3c123456',
  jobDescription: 'We are looking for a skilled Frontend Developer with expertise in React, Next.js, and modern JavaScript. The ideal candidate should have experience with UI/UX design principles and be comfortable working in an agile environment.',
  jobTitle: 'Frontend Developer',
  jobRequirements: ['React', 'Next.js', 'JavaScript', 'HTML/CSS', 'Git'],
  resumeText: 'John Doe\nSoftware Engineer\n\nExperience:\n- 3 years of React development\n- Built multiple Next.js applications\n- Strong JavaScript skills\n- Experience with HTML, CSS, and responsive design\n\nEducation:\n- Bachelor of Computer Science\n\nSkills:\n- React, Next.js, JavaScript, TypeScript\n- HTML5, CSS3, Sass\n- Git, GitHub, Agile development'
};

async function testRAGAPIEndpoint() {
  console.log('🧪 Testing RAG API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3002/api/resume-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 API Status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Success!');
      console.log('📋 Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ API Failed:', data);
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testRAGAPIEndpoint();
