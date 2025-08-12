/**
 * Test Live Prep Plan Generation with OpenRouter
 * Tests the actual API endpoint while server is running
 */

async function testLivePrepPlanGeneration() {
  console.log('🧪 Testing Live Prep Plan Generation with OpenRouter\n');
  
  // Test data
  const testJobData = {
    jobTitle: 'Frontend Developer',
    companyName: 'TechCorp',
    jobDescription: 'We are looking for a skilled Frontend Developer with experience in React, JavaScript, TypeScript, and Node.js.',
    requirements: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
    duration: 4,
    source: 'test'
  };
  
  const testToken = 'test-token'; // You'll need to replace with actual token
  
  try {
    console.log('📋 Step 1: Creating a test prep plan...');
    
    // Create prep plan
    const createResponse = await fetch('http://localhost:3002/api/prep-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(testJobData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Failed to create prep plan:', errorText);
      return;
    }
    
    const createResult = await createResponse.json();
    console.log('✅ Prep plan created:', createResult.data._id);
    
    console.log('\n📋 Step 2: Generating detailed plan with OpenRouter...');
    
    // Generate detailed plan
    const generateResponse = await fetch('http://localhost:3002/api/prep-plans/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        prepPlanId: createResult.data._id,
        forceRegenerate: true
      })
    });
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.log('❌ Failed to generate detailed plan:', errorText);
      return;
    }
    
    const generateResult = await generateResponse.json();
    console.log('✅ Detailed plan generated successfully!');
    console.log('📊 Plan structure:', Object.keys(generateResult.data.detailedPlan));
    
    if (generateResult.data.detailedPlan.gapAnalysis) {
      console.log('🎯 Gap Analysis found:', generateResult.data.detailedPlan.gapAnalysis.criticalLearningPath?.substring(0, 100) + '...');
    }
    
    if (generateResult.data.detailedPlan.personalizedTopics) {
      console.log('📚 Personalized Topics:', generateResult.data.detailedPlan.personalizedTopics.length);
    }
    
    console.log('\n🎉 OpenRouter integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('⚠️  Note: This test requires a valid JWT token.');
console.log('💡 To get a token, login to the app and check localStorage.getItem("token")');
console.log('🔧 Or test manually through the UI at: http://localhost:3002/dashboard/applicant/prep-plans\n');

// Uncomment to run the test (need valid token)
// testLivePrepPlanGeneration().catch(console.error);