// Migration script to convert ObjectId userId to string userId in notifications
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function migrateNotificationUserIds() {
  console.log('🔄 Starting notification userId migration...\n');
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');
    
    // Find all notifications with ObjectId userId
    console.log('1️⃣ Finding notifications with ObjectId userId...');
    const notificationsWithObjectId = await db.collection('notifications')
      .find({ userId: { $type: 'objectId' } })
      .toArray();
    
    console.log(`   Found ${notificationsWithObjectId.length} notifications to migrate`);
    
    if (notificationsWithObjectId.length === 0) {
      console.log('✅ No notifications need migration');
      return;
    }
    
    // Show a few examples
    console.log('\n   Examples of notifications to migrate:');
    notificationsWithObjectId.slice(0, 3).forEach((notif, i) => {
      console.log(`     ${i + 1}. "${notif.title}" - userId: ${notif.userId} (${typeof notif.userId})`);
    });
    
    // Migrate each notification
    console.log('\n2️⃣ Migrating notifications...');
    let migratedCount = 0;
    
    for (const notification of notificationsWithObjectId) {
      try {
        const stringUserId = notification.userId.toString();
        
        const result = await db.collection('notifications').updateOne(
          { _id: notification._id },
          { $set: { userId: stringUserId } }
        );
        
        if (result.modifiedCount > 0) {
          migratedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to migrate notification ${notification._id}:`, error);
      }
    }
    
    console.log(`   ✅ Successfully migrated ${migratedCount} notifications`);
    
    // Verify the migration
    console.log('\n3️⃣ Verifying migration...');
    const remainingObjectIdNotifications = await db.collection('notifications')
      .countDocuments({ userId: { $type: 'objectId' } });
    
    const stringUserIdNotifications = await db.collection('notifications')
      .countDocuments({ userId: { $type: 'string' } });
    
    console.log(`   Remaining ObjectId userId notifications: ${remainingObjectIdNotifications}`);
    console.log(`   String userId notifications: ${stringUserIdNotifications}`);
    
    if (remainingObjectIdNotifications === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log(`⚠️  ${remainingObjectIdNotifications} notifications still have ObjectId userId`);
    }
    
    console.log('\n🎉 Migration finished!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the migration
migrateNotificationUserIds().then(() => {
  console.log('\n✅ Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});
