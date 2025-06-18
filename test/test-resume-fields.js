import { getDatabase } from './src/lib/mongodb.js';

async function testResumeFields() {
  console.log('🧪 Testing resume fields in API response...');
  
  try {
    const db = await getDatabase();
    
    // Get a sample job with applications
    const application = await db.collection('applications').findOne({});
    const jobId = application.jobId;
    
    console.log(`\n🎯 Testing API for jobId: ${jobId}`);
    
    // Test the API directly
    const response = await fetch(`http://localhost:3000/api/applications?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📊 API Response:');
      console.log(`Total applications: ${data.applications?.length || 0}`);
      
      if (data.applications && data.applications.length > 0) {
        data.applications.forEach((app, index) => {
          console.log(`\nCandidate ${index + 1}:`);
          console.log(`  Name: ${app.applicantName}`);
          console.log(`  Email: ${app.applicantEmail}`);
          console.log(`  ResumeUsed: ${app.resumeUsed}`);
          console.log(`  ResumePath: ${app.resumePath}`);
          console.log(`  ResumeUrl: ${app.resumeUrl}`);
          console.log(`  Has Resume?: ${!!(app.resumeUsed || app.resumePath || app.resumeUrl)}`);
          console.log(`  Cover Letter: ${app.coverLetter ? 'Yes' : 'No'}`);
          console.log(`  Additional Message: ${app.additionalMessage ? 'Yes' : 'No'}`);
        });
      }
    } else {
      console.error('❌ API request failed:', response.status, response.statusText);
    }
    
    console.log('\n✅ Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing resume fields:', error);
    process.exit(1);
  }
}

testResumeFields();
