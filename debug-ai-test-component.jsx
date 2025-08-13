// Temporary debug component to test AI API from frontend
// Add this to your shortlist page temporarily for debugging

const TestAIButton = () => {
  const testAI = async () => {
    console.log('🧪 Testing AI API from frontend...');
    
    const token = localStorage.getItem('token');
    const testData = {
      jobId: 'test-job-id',
      jobTitle: 'Test Job',
      jobDescription: 'Test job description',
      jobRequirements: ['JavaScript', 'React'],
      candidates: [{
        id: 'test-candidate-id',
        name: 'Test Candidate',
        email: 'test@example.com',
        skills: ['JavaScript'],
        resumeText: 'Test resume',
        appliedAt: new Date().toISOString()
      }]
    };

    try {
      console.log('📤 Sending test request...');
      const response = await fetch('/api/ai/shortlist-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });

      console.log('📊 Test response:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Test error:', errorText);
        alert(`Test failed: ${response.status} - ${errorText}`);
      } else {
        const data = await response.json();
        console.log('✅ Test success:', data);
        alert(`Test successful! Score: ${data.data?.topCandidates?.[0]?.score}`);
      }
    } catch (error) {
      console.error('❌ Test exception:', error);
      alert(`Test exception: ${error.message}`);
    }
  };

  return (
    <button 
      onClick={testAI}
      style={{
        background: 'orange',
        color: 'white',
        padding: '10px',
        border: 'none',
        borderRadius: '5px',
        margin: '10px'
      }}
    >
      🧪 Test AI API
    </button>
  );
};

// To use: Add <TestAIButton /> temporarily to your shortlist page for debugging
