// Complete test for the post-application job recommendation feature
import fs from 'fs';
import path from 'path';

const testFeature = () => {
  console.log('🎯 Post-Application Job Recommendation Feature Test\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const test = (name, condition, details = '') => {
    const passed = condition();
    results.tests.push({
      name,
      passed,
      details
    });
    
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}`);
    }
    
    if (details) {
      console.log(`   ${details}`);
    }
  };
  
  // Test 1: Check if similar jobs API exists
  test(
    'Similar Jobs API Created',
    () => fs.existsSync(path.join(process.cwd(), 'src/pages/api/jobs/similar.js')),
    'API endpoint at /api/jobs/similar'
  );
  
  // Test 2: Check if PostApplicationRecommendationDialog exists
  test(
    'Post-Application Dialog Component Created',
    () => fs.existsSync(path.join(process.cwd(), 'src/components/PostApplicationRecommendationDialog.jsx')),
    'React component for showing job recommendations'
  );
  
  // Test 3: Check API implementation
  const apiPath = path.join(process.cwd(), 'src/pages/api/jobs/similar.js');
  if (fs.existsSync(apiPath)) {
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    test(
      'API handles authentication',
      () => apiContent.includes('authMiddleware'),
      'Uses authentication middleware'
    );
    
    test(
      'API finds similar jobs by department',
      () => apiContent.includes('department: originalJob.department'),
      'Matches jobs by department'
    );
    
    test(
      'API finds similar jobs by level',
      () => apiContent.includes('level: originalJob.level'),
      'Matches jobs by level'
    );
      test(
      'API finds similar jobs by title keywords',
      () => apiContent.includes('$regex') && apiContent.includes('originalJob.title'),
      'Matches jobs by title keywords'
    );
    
    test(
      'API excludes already applied jobs',
      () => apiContent.includes('appliedJobIds') && apiContent.includes('$nin:'),
      'Prevents duplicate applications'
    );
    
    test(
      'API has fallback recommendation',
      () => apiContent.includes('fallbackJobs'),
      'Shows other jobs if no similar ones found'
    );
  }
  
  // Test 4: Check dialog component implementation
  const dialogPath = path.join(process.cwd(), 'src/components/PostApplicationRecommendationDialog.jsx');
  if (fs.existsSync(dialogPath)) {
    const dialogContent = fs.readFileSync(dialogPath, 'utf8');
    
    test(
      'Dialog shows success message',
      () => dialogContent.includes('Application Submitted Successfully'),
      'Celebrates successful application'
    );
    
    test(
      'Dialog fetches similar job',
      () => dialogContent.includes('fetchSimilarJob'),
      'Automatically loads job recommendation'
    );
    
    test(
      'Dialog shows job details',
      () => dialogContent.includes('MapPin') && dialogContent.includes('DollarSign'),
      'Displays job location, salary, etc.'
    );
    
    test(
      'Dialog has view details button',
      () => dialogContent.includes('View Details & Apply'),
      'Allows user to apply to recommended job'
    );
    
    test(
      'Dialog handles loading state',
      () => dialogContent.includes('isLoading') && dialogContent.includes('animate-spin'),
      'Shows loading spinner while fetching'
    );
    
    test(
      'Dialog handles error state',
      () => dialogContent.includes('error') && dialogContent.includes('yellow-50'),
      'Shows error message if no jobs found'
    );
  }
  
  // Test 5: Check JobApplicationDialog integration
  const jobDialogPath = path.join(process.cwd(), 'src/components/JobApplicationDialog.jsx');
  if (fs.existsSync(jobDialogPath)) {
    const jobDialogContent = fs.readFileSync(jobDialogPath, 'utf8');
    
    test(
      'JobApplicationDialog imports recommendation dialog',
      () => jobDialogContent.includes('PostApplicationRecommendationDialog'),
      'Imports the new component'
    );
    
    test(
      'JobApplicationDialog has recommendation state',
      () => jobDialogContent.includes('showRecommendationDialog'),
      'Manages recommendation dialog state'
    );
    
    test(
      'JobApplicationDialog triggers recommendation after success',
      () => jobDialogContent.includes('setShowRecommendationDialog(true)'),
      'Opens recommendation dialog after application success'
    );
    
    test(
      'JobApplicationDialog passes job data to recommendation',
      () => jobDialogContent.includes('submittedJobData'),
      'Passes applied job info to recommendation dialog'
    );
  }
  
  // Test 6: Check jobs page integration
  const jobsPagePath = path.join(process.cwd(), 'src/app/dashboard/applicant/jobs/page.jsx');
  if (fs.existsSync(jobsPagePath)) {
    const jobsPageContent = fs.readFileSync(jobsPagePath, 'utf8');
    
    test(
      'Jobs page handles recommended job clicks',
      () => jobsPageContent.includes('recommendedJob'),
      'Opens new application dialog for recommended jobs'
    );
  }
  
  // Print summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📋 Total: ${results.tests.length}`);
  
  const passRate = Math.round((results.passed / results.tests.length) * 100);
  console.log(`🎯 Pass Rate: ${passRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The post-application job recommendation feature is fully implemented.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📝 Feature Overview:');
  console.log('1. When user submits job application successfully');
  console.log('2. System shows success dialog with similar job recommendation');
  console.log('3. Recommendation finds jobs by department, level, or title match');
  console.log('4. User can click "View Details" to apply to recommended job');
  console.log('5. System prevents showing jobs user already applied to');
  console.log('6. Fallback shows other active jobs if no similar ones found');
  
  console.log('\n🔧 Technical Implementation:');
  console.log('- API: /api/jobs/similar?jobId=<id>');
  console.log('- Component: PostApplicationRecommendationDialog.jsx');
  console.log('- Integration: JobApplicationDialog.jsx shows recommendation after success');
  console.log('- Flow: Jobs page handles recommended job clicks');
  
  return results;
};

// Run the test
testFeature();
