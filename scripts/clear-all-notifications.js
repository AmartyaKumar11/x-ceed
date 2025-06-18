// Clear all notifications from the database
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';

async function clearAllNotifications() {
  console.log('🗑️ Clearing all notifications from database...\n');
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('x-ceed-db');
    const notificationsCollection = db.collection('notifications');
    
    // First, let's see how many notifications exist
    const totalCount = await notificationsCollection.countDocuments();
    console.log(`📊 Found ${totalCount} total notifications`);
    
    if (totalCount === 0) {
      console.log('✨ No notifications found - already clean!');
      return;
    }
    
    // Show breakdown by user
    const userBreakdown = await notificationsCollection.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]).toArray();
    
    console.log('📋 Notifications by user:');
    userBreakdown.forEach(user => {
      console.log(`   User ${user._id}: ${user.count} total (${user.unreadCount} unread)`);
    });
    
    // Ask for confirmation
    console.log('\n⚠️  This will DELETE ALL notifications permanently!');
    console.log('🔄 Proceeding in 3 seconds... (Ctrl+C to cancel)');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete all notifications
    const deleteResult = await notificationsCollection.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} notifications`);
    console.log('🎉 Notification panel is now completely clean!');
    
    // Verify deletion
    const remainingCount = await notificationsCollection.countDocuments();
    console.log(`✨ Remaining notifications: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('\n✅ SUCCESS: All notifications have been cleared!');
      console.log('📱 The notification panel will now be empty');
      console.log('🔔 Notification count should show 0');
    } else {
      console.log(`\n⚠️  Warning: ${remainingCount} notifications still remain`);
    }
    
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the cleanup
clearAllNotifications().then(() => {
  console.log('\n🏁 Cleanup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});
