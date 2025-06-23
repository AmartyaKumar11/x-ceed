/**
 * Test script for AI Candidate Shortlisting API
 * This script tests the Gemini-powered AI shortlisting functionality
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3002';

// Test data
const testJobId = '674a9b8e123456789abcdef0'; // Replace with actual job ID
const testToken = 'your-test-token'; // Replace with actual token

async function testAIShortlisting() {
  console.log('🤖 Testing AI Candidate Shortlisting...\n');
  
  try {
    console.log('📤 Sending request to AI shortlist API...');
    
    const response = await fetch(`${API_BASE_URL}/api/ai/shortlist-candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        jobId: testJobId
      })
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.log('❌ Error Response:', errorData);
      return;
    }

    const result = await response.json();
    console.log('✅ Success! AI Shortlisting Results:');
    console.log('=====================================');
    
    if (result.success && result.data) {
      const { data } = result;
      
      console.log(`📊 Total Candidates Analyzed: ${data.totalCandidates}`);
      console.log(`📋 Analysis Criteria: ${data.criteria?.join(', ')}`);
      console.log(`📅 Analysis Date: ${data.analyzed_at}`);
      console.log(`📝 Summary: ${data.summary}\n`);
      
      if (data.shortlist && data.shortlist.length > 0) {
        console.log('🏆 TOP CANDIDATES:');
        console.log('==================');
        
        data.shortlist.slice(0, 3).forEach((candidate, index) => {
          console.log(`\n${index + 1}. ${candidate.applicant_name}`);
          console.log(`   📧 Email: ${candidate.applicant_email}`);
          console.log(`   🎯 Overall Score: ${candidate.overall_score}%`);
          console.log(`   💼 Skills: ${candidate.skills_score}% | Experience: ${candidate.experience_score}% | Projects: ${candidate.projects_score}%`);
          console.log(`   ✅ Strengths: ${candidate.strengths?.slice(0, 2).join(', ')}${candidate.strengths?.length > 2 ? '...' : ''}`);
          console.log(`   🚀 Recommendation: ${candidate.recommendation}`);
        });
        
        console.log(`\n📈 Score Distribution:`);
        const highScorers = data.shortlist.filter(c => c.overall_score >= 70).length;
        const mediumScorers = data.shortlist.filter(c => c.overall_score >= 50 && c.overall_score < 70).length;
        const lowScorers = data.shortlist.filter(c => c.overall_score < 50).length;
        
        console.log(`   🟢 High (70%+): ${highScorers} candidates`);
        console.log(`   🟡 Medium (50-69%): ${mediumScorers} candidates`);
        console.log(`   🔴 Low (<50%): ${lowScorers} candidates`);
        
      } else {
        console.log('📭 No candidates found for analysis');
      }
    } else {
      console.log('⚠️ Unexpected response format:', result);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('💡 Make sure:');
    console.error('   - Next.js server is running on port 3002');
    console.error('   - MongoDB is running and contains test data');
    console.error('   - Gemini API key is configured in .env.local');
    console.error('   - Job ID and token are valid');
  }
}

async function testStatusUpdate() {
  console.log('\n🔄 Testing Application Status Update...\n');
  
  try {
    const testApplicationId = '674a9b8e123456789abcdef1'; // Replace with actual application ID
    const newStatus = 'shortlisted';
    
    console.log(`📤 Updating application ${testApplicationId} to status: ${newStatus}`);
    
    const response = await fetch(`${API_BASE_URL}/api/applications/${testApplicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        status: newStatus
      })
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Status Update Successful!');
      console.log(`   📋 Application ID: ${result.data.applicationId}`);
      console.log(`   🎯 New Status: ${result.data.newStatus}`);
      console.log(`   📅 Updated At: ${result.data.updatedAt}`);
    } else {
      console.log('❌ Status Update Failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Status Update Test Failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🧪 AI Shortlisting API Test Suite');
  console.log('==================================\n');
  
  // Test AI Shortlisting
  await testAIShortlisting();
  
  // Test Status Update
  await testStatusUpdate();
  
  console.log('\n🏁 Tests Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Update test job ID and token with real values');
  console.log('   2. Ensure you have sample applications in MongoDB');
  console.log('   3. Test the UI by clicking "AI Shortlist" button');
  console.log('   4. Verify the ranking and status update functionality');
}

// Execute if run directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testAIShortlisting, testStatusUpdate };
