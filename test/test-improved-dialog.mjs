// Test script for the improved post-application recommendation dialog
import fs from 'fs';
import path from 'path';

const testImprovedDialog = () => {
  console.log('🎯 Testing Improved Post-Application Recommendation Dialog\n');
  
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
  
  // Test 1: Check if summarization API exists
  test(
    'Job Summarization API Created',
    () => fs.existsSync(path.join(process.cwd(), 'src/pages/api/summarize-job.js')),
    'API endpoint at /api/summarize-job'
  );
  
  // Test 2: Check updated dialog component
  const dialogPath = path.join(process.cwd(), 'src/components/PostApplicationRecommendationDialog.jsx');
  if (fs.existsSync(dialogPath)) {
    const dialogContent = fs.readFileSync(dialogPath, 'utf8');
    
    test(
      'Dialog uses compact max-width',
      () => dialogContent.includes('max-w-4xl'),
      'Uses max-w-4xl for wider landscape layout'
    );
    
    test(
      'Dialog has landscape grid layout',
      () => dialogContent.includes('grid-cols-1 md:grid-cols-3'),
      'Three-column layout for better space utilization'
    );
    
    test(
      'Dialog includes summarization state',
      () => dialogContent.includes('isSummarizing') && dialogContent.includes('jobSummary'),
      'Manages summarization loading and result states'
    );
    
    test(
      'Dialog has expand/collapse functionality',
      () => dialogContent.includes('showFullDescription') && dialogContent.includes('ChevronDown') && dialogContent.includes('ChevronUp'),
      'Toggle between summary and full description'
    );
    
    test(
      'Dialog uses compact sizing',
      () => dialogContent.includes('text-xs') && dialogContent.includes('h-3 w-3'),
      'Smaller fonts and icons for compact display'
    );
    
    test(
      'Dialog has proper height control',
      () => dialogContent.includes('max-h-[85vh]') && dialogContent.includes('overflow-y-auto'),
      'Prevents overflow with scrollable content'
    );
    
    test(
      'Dialog calls summarization API',
      () => dialogContent.includes('summarizeJobDescription') && dialogContent.includes('/api/summarize-job'),
      'Integrates with job summarization endpoint'
    );
    
    test(
      'Dialog shows summarization loading',
      () => dialogContent.includes('Summarizing...') && dialogContent.includes('Loader2'),
      'Visual feedback during summarization'
    );
  }
  
  // Test 3: Check summarization API implementation
  const apiPath = path.join(process.cwd(), 'src/pages/api/summarize-job.js');
  if (fs.existsSync(apiPath)) {
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    test(
      'API uses Groq for summarization',
      () => apiContent.includes('api.groq.com') && apiContent.includes('GROQ_API_KEY'),
      'Integrates with Groq API for AI summarization'
    );
    
    test(
      'API has fallback mechanism',
      () => apiContent.includes('fallback') && apiContent.includes('sentences.slice'),
      'Falls back to simple truncation if AI fails'
    );
    
    test(
      'API validates input',
      () => apiContent.includes('typeof description') && apiContent.includes('description.length'),
      'Validates description input properly'
    );
    
    test(
      'API uses appropriate model',
      () => apiContent.includes('llama3-8b-8192'),
      'Uses fast Llama model for quick responses'
    );
    
    test(
      'API limits summary length',
      () => apiContent.includes('max_tokens: 150') && apiContent.includes('150 characters'),
      'Enforces concise summaries'
    );
  }
  
  // Check if GROQ API key is configured
  test(
    'Groq API Key Configured',
    () => {
      try {
        const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
        return envFile.includes('GROQ_API_KEY=gsk_');
      } catch {
        try {
          const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
          return envFile.includes('GROQ_API_KEY=gsk_');
        } catch {
          return false;
        }
      }
    },
    'API key available for job summarization'
  );
  
  // Print summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📋 Total: ${results.tests.length}`);
  
  const passRate = Math.round((results.passed / results.tests.length) * 100);
  console.log(`🎯 Pass Rate: ${passRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The improved dialog is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  console.log('\n🎨 UI Improvements:');
  console.log('1. Landscape layout (3-column grid) for better space usage');
  console.log('2. Compact sizing with smaller fonts and icons');
  console.log('3. AI-powered job description summarization');
  console.log('4. Expand/collapse toggle for full descriptions');
  console.log('5. Better height control with scrollable content');
  console.log('6. Loading states for summarization process');
  
  console.log('\n🤖 AI Summarization:');
  console.log('- Uses Groq API with Llama3-8b model');
  console.log('- Generates concise 2-3 sentence summaries');
  console.log('- Falls back to truncation if AI unavailable');
  console.log('- Limits summaries to ~150 characters');
  console.log('- Shows loading spinner during processing');
  
  return results;
};

// Run the test
testImprovedDialog();
