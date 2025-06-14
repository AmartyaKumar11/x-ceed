// Test notification creation directly
import clientPromise from './src/lib/mongodb.js';

async function createTestNotification() {
  console.log('🧪 Creating test notification...\n');
  
  try {
    const client = await clientPromise;
    const db = client.db('x-ceed-db');
    
    // Get a test user
    const testUser = await db.collection('users').findOne({ 
      email: 'kumaramartya11@gmail.com' 
    });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`Creating notification for user: ${testUser.email}`);
    console.log(`User ID: ${testUser._id} (${typeof testUser._id})`);
    console.log(`User ID string: ${testUser._id.toString()} (${typeof testUser._id.toString()})`);
    
    // Create a test notification with string userId
    const testNotification = {
      userId: testUser._id.toString(), // String format to match JWT
      type: 'test_notification',
      title: '🧪 Live Test Notification',
      message: 'This is a test notification created at ' + new Date().toLocaleString(),
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      metadata: {
        testId: Date.now(),
        source: 'debug_script'
      }
    };
    
    console.log('Creating notification:', JSON.stringify(testNotification, null, 2));
    
    const result = await db.collection('notifications').insertOne(testNotification);
    
    console.log(`✅ Test notification created with ID: ${result.insertedId}`);
    
    // Verify it can be retrieved
    const retrieved = await db.collection('notifications').findOne({
      _id: result.insertedId
    });
    
    console.log('✅ Notification retrievable:', !!retrieved);
    console.log('   UserId type:', typeof retrieved.userId);
    console.log('   Title:', retrieved.title);
    
    // Check how many notifications this user has now
    const userNotifications = await db.collection('notifications')
      .find({ userId: testUser._id.toString() })
      .toArray();
    
    console.log(`✅ User now has ${userNotifications.length} total notifications`);
    
    const unreadCount = await db.collection('notifications')
      .countDocuments({ 
        userId: testUser._id.toString(),
        read: false 
      });
    
    console.log(`✅ User has ${unreadCount} unread notifications`);
    
    console.log('\n📱 Now check the notification bell in the browser!');
    console.log('   The notification should appear if the user is logged in.');
    
    // Don't delete the notification so we can see it in the browser
    // await db.collection('notifications').deleteOne({ _id: result.insertedId });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestNotification().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
