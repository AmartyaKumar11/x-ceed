/**
 * Debug Resume Analysis API Issues
 * Test the resume-rag-python endpoint directly to identify the 500 error
 */

const testData = {
  action: 'analyze',
  jobId: 'test-job-id',
  jobTitle: 'Frontend Developer',
  jobDescription: 'We are looking for a skilled Frontend Developer with experience in React, Next.js, and modern JavaScript. The ideal candidate should have experience with UI/UX design principles.',
  requirements: ['React', 'Next.js', 'JavaScript', 'HTML/CSS', 'Git'],
  resumePath: '/uploads/temp-resumes/test-resume.pdf'
};

async function testResumeAnalysisAPI() {
  console.log('🧪 Testing Resume Analysis API endpoint...');
  console.log('📤 Test data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      try {
        const errorJSON = JSON.parse(errorText);
        console.log('❌ Error JSON:', JSON.stringify(errorJSON, null, 2));
      } catch (e) {
        console.log('❌ Error is not JSON format');
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Test with different scenarios
async function testWithoutResumePath() {
  console.log('\n🧪 Testing without resume path...');
  
  const testDataNoResume = {
    ...testData,
    resumePath: undefined,
    resumeText: 'John Doe\nSoftware Engineer\n\nSkills:\n- React, JavaScript, HTML/CSS\n- 3 years experience\n- Built multiple web applications'
  };
  
  try {
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testDataNoResume)
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success with resume text!');
    } else {
      const errorText = await response.text();
      console.log('❌ Error with resume text:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

async function runAllTests() {
  console.log('🎯 DEBUGGING RESUME ANALYSIS API');
  console.log('=' * 50);
  
  await testResumeAnalysisAPI();
  await testWithoutResumePath();
  
  console.log('\n📝 POSSIBLE ISSUES:');
  console.log('1. Resume file not found at the specified path');
  console.log('2. PDF extraction failing');
  console.log('3. Python service communication issue');
  console.log('4. Authentication/token validation issue');
  console.log('5. Invalid request format');
  
  console.log('\n🔧 DEBUGGING STEPS:');
  console.log('1. Check if Python service is responding to direct requests');
  console.log('2. Verify resume file exists at the specified path');
  console.log('3. Check server logs for detailed error messages');
  console.log('4. Test with resume text instead of file path');
}

runAllTests();
