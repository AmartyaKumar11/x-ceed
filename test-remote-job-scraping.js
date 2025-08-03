// Test script for the remote job scraping functionality
const fetch = require('node-fetch');

async function testJobScraping() {
  console.log('🧪 Testing remote job scraping functionality...\n');

  // Test URL - you can replace this with any job posting URL
  const testUrl = 'https://jobicy.com/jobs/127426-content-management';
  
  try {
    const response = await fetch('http://localhost:3002/api/scrape-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
        jobTitle: 'Content Management',
        company: 'Bisys & Bizzy Media LIMITED',
        jobId: 'test-127426'
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ Scraping successful!');
      console.log('📊 Results:');
      console.log(`  Job Title: ${result.data.jobTitle}`);
      console.log(`  Company: ${result.data.company}`);
      console.log(`  Description Length: ${result.data.description.length} characters`);
      console.log(`  Requirements Found: ${result.data.requirements.length}`);
      console.log(`  Word Count: ${result.data.wordCount}`);
      
      console.log('\n📝 First 200 characters of description:');
      console.log(result.data.description.substring(0, 200) + '...');
      
      console.log('\n📋 Requirements extracted:');
      result.data.requirements.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.substring(0, 100)}...`);
      });
      
    } else {
      console.error('❌ API request failed:', response.status, response.statusText);
      const errorResult = await response.json();
      console.error('Error details:', errorResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testJobScraping();
