// Test script to create a sample notification and test the system
const { MongoClient, ObjectId } = require('mongodb');

async function testNotifications() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('x-ceed-db');

    // Get a test user ID (we'll use the first user we find)
    const testUser = await db.collection('users').findOne({});
    if (!testUser) {
      console.log('No users found in database');
      return;
    }

    console.log('Found test user:', testUser.email);

    // Create a test notification
    const testNotification = {
      userId: testUser._id,
      type: 'interview_scheduled',
      title: 'Test Interview Scheduled',
      message: 'This is a test notification to verify the notification system is working properly.',
      company: 'Test Company',
      position: 'Test Position',
      timestamp: new Date(),
      read: false,
      priority: 'high',
      actionRequired: true,
      interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
    };

    const result = await db.collection('notifications').insertOne(testNotification);
    console.log('Created test notification with ID:', result.insertedId);

    // Check how many unread notifications this user has
    const unreadCount = await db.collection('notifications').countDocuments({
      userId: testUser._id,
      read: false
    });
    console.log('User has', unreadCount, 'unread notifications');

    // List all notifications for this user
    const notifications = await db.collection('notifications')
      .find({ userId: testUser._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();
    
    console.log('Recent notifications for user:');
    notifications.forEach(notif => {
      console.log(`- ${notif.title} (${notif.read ? 'read' : 'unread'}) - ${notif.timestamp}`);
    });

    await client.close();
  } catch (error) {
    console.error('Error testing notifications:', error);
  }
}

testNotifications();
