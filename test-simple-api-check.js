/**
 * Simple API Health Check
 * Test if the resume analysis API is working at all
 */

async function testSimpleApiCheck() {
  console.log('🧪 Simple API Health Check\n');
  
  const simpleTestData = {
    action: 'analyze',
    jobTitle: 'Developer',
    jobDescription: 'We need a developer with JavaScript experience.',
    jobRequirements: ['JavaScript'],
    resumeText: 'I have experience with JavaScript development.'
  };
  
  try {
    console.log('📤 Testing basic API functionality...');
    
    const response = await fetch('http://localhost:3002/api/resume-rag-python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleTestData)
    });
    
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API is working!');
      console.log('📊 Success:', result.success);
      
      if (result.success) {
        console.log('📋 Analysis type:', result.data?.analysis?.structuredAnalysis?.metadata?.analysisType || 'Unknown');
        console.log('🎯 Overall score:', result.data?.analysis?.structuredAnalysis?.overallMatch?.score || 'Unknown');
      } else {
        console.log('❌ API error:', result.message);
        console.log('🔍 Error details:', result.error);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', response.status);
      console.log('📝 Error details:', errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

// Run the simple test
testSimpleApiCheck().catch(console.error);