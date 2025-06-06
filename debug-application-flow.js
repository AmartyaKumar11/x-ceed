const { MongoClient, ObjectId } = require('mongodb');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const uri = "mongodb+srv://amartya200315:VJ9Pe1y2BrJLgSFh@cluster0.mongodb.net/job-portal?retryWrites=true&w=majority";

async function debugApplicationFlow() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔍 Starting comprehensive application flow debug...\n');
    
    await client.connect();
    const db = client.db('job-portal');
    
    // 1. Check available jobs
    console.log('1️⃣ Checking available jobs:');
    const jobs = await db.collection('jobs').find({ status: 'active' }).toArray();
    console.log(`Found ${jobs.length} active jobs:`);
    jobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} (ID: ${job._id})`);
    });
    
    if (jobs.length === 0) {
      console.log('❌ No active jobs found!');
      return;
    }
    
    // 2. Test ObjectId validation
    const testJobId = jobs[0]._id.toString();
    console.log(`\n2️⃣ Testing ObjectId validation for: ${testJobId}`);
    console.log('Is valid ObjectId:', ObjectId.isValid(testJobId));
    
    // 3. Test job lookup
    console.log('\n3️⃣ Testing job lookup in database:');
    const foundJob = await db.collection('jobs').findOne({ 
      _id: new ObjectId(testJobId),
      status: 'active'
    });
    console.log('Job found:', foundJob ? 'YES' : 'NO');
    if (foundJob) {
      console.log('Job details:', {
        title: foundJob.title,
        company: foundJob.company,
        status: foundJob.status
      });
    }
    
    // 4. Check users collection for authentication
    console.log('\n4️⃣ Checking users for authentication:');
    const users = await db.collection('users').find({ userType: 'applicant' }).toArray();
    console.log(`Found ${users.length} applicant users`);
    if (users.length > 0) {
      console.log('Sample user:', {
        email: users[0].email,
        userType: users[0].userType
      });
    }
    
    // 5. Check existing applications
    console.log('\n5️⃣ Checking existing applications:');
    const applications = await db.collection('applications').find({}).toArray();
    console.log(`Found ${applications.length} existing applications`);
    
    // 6. Test form data simulation
    console.log('\n6️⃣ Testing form data structure:');
    const formData = {
      jobId: testJobId,
      coverLetter: 'Test cover letter',
      additionalMessage: 'Test additional message'
    };
    console.log('Form data:', formData);
    
    // 7. Test direct application creation
    console.log('\n7️⃣ Testing direct application creation:');
    const testApplication = {
      jobId: new ObjectId(testJobId),
      applicantId: users.length > 0 ? users[0]._id : new ObjectId(),
      coverLetter: 'Test cover letter',
      additionalMessage: 'Test message',
      resumeUrl: '/test/resume.pdf',
      status: 'pending',
      submittedAt: new Date()
    };
    
    try {
      const result = await db.collection('applications').insertOne(testApplication);
      console.log('✅ Direct application creation successful:', result.insertedId);
      
      // Clean up test application
      await db.collection('applications').deleteOne({ _id: result.insertedId });
      console.log('🧹 Test application cleaned up');
    } catch (error) {
      console.log('❌ Direct application creation failed:', error.message);
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Active jobs: ${jobs.length}`);
    console.log(`- Applicant users: ${users.length}`);
    console.log(`- Existing applications: ${applications.length}`);
    console.log(`- Test job ID: ${testJobId}`);
    console.log(`- ObjectId valid: ${ObjectId.isValid(testJobId)}`);
    console.log(`- Job lookup successful: ${foundJob ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await client.close();
  }
}

debugApplicationFlow();
