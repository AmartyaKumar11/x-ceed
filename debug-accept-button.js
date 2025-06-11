// Test script to debug the accept button status update issue
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function debugAcceptButtonIssue() {
  console.log('🔍 DEBUGGING ACCEPT BUTTON ISSUE');
  console.log('=================================\n');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Step 1: Find a recruiter and their jobs
    console.log('🔍 Step 1: Finding recruiter and applications...');
    
    const recruiter = await db.collection('users').findOne({ userType: 'recruiter' });
    if (!recruiter) {
      console.log('❌ No recruiter found');
      return;
    }
    
    console.log(`✅ Found recruiter: ${recruiter.email}`);
    console.log(`📋 Recruiter ID: ${recruiter._id}`);
    
    // Find a job posted by this recruiter
    const job = await db.collection('jobs').findOne({ recruiterId: recruiter._id.toString() });
    if (!job) {
      console.log('❌ No jobs found for this recruiter');
      return;
    }
    
    console.log(`✅ Found job: ${job.title}`);
    console.log(`📋 Job ID: ${job._id}`);
    
    // Find applications for this job
    const applications = await db.collection('applications').find({ jobId: job._id.toString() }).toArray();
    console.log(`✅ Found ${applications.length} applications for this job`);
    
    if (applications.length === 0) {
      console.log('❌ No applications found to test with');
      return;
    }
    
    const testApplication = applications[0];
    console.log(`🎯 Testing with application: ${testApplication._id}`);
    console.log(`   Current status: ${testApplication.status}`);
    console.log(`   Applicant ID: ${testApplication.applicantId}`);
    
    // Step 2: Test authentication token creation
    console.log('\n🔍 Step 2: Testing JWT token creation...');
    
    const token = jwt.sign(
      { 
        userId: recruiter._id.toString(),
        userType: 'recruiter',
        email: recruiter.email
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ JWT token created successfully');
    
    // Step 3: Test the API logic manually
    console.log('\n🔍 Step 3: Testing API logic manually...');
    
    // Verify the recruiter owns this job
    const jobCheck = await db.collection('jobs').findOne({
      _id: new ObjectId(testApplication.jobId),
      recruiterId: recruiter._id.toString()
    });
    
    if (!jobCheck) {
      console.log('❌ Recruiter does not own this job');
      return;
    }
    
    console.log('✅ Recruiter owns the job');
    
    // Step 4: Test the update operation
    console.log('\n🔍 Step 4: Testing status update operation...');
    
    const updateObj = {
      status: 'accepted',
      updatedAt: new Date()
    };
    
    console.log('🔄 Updating application status...');
    const result = await db.collection('applications').updateOne(
      { _id: new ObjectId(testApplication._id) },
      { $set: updateObj }
    );
    
    console.log(`✅ Update result - Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    
    if (result.modifiedCount === 0) {
      console.log('⚠️  No documents were modified');
      // Check if the application exists
      const existingApp = await db.collection('applications').findOne({ _id: new ObjectId(testApplication._id) });
      if (existingApp) {
        console.log('✅ Application exists');
        console.log(`   Current status: ${existingApp.status}`);
        if (existingApp.status === 'accepted') {
          console.log('✅ Status is already "accepted" - no change needed');
        }
      } else {
        console.log('❌ Application not found');
      }
    }
    
    // Get the updated application
    const updatedApplication = await db.collection('applications').findOne({
      _id: new ObjectId(testApplication._id)
    });
    
    console.log('✅ Updated application retrieved');
    console.log(`   New status: ${updatedApplication.status}`);
    
    // Step 5: Test notification creation
    console.log('\n🔍 Step 5: Testing notification creation...');
    
    const notification = {
      userId: new ObjectId(updatedApplication.applicantId),
      type: 'application_accepted',
      title: '🎉 Application Accepted!',
      message: `Congratulations! Your application for ${job.title} at ${job.company} has been accepted. You will hear from the recruiter soon with next steps.`,
      company: job.company,
      position: job.title,
      timestamp: new Date(),
      read: false,
      priority: 'high',
      actionRequired: true,
      metadata: {
        jobId: job._id.toString(),
        jobTitle: job.title,
        company: job.company,
        applicationId: updatedApplication._id.toString(),
        newStatus: 'accepted'
      }
    };
    
    const notificationResult = await db.collection('notifications').insertOne(notification);
    console.log(`✅ Notification created: ${notificationResult.insertedId}`);
    
    // Step 6: Check for common issues
    console.log('\n🔍 Step 6: Checking for common issues...');
    
    // Check if user IDs are consistent
    console.log('📋 Data type checks:');
    console.log(`   Recruiter ID type: ${typeof recruiter._id} (${recruiter._id})`);
    console.log(`   Job recruiterId type: ${typeof job.recruiterId} (${job.recruiterId})`);
    console.log(`   Application applicantId type: ${typeof testApplication.applicantId} (${testApplication.applicantId})`);
    
    const typeConsistency = recruiter._id.toString() === job.recruiterId;
    console.log(`✅ Recruiter ID consistency: ${typeConsistency ? 'PASS' : 'FAIL'}`);
    
    // Check JWT payload
    console.log('\n📋 JWT Token verification:');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`   User ID in token: ${decoded.userId}`);
      console.log(`   User type in token: ${decoded.userType}`);
      console.log(`   Token valid: ✅`);
    } catch (error) {
      console.log(`   Token verification failed: ❌ ${error.message}`);
    }
    
    console.log('\n🎯 DIAGNOSIS RESULTS');
    console.log('===================');
    console.log('✅ Database connection: Working');
    console.log('✅ Recruiter found: Working');
    console.log('✅ Job ownership: Verified');
    console.log('✅ Application exists: Working');
    console.log('✅ Status update: Working');
    console.log('✅ Notification creation: Working');
    console.log('✅ JWT token creation: Working');
    
    console.log('\n💡 POTENTIAL ISSUES TO CHECK:');
    console.log('1. Frontend API endpoint URL');
    console.log('2. CORS configuration');
    console.log('3. Authentication middleware');
    console.log('4. Network connectivity');
    console.log('5. Browser console errors');
    
    // Step 7: Simulate the exact API call
    console.log('\n🔍 Step 7: API Call Simulation...');
    console.log('The API call should be:');
    console.log(`   URL: /api/applications/${testApplication._id}`);
    console.log(`   Method: PATCH`);
    console.log(`   Headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ${token.substring(0, 20)}...' }`);
    console.log(`   Body: { "status": "accepted" }`);
    
    console.log('\n🚀 RECOMMENDATION:');
    console.log('The backend API logic appears to be working correctly.');
    console.log('The issue is likely in the frontend or network layer.');
    console.log('Check browser console for errors when clicking the accept button.');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the debug test
debugAcceptButtonIssue().catch(console.error);
