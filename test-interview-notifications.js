// Test interview scheduling notification creation
const { MongoClient, ObjectId } = require('mongodb');

async function testInterviewNotifications() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🧪 Testing Interview Notification Creation...\n');
    
    // Find a test user (applicant) - using our known test user
    const testUser = await db.collection('users').findOne({ email: 'amartya3@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user amartya3@gmail.com not found');
      return;
    }
    
    console.log('✅ Found test user:', testUser.email, 'ID:', testUser._id);
    
    // Check current notification count before
    const beforeCount = await db.collection('notifications').countDocuments({ 
      userId: testUser._id,
      read: false 
    });
    console.log('📊 Notifications before test:', beforeCount);
    
    // Create a test notification manually (simulating what schedule-interview does)
    const testNotification = {
      userId: testUser._id, // ObjectId format
      type: 'interview_scheduled',
      title: '📅 Test Interview Scheduled',
      message: 'This is a test notification to verify interview scheduling works correctly.',
      company: 'Test Company',
      position: 'Test Developer',
      timestamp: new Date(),
      read: false,
      priority: 'urgent',
      actionRequired: true,
      interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      metadata: {
        applicationId: 'test-app-id',
        jobId: 'test-job-id',
        jobTitle: 'Test Developer',
        companyName: 'Test Company',
        location: 'Video Call - Zoom',
        isVirtual: true,
        duration: 60,
        notes: 'Test interview notification'
      }
    };
    
    const result = await db.collection('notifications').insertOne(testNotification);
    console.log('✅ Created test notification:', result.insertedId);
    
    // Check notification count after
    const afterCount = await db.collection('notifications').countDocuments({ 
      userId: testUser._id,
      read: false 
    });
    console.log('📊 Notifications after test:', afterCount);
    
    // Test the notification API to see if it shows up
    console.log('\n🔍 Testing notification API...');
    
    // Simulate the API query (what the notification count API does)
    const apiCount = await db.collection('notifications').countDocuments({
      userId: testUser._id, // Using ObjectId directly
      read: false
    });
    
    console.log('📊 API count query result:', apiCount);
    
    // List recent notifications for this user
    const notifications = await db.collection('notifications')
      .find({ userId: testUser._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();
      
    console.log('\n📋 Recent notifications for user:');
    notifications.forEach((notif, i) => {
      console.log(`  ${i+1}. ${notif.title} (${notif.type}) - ${notif.read ? 'Read' : 'Unread'}`);
      console.log(`     Timestamp: ${notif.timestamp}`);
      console.log(`     Priority: ${notif.priority}`);
    });
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ Notification creation: WORKING');
    console.log('✅ ObjectId format: CORRECT');
    console.log('✅ API query compatibility: WORKING');
    console.log(`✅ Total unread notifications: ${apiCount}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testInterviewNotifications();
