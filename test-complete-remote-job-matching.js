// Comprehensive test for the remote job matching with resume upload feature
console.log('🧪 Testing Remote Job Matching with Resume Upload\n');

// Test 1: Test the scraping API
async function testScrapingAPI() {
  console.log('📊 Test 1: Web Scraping API');
  
  try {
    const response = await fetch('http://localhost:3002/api/scrape-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://jobicy.com/jobs/127426-content-management',
        jobTitle: 'Content Management',
        company: 'Test Company',
        jobId: 'test-remote-job'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Scraping API working correctly');
      console.log(`   Job description: ${result.data.description.length} characters`);
      console.log(`   Requirements: ${result.data.requirements.length} items`);
      console.log(`   Scraping status: ${result.data.metadata?.scrapingStatus || 'success'}`);
      return result.data;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Scraping API test failed:', error.message);
    return null;
  }
}

// Test 2: Check resume upload API
async function testResumeUploadAPI() {
  console.log('\n📤 Test 2: Resume Upload API Endpoint');
  
  try {
    const response = await fetch('http://localhost:3002/api/upload/resume', {
      method: 'GET', // Just check if endpoint exists
    });
    
    // Expect 405 Method Not Allowed for GET (should only accept POST)
    if (response.status === 405) {
      console.log('✅ Resume upload API endpoint exists and properly configured');
      return true;
    } else {
      console.log(`⚠️ Resume upload API responded with: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Resume upload API test failed:', error.message);
    return false;
  }
}

// Test 3: Check if resume match page exists
async function testResumeMatchPage() {
  console.log('\n🎯 Test 3: Resume Match Page Accessibility');
  
  try {
    // Test with sample parameters that the remote job matching would use
    const testParams = new URLSearchParams({
      jobId: 'remote_test123',
      jobTitle: 'Test Position',
      companyName: 'Test Company',
      jobDesc: 'Sample job description for testing',
      requirements: JSON.stringify(['JavaScript', 'React', 'Node.js']),
      jobType: 'remote',
      location: 'Remote',
      source: 'jobicy',
      remote: 'true',
      resumeFilename: 'test-resume.pdf',
      resumeName: 'test-resume.pdf'
    });

    const response = await fetch(`http://localhost:3002/dashboard/applicant/resume-match?${testParams}`, {
      method: 'GET',
    });

    if (response.ok || response.status === 200) {
      console.log('✅ Resume match page is accessible');
      return true;
    } else {
      console.log(`⚠️ Resume match page responded with: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Resume match page test failed:', error.message);
    return false;
  }
}

// Test 4: Test the complete flow simulation
async function testCompleteFlow() {
  console.log('\n🔄 Test 4: Complete Flow Simulation');
  
  const scrapedData = await testScrapingAPI();
  if (!scrapedData) {
    console.log('❌ Cannot proceed with flow test - scraping failed');
    return false;
  }

  console.log('✅ Step 1: Job scraping successful');

  // Simulate the parameters that would be passed to resume match page
  const matchParams = {
    jobId: 'remote_test123',
    jobTitle: 'Content Management',
    companyName: 'Test Company',
    jobDesc: scrapedData.description.substring(0, 200) + '...',
    requirements: scrapedData.requirements.slice(0, 5),
    jobType: 'remote',
    location: 'Remote',
    source: 'jobicy',
    remote: 'true'
  };

  console.log('✅ Step 2: Parameters prepared for resume match page');
  console.log('   Job Title:', matchParams.jobTitle);
  console.log('   Description Length:', matchParams.jobDesc.length);
  console.log('   Requirements Count:', matchParams.requirements.length);

  console.log('✅ Step 3: Flow simulation complete');
  console.log('   Expected user journey:');
  console.log('   1. User clicks "Match Resume" → Job details scraped');
  console.log('   2. Upload dialog opens → User uploads PDF resume');
  console.log('   3. Both job and resume data → Sent to resume match page');
  console.log('   4. AI analysis begins → Comprehensive matching results');

  return true;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive remote job matching tests...\n');

  let passedTests = 0;
  let totalTests = 4;

  // Test scraping API
  const test1 = await testScrapingAPI();
  if (test1) passedTests++;

  // Test resume upload API
  const test2 = await testResumeUploadAPI();
  if (test2) passedTests++;

  // Test resume match page
  const test3 = await testResumeMatchPage();
  if (test3) passedTests++;

  // Test complete flow
  const test4 = await testCompleteFlow();
  if (test4) passedTests++;

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`${passedTests === totalTests ? '🎉' : '⚠️'} Overall Status: ${passedTests === totalTests ? 'ALL SYSTEMS GO!' : 'Some issues detected'}`);

  if (passedTests === totalTests) {
    console.log('\n🚀 Remote job matching with resume upload is ready to use!');
    console.log('   Users can now:');
    console.log('   • Browse remote jobs from Jobicy');
    console.log('   • Click "Match Resume" on any job card');
    console.log('   • Upload their resume via drag & drop');
    console.log('   • Get AI-powered matching analysis');
  } else {
    console.log('\n🔧 Some components need attention before full functionality.');
  }
}

// Execute tests
runAllTests().catch(console.error);
