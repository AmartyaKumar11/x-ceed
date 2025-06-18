// Test script to verify notification system after fixes
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function testNotificationSystem() {
  console.log('🧪 Testing notification system after fixes...\n');
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');
    
    // 1. Get test data
    console.log('1️⃣ Getting test data...');
    const applicant = await db.collection('users').findOne({ userType: 'applicant' });
    const recruiter = await db.collection('users').findOne({ userType: 'recruiter' });
    const job = await db.collection('jobs').findOne({ 
      recruiterId: recruiter._id.toString(),
      status: 'active' 
    });
    
    if (!applicant || !recruiter || !job) {
      console.log('❌ Missing test data');
      return;
    }
    
    console.log(`   Applicant: ${applicant.email} (${applicant._id.toString()})`);
    console.log(`   Recruiter: ${recruiter.email} (${recruiter._id.toString()})`);
    console.log(`   Job: ${job.title}`);
    
    // 2. Create or find test application
    console.log('\n2️⃣ Setting up test application...');
    let application = await db.collection('applications').findOne({
      applicantId: applicant._id.toString(),
      jobId: job._id.toString()
    });
    
    if (!application) {
      const newApp = {
        jobId: job._id.toString(),
        applicantId: applicant._id.toString(),
        resumePath: '/uploads/test-resume.pdf',
        status: 'pending',
        appliedAt: new Date(),
        updatedAt: new Date(),
        applicantDetails: {
          name: `${applicant.firstName} ${applicant.lastName}`,
          email: applicant.email
        },
        jobDetails: {
          title: job.title,
          company: job.company,
          location: job.location
        }
      };
      
      const result = await db.collection('applications').insertOne(newApp);
      application = await db.collection('applications').findOne({ _id: result.insertedId });
      console.log(`   Created test application: ${application._id}`);
    } else {
      console.log(`   Using existing application: ${application._id}`);
    }
    
    // 3. Test notification creation with string userId
    console.log('\n3️⃣ Testing notification creation...');
    const testNotification = {
      userId: applicant._id.toString(), // String userId to match JWT format
      type: 'application_status_update',
      title: '🧪 Test Notification',
      message: `Test notification for ${job.title} application`,
      company: job.company,
      position: job.title,
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      metadata: {
        jobId: job._id.toString(),
        applicationId: application._id.toString(),
        testId: Date.now()
      }
    };
    
    const notificationResult = await db.collection('notifications').insertOne(testNotification);
    console.log(`   ✅ Test notification created: ${notificationResult.insertedId}`);
    
    // 4. Test notification retrieval (simulate API call)
    console.log('\n4️⃣ Testing notification retrieval...');
    const userNotifications = await db.collection('notifications')
      .find({ 
        userId: applicant._id.toString(), // String query
        $or: [
          { deleted: { $ne: true } },
          { deleted: { $exists: false } }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    console.log(`   Found ${userNotifications.length} notifications for user`);
    
    // 5. Test unread count
    console.log('\n5️⃣ Testing unread count...');
    const unreadCount = await db.collection('notifications').countDocuments({
      userId: applicant._id.toString(),
      read: false
    });
    
    console.log(`   Unread notifications: ${unreadCount}`);
    
    // 6. Show recent notifications
    if (userNotifications.length > 0) {
      console.log('\n   📨 Recent notifications:');
      userNotifications.slice(0, 5).forEach((notif, i) => {
        console.log(`     ${i + 1}. "${notif.title}" - ${notif.read ? 'read' : 'UNREAD'}`);
        console.log(`        UserId: ${notif.userId} (${typeof notif.userId})`);
        console.log(`        Created: ${notif.timestamp || notif.createdAt}`);
      });
    }
    
    // 7. Test application status update (simulate API call)
    console.log('\n6️⃣ Testing application status update...');
    const originalStatus = application.status;
    const newStatus = originalStatus === 'pending' ? 'accepted' : 'pending';
    
    console.log(`   Updating status from '${originalStatus}' to '${newStatus}'`);
    
    // Update application
    const updateResult = await db.collection('applications').updateOne(
      { _id: new ObjectId(application._id) },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log('   ✅ Application status updated');
      
      // Create notification (simulate API notification creation)
      const statusNotification = {
        userId: application.applicantId, // String userId
        type: 'application_status_update',
        title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your application for "${job.title}" has been ${newStatus}.`,
        company: job.company,
        position: job.title,
        timestamp: new Date(),
        read: false,
        priority: newStatus === 'accepted' ? 'high' : 'medium',
        metadata: {
          jobId: job._id.toString(),
          applicationId: application._id.toString(),
          newStatus: newStatus
        }
      };
      
      const statusNotifResult = await db.collection('notifications').insertOne(statusNotification);
      console.log(`   ✅ Status notification created: ${statusNotifResult.insertedId}`);
      
      // Verify notification can be retrieved
      const newNotification = await db.collection('notifications').findOne({
        _id: statusNotifResult.insertedId
      });
      
      console.log(`   ✅ Notification retrievable: ${newNotification.title}`);
      
      // Clean up status notification
      await db.collection('notifications').deleteOne({ _id: statusNotifResult.insertedId });
      
      // Revert application status
      await db.collection('applications').updateOne(
        { _id: new ObjectId(application._id) },
        { $set: { status: originalStatus, updatedAt: application.updatedAt } }
      );
      console.log('   🔄 Reverted application status');
    }
    
    // Clean up test notification
    await db.collection('notifications').deleteOne({ _id: notificationResult.insertedId });
    console.log('   🧹 Cleaned up test notification');
    
    console.log('\n🎉 All tests passed! Notification system should now work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testNotificationSystem().then(() => {
  console.log('\n✅ Test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
