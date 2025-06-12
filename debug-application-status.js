// Debug script for application status update functionality
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function debugApplicationStatus() {
  console.log('🔍 Starting application status debug...\n');
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // 1. First, let's check what applications exist
    console.log('📋 Checking existing applications...');
    const applications = await db.collection('applications').find({}).limit(5).toArray();
    console.log(`Found ${applications.length} applications (showing first 5):`);
    
    applications.forEach((app, index) => {
      console.log(`  ${index + 1}. ID: ${app._id}`);
      console.log(`     Job ID: ${app.jobId}`);
      console.log(`     Applicant ID: ${app.applicantId}`);
      console.log(`     Status: ${app.status}`);
      console.log(`     Applied At: ${app.appliedAt}`);
      console.log('');
    });
    
    if (applications.length === 0) {
      console.log('❌ No applications found! Cannot test status update.');
      return;
    }
    
    // 2. Test getting a specific application
    const testApp = applications[0];
    console.log(`🎯 Testing with application ID: ${testApp._id}`);
    
    // Test ObjectId validation
    console.log('🔧 Testing ObjectId validation...');
    let testId = testApp._id.toString();
    
    if (!ObjectId.isValid(testId)) {
      console.log('❌ ObjectId validation failed!');
      return;
    }
    console.log('✅ ObjectId validation passed');
    
    // 3. Test finding the application
    console.log('🔍 Testing application lookup...');
    const foundApp = await db.collection('applications').findOne({
      _id: new ObjectId(testId)
    });
    
    if (!foundApp) {
      console.log('❌ Application not found in database!');
      return;
    }
    console.log('✅ Application found successfully');
    console.log(`   Current status: ${foundApp.status}`);
    
    // 4. Test the update operation (dry run first)
    console.log('🔄 Testing status update operation...');
    const newStatus = foundApp.status === 'pending' ? 'accepted' : 'pending';
    
    console.log(`   Attempting to change status from '${foundApp.status}' to '${newStatus}'`);
    
    // First, let's test just the update query without actually updating
    const updateQuery = {
      _id: new ObjectId(testId)
    };
    
    const updateData = {
      $set: {
        status: newStatus,
        updatedAt: new Date()
      }
    };
    
    console.log('   Update query:', JSON.stringify(updateQuery, null, 2));
    console.log('   Update data:', JSON.stringify(updateData, null, 2));
    
    // 5. Actually perform the update
    const updateResult = await db.collection('applications').updateOne(
      updateQuery,
      updateData
    );
    
    console.log('   Update result:');
    console.log(`     Matched: ${updateResult.matchedCount}`);
    console.log(`     Modified: ${updateResult.modifiedCount}`);
    
    if (updateResult.matchedCount === 0) {
      console.log('❌ No documents matched the query!');
      return;
    }
    
    if (updateResult.modifiedCount === 0) {
      console.log('⚠️  Document matched but not modified (possibly same value)');
    } else {
      console.log('✅ Status updated successfully!');
    }
    
    // 6. Verify the update
    console.log('🔍 Verifying the update...');
    const updatedApp = await db.collection('applications').findOne({
      _id: new ObjectId(testId)
    });
    
    console.log(`   Status after update: ${updatedApp.status}`);
    console.log(`   Updated at: ${updatedApp.updatedAt}`);
    
    // 7. Test notification creation (the part that should happen in the API)
    console.log('🔔 Testing notification creation...');
    
    // Get applicant details
    const applicant = await db.collection('users').findOne({
      _id: new ObjectId(foundApp.applicantId)
    });
    
    if (!applicant) {
      console.log('❌ Applicant not found for notification!');
      return;
    }
    
    console.log(`   Applicant found: ${applicant.email}`);
    
    // Get job details
    const job = await db.collection('jobs').findOne({
      _id: new ObjectId(foundApp.jobId)
    });
    
    if (!job) {
      console.log('❌ Job not found for notification!');
      return;
    }
    
    console.log(`   Job found: ${job.title}`);
    
    // Create notification
    const notification = {
      userId: foundApp.applicantId,
      type: 'application_status_update',
      title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Your application for "${job.title}" has been ${newStatus}.`,
      applicationId: testId,
      jobId: foundApp.jobId,
      isRead: false,
      createdAt: new Date()
    };
    
    console.log('   Creating notification:', JSON.stringify(notification, null, 2));
    
    const notificationResult = await db.collection('notifications').insertOne(notification);
    
    if (notificationResult.insertedId) {
      console.log('✅ Notification created successfully!');
      console.log(`   Notification ID: ${notificationResult.insertedId}`);
    } else {
      console.log('❌ Failed to create notification!');
    }
    
    // 8. Revert the status change for clean testing
    console.log('🔄 Reverting status change for clean testing...');
    await db.collection('applications').updateOne(
      { _id: new ObjectId(testId) },
      { 
        $set: { 
          status: foundApp.status,
          updatedAt: foundApp.updatedAt
        }
      }
    );
    
    // Clean up test notification
    await db.collection('notifications').deleteOne({
      _id: notificationResult.insertedId
    });
    
    console.log('✅ Test completed successfully! Status functionality appears to be working.');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Also test the actual API endpoint simulation
async function testAPIEndpoint() {
  console.log('\n🌐 Testing API endpoint simulation...\n');
  
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get a test application
    const testApp = await db.collection('applications').findOne({});
    
    if (!testApp) {
      console.log('❌ No test application available');
      return;
    }
    
    console.log(`🎯 Simulating API call for application: ${testApp._id}`);
    
    // Simulate the exact flow from the API endpoint
    const applicationId = testApp._id.toString();
    const newStatus = 'accepted';
    
    // Step 1: Validate ObjectId
    if (!ObjectId.isValid(applicationId)) {
      console.log('❌ API would fail: Invalid ObjectId');
      return;
    }
    console.log('✅ ObjectId validation passed');
    
    // Step 2: Find application
    const application = await db.collection('applications').findOne({
      _id: new ObjectId(applicationId)
    });
    
    if (!application) {
      console.log('❌ API would fail: Application not found');
      return;
    }
    console.log('✅ Application found');
    
    // Step 3: Update application
    const updateResult = await db.collection('applications').updateOne(
      { _id: new ObjectId(applicationId) },
      { 
        $set: { 
          status: newStatus, 
          updatedAt: new Date() 
        } 
      }
    );
    
    if (updateResult.matchedCount === 0) {
      console.log('❌ API would fail: No documents matched for update');
      return;
    }
    console.log('✅ Application status updated');
    
    // Step 4: Get updated application
    const updatedApplication = await db.collection('applications').findOne({
      _id: new ObjectId(applicationId)
    });
    console.log('✅ Updated application retrieved');
    
    // Step 5: Create notification (as done in the API)
    const applicant = await db.collection('users').findOne({
      _id: new ObjectId(application.applicantId)
    });
    
    const job = await db.collection('jobs').findOne({
      _id: new ObjectId(application.jobId)
    });
    
    if (applicant && job) {
      const notification = {
        userId: application.applicantId,
        type: 'application_status_update',
        title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your application for "${job.title}" has been ${newStatus}.`,
        applicationId: applicationId,
        jobId: application.jobId,
        isRead: false,
        createdAt: new Date()
      };
      
      const notificationResult = await db.collection('notifications').insertOne(notification);
      console.log('✅ Notification created');
      
      // Clean up
      await db.collection('notifications').deleteOne({
        _id: notificationResult.insertedId
      });
    }
    
    // Revert the change
    await db.collection('applications').updateOne(
      { _id: new ObjectId(applicationId) },
      { 
        $set: { 
          status: testApp.status,
          updatedAt: testApp.updatedAt
        }
      }
    );
    
    console.log('✅ API simulation completed successfully!');
    
  } catch (error) {
    console.error('❌ API simulation failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run both tests
debugApplicationStatus().then(() => {
  return testAPIEndpoint();
}).then(() => {
  console.log('\n🎉 All tests completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
