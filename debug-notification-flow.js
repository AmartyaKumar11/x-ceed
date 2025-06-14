// Debug script to test the complete notification flow
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function debugNotificationFlow() {
  console.log('🔍 Starting comprehensive notification flow debug...\n');
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');
    
    // 1. Check users - we need both applicant and recruiter
    console.log('1️⃣ Checking users...');
    const applicants = await db.collection('users').find({ userType: 'applicant' }).limit(3).toArray();
    const recruiters = await db.collection('users').find({ userType: 'recruiter' }).limit(3).toArray();
    
    console.log(`   Found ${applicants.length} applicants, ${recruiters.length} recruiters`);
    
    if (applicants.length === 0 || recruiters.length === 0) {
      console.log('❌ Need both applicants and recruiters for testing');
      return;
    }
    
    const testApplicant = applicants[0];
    const testRecruiter = recruiters[0];
    
    console.log(`   Test applicant: ${testApplicant.email} (ID: ${testApplicant._id})`);
    console.log(`   Test recruiter: ${testRecruiter.email} (ID: ${testRecruiter._id})`);
    
    // 2. Check jobs
    console.log('\n2️⃣ Checking jobs...');
    const jobs = await db.collection('jobs').find({ 
      recruiterId: testRecruiter._id.toString(),
      status: 'active' 
    }).limit(3).toArray();
    
    console.log(`   Found ${jobs.length} active jobs by test recruiter`);
    
    if (jobs.length === 0) {
      console.log('❌ No active jobs found for test recruiter');
      return;
    }
    
    const testJob = jobs[0];
    console.log(`   Test job: ${testJob.title} (ID: ${testJob._id})`);
    
    // 3. Check applications
    console.log('\n3️⃣ Checking applications...');
    const applications = await db.collection('applications').find({
      applicantId: testApplicant._id.toString(),
      jobId: testJob._id.toString()
    }).toArray();
    
    let testApplication;
    
    if (applications.length === 0) {
      console.log('   No existing application found, creating one...');
      
      // Create a test application
      const newApplication = {
        jobId: testJob._id.toString(),
        applicantId: testApplicant._id.toString(),
        resumePath: '/uploads/test-resume.pdf',
        status: 'pending',
        appliedAt: new Date(),
        updatedAt: new Date(),
        applicantDetails: {
          name: `${testApplicant.firstName} ${testApplicant.lastName}`,
          email: testApplicant.email,
          phone: testApplicant.contact?.phone || ''
        },
        jobDetails: {
          title: testJob.title,
          company: testJob.company,
          location: testJob.location
        }
      };
      
      const result = await db.collection('applications').insertOne(newApplication);
      testApplication = await db.collection('applications').findOne({ _id: result.insertedId });
      console.log(`   ✅ Created test application with ID: ${result.insertedId}`);
    } else {
      testApplication = applications[0];
      console.log(`   Found existing application: ${testApplication._id}`);
    }
    
    console.log(`   Application status: ${testApplication.status}`);
    
    // 4. Test notification creation by updating application status
    console.log('\n4️⃣ Testing notification creation...');
    
    const newStatus = testApplication.status === 'pending' ? 'accepted' : 'pending';
    console.log(`   Updating status from '${testApplication.status}' to '${newStatus}'`);
    
    // Update application status
    const updateResult = await db.collection('applications').updateOne(
      { _id: new ObjectId(testApplication._id) },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`   Update result - Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
    
    if (updateResult.modifiedCount > 0) {
      console.log('   ✅ Application status updated successfully');
      
      // Create notification manually (simulating what the API should do)
      const notification = {
        userId: new ObjectId(testApplication.applicantId), // Use ObjectId
        type: 'application_status_update',
        title: `Application ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your application for "${testJob.title}" has been ${newStatus}.`,
        company: testJob.company,
        position: testJob.title,
        timestamp: new Date(),
        read: false,
        priority: newStatus === 'accepted' ? 'high' : 'medium',
        actionRequired: newStatus === 'interview' || newStatus === 'accepted',
        metadata: {
          jobId: testJob._id.toString(),
          jobTitle: testJob.title,
          company: testJob.company,
          applicationId: testApplication._id.toString(),
          newStatus: newStatus
        }
      };
      
      const notificationResult = await db.collection('notifications').insertOne(notification);
      console.log(`   ✅ Notification created with ID: ${notificationResult.insertedId}`);
      
      // 5. Test notification retrieval
      console.log('\n5️⃣ Testing notification retrieval...');
      
      // Test with ObjectId
      const notificationsWithObjectId = await db.collection('notifications')
        .find({ 
          userId: new ObjectId(testApplication.applicantId),
          $or: [
            { deleted: { $ne: true } },
            { deleted: { $exists: false } }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      
      console.log(`   Found ${notificationsWithObjectId.length} notifications with ObjectId userId`);
      
      // Test with string
      const notificationsWithString = await db.collection('notifications')
        .find({ 
          userId: testApplication.applicantId,
          $or: [
            { deleted: { $ne: true } },
            { deleted: { $exists: false } }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      
      console.log(`   Found ${notificationsWithString.length} notifications with string userId`);
      
      // Show recent notifications
      const allNotifications = [...notificationsWithObjectId, ...notificationsWithString];
      const uniqueNotifications = allNotifications.filter((notification, index, self) =>
        index === self.findIndex(n => n._id.toString() === notification._id.toString())
      );
      
      console.log(`   Total unique notifications: ${uniqueNotifications.length}`);
      
      if (uniqueNotifications.length > 0) {
        console.log('\n   Recent notifications:');
        uniqueNotifications.slice(0, 3).forEach((notif, i) => {
          console.log(`     ${i + 1}. "${notif.title}" - ${notif.read ? 'read' : 'UNREAD'}`);
          console.log(`        Created: ${notif.timestamp || notif.createdAt}`);
          console.log(`        UserId type: ${typeof notif.userId} (${notif.userId})`);
        });
      }
      
      // 6. Test unread count
      console.log('\n6️⃣ Testing unread count...');
      
      const unreadWithObjectId = await db.collection('notifications').countDocuments({
        userId: new ObjectId(testApplication.applicantId),
        read: false,
        $or: [
          { deleted: { $ne: true } },
          { deleted: { $exists: false } }
        ]
      });
      
      const unreadWithString = await db.collection('notifications').countDocuments({
        userId: testApplication.applicantId,
        read: false,
        $or: [
          { deleted: { $ne: true } },
          { deleted: { $exists: false } }
        ]
      });
      
      console.log(`   Unread count with ObjectId: ${unreadWithObjectId}`);
      console.log(`   Unread count with string: ${unreadWithString}`);
      
      // Clean up test notification
      await db.collection('notifications').deleteOne({
        _id: notificationResult.insertedId
      });
      console.log('   🧹 Cleaned up test notification');
      
    } else {
      console.log('   ❌ Failed to update application status');
    }
    
    // Revert application status
    await db.collection('applications').updateOne(
      { _id: new ObjectId(testApplication._id) },
      { 
        $set: { 
          status: testApplication.status,
          updatedAt: testApplication.updatedAt
        }
      }
    );
    console.log('   🔄 Reverted application status');
    
    console.log('\n🎉 Notification flow debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugNotificationFlow().then(() => {
  console.log('\n✅ Debug script finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
