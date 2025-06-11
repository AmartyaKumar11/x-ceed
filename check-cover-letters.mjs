import { MongoClient } from 'mongodb';

async function checkApplicationsWithCoverLetters() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🔍 Checking Applications with Cover Letters\n');
    
    // Get all applications
    const applications = await db.collection('applications').find({}).toArray();
    
    console.log(`📊 Total applications: ${applications.length}\n`);
    
    // Check cover letter data
    let withCoverLetter = 0;
    let withoutCoverLetter = 0;
    
    for (const app of applications) {
      const hasCoverLetter = app.coverLetter && app.coverLetter.trim().length > 0;
      const hasAdditionalMessage = app.additionalMessage && app.additionalMessage.trim().length > 0;
      
      if (hasCoverLetter) withCoverLetter++;
      else withoutCoverLetter++;
      
      console.log(`📄 Application ${app._id}`);
      console.log(`   Job: ${app.jobDetails?.title || 'Unknown'}`);
      console.log(`   Applicant: ${app.applicantDetails?.name || 'Unknown'}`);
      console.log(`   Applied: ${app.appliedAt}`);
      console.log(`   Cover Letter: ${hasCoverLetter ? 'YES' : 'NO'}`);
      if (hasCoverLetter) {
        console.log(`   Cover Letter Preview: "${app.coverLetter.substring(0, 100)}${app.coverLetter.length > 100 ? '...' : ''}"`);
      }
      console.log(`   Additional Message: ${hasAdditionalMessage ? 'YES' : 'NO'}`);
      if (hasAdditionalMessage) {
        console.log(`   Additional Message Preview: "${app.additionalMessage.substring(0, 100)}${app.additionalMessage.length > 100 ? '...' : ''}"`);
      }
      console.log('');
    }
    
    console.log('📈 Summary:');
    console.log(`   ✅ With cover letter: ${withCoverLetter}`);
    console.log(`   ❌ Without cover letter: ${withoutCoverLetter}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkApplicationsWithCoverLetters();
