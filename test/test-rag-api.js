// Test the RAG API endpoint
const testRAGAPI = async () => {
  try {
    console.log('🧪 Testing RAG API endpoint...');
    
    // Get token from localStorage (assuming user is logged in)
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      return;
    }

    // Test data
    const testData = {
      action: 'analyze',
      jobId: 'test-job-id',
      jobDescription: 'We are looking for a Software Engineer with experience in React, Node.js, and MongoDB. The ideal candidate should have 2+ years of experience building web applications.',
      jobTitle: 'Software Engineer',
      jobRequirements: ['React', 'Node.js', 'MongoDB', '2+ years experience'],
      resumeText: 'John Doe - Software Developer with 3 years of experience in React, JavaScript, and MongoDB. Worked at Tech Corp building scalable web applications. Skills include React, Redux, Node.js, Express, MongoDB, Git.'
    };

    console.log('📤 Sending test analysis request...');
    const response = await fetch('/api/resume-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ RAG Analysis Result:', result);
      
      // Test chat functionality
      console.log('💬 Testing chat functionality...');
      const chatResponse = await fetch('/api/resume-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'chat',
          question: 'What are my key strengths for this position?',
          conversationHistory: []
        })
      });

      if (chatResponse.ok) {
        const chatResult = await chatResponse.json();
        console.log('✅ Chat Response:', chatResult);
      } else {
        console.error('❌ Chat test failed:', chatResponse.status);
      }
      
    } else {
      const errorData = await response.json();
      console.error('❌ RAG test failed:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run test
testRAGAPI();
