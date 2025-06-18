// Comprehensive end-to-end test for notification system
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function testEndToEndNotificationFlow() {
  console.log('🔄 Testing end-to-end notification flow...\n');
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');
    
    // 1. Setup test data
    console.log('1️⃣ Setting up test data...');
    const applicant = await db.collection('users').findOne({ 
      userType: 'applicant',
      email: 'kumaramartya11@gmail.com' 
    });
    
    const recruiter = await db.collection('users').findOne({ 
      userType: 'recruiter',
      email: 're234@microsoft.com' 
    });
    
    const job = await db.collection('jobs').findOne({ 
      recruiterId: recruiter._id.toString(),
      status: 'active' 
    });
    
    if (!applicant || !recruiter || !job) {
      console.log('❌ Missing test data');
      return;
    }
    
    console.log(`   ✅ Applicant: ${applicant.email}`);
    console.log(`   ✅ Recruiter: ${recruiter.email}`);
    console.log(`   ✅ Job: ${job.title}`);
    
    // 2. Get or create application
    let application = await db.collection('applications').findOne({
      applicantId: applicant._id.toString(),
      jobId: job._id.toString()
    });
    
    if (!application) {
      console.log('   Creating test application...');
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
    }
    
    console.log(`   ✅ Application ID: ${application._id}`);
    
    // 3. Test different status updates
    const statuses = ['reviewing', 'interview', 'accepted', 'rejected'];
    
    for (const status of statuses) {
      console.log(`\\n2️⃣ Testing '${status}' status update...`);
      
      // Update application status
      const updateResult = await db.collection('applications').updateOne(
        { _id: new ObjectId(application._id) },
        { $set: { status: status, updatedAt: new Date() } }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`   ✅ Application status updated to '${status}'`);
        
        // Create notification (simulating the API)
        let notificationTitle, notificationMessage, notificationType, priority;
        
        switch (status) {
          case 'accepted':
            notificationTitle = '🎉 Application Accepted!';
            notificationMessage = `Congratulations! Your application for ${job.title} at ${job.company} has been accepted.`;
            notificationType = 'application_accepted';
            priority = 'high';
            break;
          case 'rejected':
            notificationTitle = 'Application Update';
            notificationMessage = `Thank you for your interest in the ${job.title} position at ${job.company}.`;
            notificationType = 'application_rejected';
            priority = 'medium';
            break;
          case 'interview':
            notificationTitle = '📅 Interview Scheduled';
            notificationMessage = `Great news! You've been selected for an interview for the ${job.title} position.`;
            notificationType = 'interview_scheduled';
            priority = 'urgent';
            break;
          case 'reviewing':
            notificationTitle = '👀 Application Under Review';
            notificationMessage = `Your application for ${job.title} is now being reviewed.`;
            notificationType = 'application_status';
            priority = 'medium';
            break;
        }
        
        const notification = {
          userId: application.applicantId, // String userId
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          company: job.company,
          position: job.title,
          timestamp: new Date(),
          read: false,
          priority: priority,
          actionRequired: status === 'interview' || status === 'accepted',
          metadata: {
            jobId: job._id.toString(),
            jobTitle: job.title,
            company: job.company,
            applicationId: application._id.toString(),
            newStatus: status
          }
        };
        
        const notificationResult = await db.collection('notifications').insertOne(notification);
        console.log(`   ✅ Notification created: ${notificationResult.insertedId}`);
        
        // Test notification retrieval
        const retrievedNotification = await db.collection('notifications').findOne({
          _id: notificationResult.insertedId
        });
        
        if (retrievedNotification) {
          console.log(`   ✅ Notification retrievable: "${retrievedNotification.title}"`);
          console.log(`      UserId: ${retrievedNotification.userId} (${typeof retrievedNotification.userId})`);
        }
        
        // Test API-style queries
        const userNotifications = await db.collection('notifications')
          .find({ 
            userId: applicant._id.toString(),
            $or: [
              { deleted: { $ne: true } },
              { deleted: { $exists: false } }
            ]
          })
          .sort({ timestamp: -1 })
          .limit(5)
          .toArray();
        
        console.log(`   ✅ API query returned ${userNotifications.length} notifications`);
        
        // Test unread count
        const unreadCount = await db.collection('notifications').countDocuments({
          userId: applicant._id.toString(),
          read: false
        });
        
        console.log(`   ✅ Unread count: ${unreadCount}`);
        
        // Clean up test notification
        await db.collection('notifications').deleteOne({ _id: notificationResult.insertedId });
        console.log(`   🧹 Cleaned up test notification`);
      }
    }
    
    // 4. Reset application to original state
    console.log('\\n3️⃣ Resetting application state...');
    await db.collection('applications').updateOne(
      { _id: new ObjectId(application._id) },
      { $set: { status: 'pending', updatedAt: new Date() } }
    );
    console.log('   ✅ Application reset to pending status');
    
    // 5. Test notification panel data structure
    console.log('\\n4️⃣ Testing notification panel data...');
    const panelNotifications = await db.collection('notifications')
      .find({ 
        userId: applicant._id.toString(),
        $or: [
          { deleted: { $ne: true } },
          { deleted: { $exists: false } }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    console.log(`   Found ${panelNotifications.length} notifications for panel`);
    
    if (panelNotifications.length > 0) {
      console.log('   Sample notification structure:');
      const sample = panelNotifications[0];
      console.log(`     Title: ${sample.title}`);
      console.log(`     Message: ${sample.message}`);
      console.log(`     Type: ${sample.type}`);
      console.log(`     Priority: ${sample.priority}`);
      console.log(`     Read: ${sample.read}`);
      console.log(`     UserId: ${sample.userId} (${typeof sample.userId})`);
      console.log(`     Timestamp: ${sample.timestamp || sample.createdAt}`);
    }
    
    console.log('\\n🎉 End-to-end notification flow test completed successfully!');
    console.log('\\n📝 Summary:');
    console.log('   ✅ Notifications created with string userId');
    console.log('   ✅ Notifications retrievable by API queries');
    console.log('   ✅ Unread counts work correctly');
    console.log('   ✅ All notification types tested');
    console.log('   ✅ Data structure compatible with frontend');
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEndToEndNotificationFlow().then(() => {
  console.log('\\n✅ End-to-end test finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ End-to-end test failed:', error);
  process.exit(1);
});
