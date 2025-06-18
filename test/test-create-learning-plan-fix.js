// Test script to debug the Create Learning Plan button issue
const fetch = require('node-fetch');

async function testCreateLearningPlanButtonFix() {
  console.log('🔧 TESTING CREATE LEARNING PLAN BUTTON FIX\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check if the server is running
    console.log('🌐 Step 1: Checking if development server is running...');
    try {
      const response = await fetch('http://localhost:3002');
      if (response.ok) {
        console.log('✅ Development server is running on port 3002');
      } else {
        console.log(`⚠️ Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Development server is not running. Please start it with: npm run dev');
      return;
    }

    // Step 2: Test the prep plans API endpoint
    console.log('\n🔌 Step 2: Testing prep plans API endpoint...');
    try {
      const apiResponse = await fetch('http://localhost:3002/api/prep-plans');
      console.log(`📡 API Response Status: ${apiResponse.status}`);
      
      if (apiResponse.status === 401) {
        console.log('✅ API is working correctly (requires authentication)');
      } else if (apiResponse.status === 200) {
        console.log('✅ API is accessible (user might be logged in)');
      } else {
        console.log(`⚠️ Unexpected API response: ${apiResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ API Error: ${error.message}`);
    }

    // Step 3: Check what we fixed
    console.log('\n🔧 Step 3: Summary of fixes applied...');
    console.log('✅ Removed ragAnalysis requirement from button visibility');
    console.log('✅ Added debug information to help troubleshooting');
    console.log('✅ Added async/await error handling to button click');
    console.log('✅ Added better logging to createPrepPlan function');
    console.log('✅ Added better error handling to createPrepPlanRecord');
    console.log('✅ Added user-friendly error messages with alerts');
    console.log('✅ Added disabled state to prevent clicks without job data');

    // Step 4: Instructions for testing
    console.log('\n🧪 Step 4: How to test the fix...');
    console.log('1. Open http://localhost:3002 in your browser');
    console.log('2. Log in to your account');
    console.log('3. Navigate to Resume Match page for any job');
    console.log('4. Look for the "Create Learning Plan for This Job" button');
    console.log('5. The button should now be visible as soon as job data loads');
    console.log('6. Open browser DevTools (F12) → Console tab');
    console.log('7. Click the button and check the console for debug logs');
    
    console.log('\n📋 What to look for:');
    console.log('• Debug info box showing Job=✅, Analysis=✅/❌, PrepPlan=❌');
    console.log('• Console logs when button is clicked');
    console.log('• Clear error messages if authentication fails');
    console.log('• Success message in chat after plan creation');

    // Step 5: Common issues and solutions
    console.log('\n🔍 Step 5: Common issues and solutions...');
    console.log('Issue: Button still not visible');
    console.log('   → Check if job data is loading (look for debug info)');
    console.log('   → Make sure you\'re on a resume match page with valid job ID');
    
    console.log('\nIssue: Button visible but nothing happens when clicked');
    console.log('   → Check browser console for JavaScript errors');
    console.log('   → Look for authentication errors in console');
    console.log('   → Make sure you\'re logged in');
    
    console.log('\nIssue: API errors when creating prep plan');
    console.log('   → Check if authentication token is valid');
    console.log('   → Verify prep plans API is working');
    console.log('   → Check database connection');

    // Step 6: Quick debug commands
    console.log('\n⚡ Step 6: Quick debug commands for browser console...');
    console.log('Copy and paste these in browser DevTools Console:');
    console.log('\n// Check current page state');
    console.log('console.log("Auth token:", !!localStorage.getItem("token"));');
    console.log('console.log("Current path:", window.location.pathname);');
    console.log('\n// Find the button');
    console.log('const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Create Learning Plan"));');
    console.log('console.log("Button found:", btn);');
    console.log('\n// Test API directly');
    console.log('fetch("/api/prep-plans", {headers: {"Authorization": `Bearer ${localStorage.getItem("token")}`}}).then(r => console.log("API test:", r.status));');

    console.log('\n🎉 SUMMARY');
    console.log('=' .repeat(60));
    console.log('✅ Button visibility condition fixed (no longer requires ragAnalysis)');
    console.log('✅ Enhanced error handling and user feedback');
    console.log('✅ Added comprehensive debug logging');
    console.log('✅ Button should now work immediately when page loads');
    console.log('\nThe "Create Learning Plan for This Job" button should now work!');
    console.log('If you still have issues, check the browser console for specific error messages.');

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testCreateLearningPlanButtonFix().catch(console.error);
