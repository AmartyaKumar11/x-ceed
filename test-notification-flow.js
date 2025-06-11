// Test script to simulate accept/reject notifications
const { MongoClient, ObjectId } = require('mongodb');

async function testNotificationFlow() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🧪 Testing notification flow for accept/reject...\n');
    
    // Get a test user (applicant)
    const applicant = await db.collection('users').findOne({ userType: 'applicant' });
    if (!applicant) {
      console.log('❌ No applicant found. Creating a test applicant...');
      // You would create a test applicant here if needed
      return;
    }
    
    console.log('👤 Test Applicant:', applicant.email);
    
    // Check if there are any jobs
    const job = await db.collection('jobs').findOne({});
    if (!job) {
      console.log('❌ No jobs found. Creating a test job...');
      
      // Create a test job
      const testJob = {
        title: 'Frontend Developer',
        company: 'Test Company Inc.',
        description: 'Test job for notification system',
        requirements: ['React', 'JavaScript'],
        location: 'Remote',
        salary: 75000,
        recruiterId: 'test-recruiter-id',
        createdAt: new Date(),
        status: 'active'
      };
      
      const jobResult = await db.collection('jobs').insertOne(testJob);
      console.log('✅ Created test job:', jobResult.insertedId);
      
      // Use the newly created job
      testJob._id = jobResult.insertedId;
      job = testJob;
    }
    
    console.log('💼 Test Job:', job.title, 'at', job.company);
    
    // Create a test application if none exists
    let application = await db.collection('applications').findOne({
      applicantId: applicant._id.toString(),
      jobId: job._id.toString()
    });
    
    if (!application) {
      console.log('📝 Creating test application...');
      
      const testApplication = {
        applicantId: applicant._id.toString(),
        jobId: job._id.toString(),
        status: 'pending',
        appliedAt: new Date(),
        resumeUrl: 'test-resume.pdf'
      };
      
      const appResult = await db.collection('applications').insertOne(testApplication);
      application = { ...testApplication, _id: appResult.insertedId };
      console.log('✅ Created test application:', appResult.insertedId);
    }
    
    console.log('📋 Test Application ID:', application._id);
    
    // Simulate different status updates
    const statusUpdates = [
      { status: 'reviewing', description: 'Application under review' },
      { status: 'interview', description: 'Interview scheduled' },
      { status: 'accepted', description: 'Application accepted' }
    ];
    
    console.log('\\n🔄 Simulating status updates...');
    
    for (const update of statusUpdates) {
      console.log(`\\n📨 Testing ${update.status} notification...`);
      
      // Simulate the notification creation logic from the API
      let notificationTitle, notificationMessage, notificationType, priority;
      
      switch (update.status) {
        case 'accepted':
          notificationTitle = '🎉 Application Accepted!';
          notificationMessage = `Congratulations! Your application for ${job.title} at ${job.company} has been accepted. You will hear from the recruiter soon with next steps.`;
          notificationType = 'application_accepted';
          priority = 'high';
          break;
          
        case 'rejected':
          notificationTitle = 'Application Update';
          notificationMessage = `Thank you for your interest in the ${job.title} position at ${job.company}. After careful consideration, we have decided to move forward with other candidates.`;
          notificationType = 'application_rejected';
          priority = 'medium';
          break;
          
        case 'interview':
          notificationTitle = '📅 Interview Scheduled';
          notificationMessage = `Great news! You've been selected for an interview for the ${job.title} position at ${job.company}. The recruiter will contact you soon with interview details.`;
          notificationType = 'interview_scheduled';
          priority = 'urgent';
          break;
          
        case 'reviewing':
          notificationTitle = '👀 Application Under Review';
          notificationMessage = `Your application for ${job.title} at ${job.company} is now being reviewed by our recruitment team.`;
          notificationType = 'application_status';
          priority = 'medium';
          break;
      }
      
      // Create the notification
      const notification = {
        userId: applicant._id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        company: job.company,
        position: job.title,
        timestamp: new Date(),
        read: false,
        priority: priority,
        actionRequired: update.status === 'interview' || update.status === 'accepted',
        metadata: {
          jobId: job._id.toString(),
          jobTitle: job.title,
          company: job.company,
          applicationId: application._id.toString(),
          newStatus: update.status
        }
      };
      
      const result = await db.collection('notifications').insertOne(notification);
      console.log(`✅ Created ${update.status} notification:`, result.insertedId);
      console.log(`   Title: ${notificationTitle}`);
      console.log(`   Priority: ${priority}`);
    }
    
    // Check final notification count
    const totalNotifications = await db.collection('notifications').countDocuments({
      userId: applicant._id
    });
    
    const unreadNotifications = await db.collection('notifications').countDocuments({
      userId: applicant._id,
      read: false
    });
    
    console.log(`\\n📊 Final Results:`);
    console.log(`   Total notifications: ${totalNotifications}`);
    console.log(`   Unread notifications: ${unreadNotifications}`);
    console.log(`\\n🎯 Test Complete! Log in as the applicant to see the notifications.`);
    console.log(`   Applicant email: ${applicant.email}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testNotificationFlow();
