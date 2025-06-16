// Test Python RAG Service Communication
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testPythonRagService() {
  console.log('🧪 Testing Python RAG Service Communication...\n');
  
  const PYTHON_URL = 'http://localhost:8000';
  
  try {
    // 1. Test health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${PYTHON_URL}/`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check response:', healthData);
    
    // 2. Test analysis endpoint
    console.log('\n2️⃣ Testing analysis endpoint...');
    const analysisPayload = {
      resume_text: "John Doe\nSoftware Engineer\n\nSkills:\n- JavaScript\n- React\n- Node.js\n\nExperience:\n- 3 years at Tech Company\n- Built web applications\n- Worked with REST APIs",
      job_description: "We are looking for a Frontend Developer with experience in React and JavaScript. The candidate should have experience building web applications and working with APIs.",
      job_title: "Frontend Developer",
      job_requirements: ["React", "JavaScript", "APIs", "Web Development"]
    };
    
    console.log('📤 Sending analysis request...');
    const analysisResponse = await fetch(`${PYTHON_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analysisPayload)
    });
    
    console.log('📡 Response status:', analysisResponse.status);
    console.log('📡 Response headers:', Object.fromEntries(analysisResponse.headers.entries()));
    
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Analysis response:', JSON.stringify(analysisData, null, 2));
    } else {
      const errorText = await analysisResponse.text();
      console.log('❌ Analysis failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPythonRagService();
