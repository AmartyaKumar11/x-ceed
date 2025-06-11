// Clean up mock/test notifications and keep only actual ones
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupMockNotifications() {
  console.log('🧹 CLEANING UP MOCK NOTIFICATIONS');
  console.log('==================================\n');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Get test user
    const testUser = await db.collection('users').findOne({ email: 'amartya3@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`👤 Cleaning notifications for: ${testUser.email}`);
    console.log(`🆔 User ID: ${testUser._id}\n`);
    
    // Step 1: Count all notifications before cleanup
    const totalBefore = await db.collection('notifications').countDocuments({
      userId: testUser._id
    });
    
    console.log(`📊 Total notifications before cleanup: ${totalBefore}`);
    
    // Step 2: Identify mock/test notifications to remove
    console.log('\n🔍 Identifying mock/test notifications...');
    
    const mockNotifications = await db.collection('notifications').find({
      userId: testUser._id,
      $or: [
        // Test notifications with specific test content
        { title: { $regex: /New Interview Scheduled by Recruiter/i } },
        { title: { $regex: /Test Interview/i } },
        { company: 'TechCorp' },
        { company: 'StartupXYZ' },
        { company: 'CreativeStudio' },
        { company: 'DataFlow Inc.' },
        { company: 'TechFlow Inc.' },
        { company: 'Test Company' },
        { position: 'Senior Developer' },
        { position: 'React Developer' },
        { position: 'Test Developer' },
        { position: 'UI/UX Designer' },
        { position: 'Full Stack Developer' },
        { message: { $regex: /tomorrow at 3:00 PM/i } },
        { message: { $regex: /Video Call - Teams/i } },
        { message: { $regex: /StartupXYZ/i } },
        { message: { $regex: /CreativeStudio/i } },
        { message: { $regex: /TechCorp/i } },
        // Profile view notifications (these are typically test data)
        { type: 'profile_view' },
        // Test interview invitations
        { type: 'interview_invitation', company: { $in: ['TechCorp', 'Test Company', null] } }
      ]
    }).toArray();
    
    console.log(`🎭 Found ${mockNotifications.length} mock/test notifications:`);
    
    // Show what will be deleted
    mockNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Company: ${notif.company || 'N/A'}`);
      console.log(`   Position: ${notif.position || 'N/A'}`);
      console.log(`   Date: ${new Date(notif.timestamp).toLocaleDateString()}`);
      console.log('');
    });
    
    // Step 3: Identify actual/real notifications to keep
    console.log('🎯 Identifying REAL notifications to keep...');
    
    const realNotifications = await db.collection('notifications').find({
      userId: testUser._id,
      $and: [
        // NOT mock companies
        { company: { $nin: ['TechCorp', 'StartupXYZ', 'CreativeStudio', 'DataFlow Inc.', 'TechFlow Inc.', 'Test Company', null] } },
        // NOT test positions
        { position: { $nin: ['Senior Developer', 'React Developer', 'Test Developer', 'UI/UX Designer', 'Full Stack Developer'] } },
        // NOT test titles
        { title: { $not: { $regex: /New Interview Scheduled by Recruiter|Test Interview/i } } },
        // NOT test messages
        { message: { $not: { $regex: /tomorrow at 3:00 PM|Video Call - Teams|StartupXYZ|CreativeStudio|TechCorp/i } } },
        // NOT profile views
        { type: { $ne: 'profile_view' } }
      ]
    }).toArray();
    
    console.log(`✅ Found ${realNotifications.length} REAL notifications to keep:`);
    
    if (realNotifications.length > 0) {
      realNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Company: ${notif.company || 'N/A'}`);
        console.log(`   Position: ${notif.position || 'N/A'}`);
        console.log(`   Date: ${new Date(notif.timestamp).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('   (No real notifications found - all appear to be test data)');
    }
    
    // Step 4: Confirm deletion
    console.log('\n⚠️  DELETION CONFIRMATION');
    console.log('=========================');
    console.log(`📊 Total notifications: ${totalBefore}`);
    console.log(`🗑️  Will DELETE: ${mockNotifications.length} mock/test notifications`);
    console.log(`✅ Will KEEP: ${realNotifications.length} real notifications`);
    
    if (mockNotifications.length === 0) {
      console.log('\n🎉 No mock notifications found to delete!');
      console.log('All notifications appear to be real.');
      return;
    }
    
    // Step 5: Perform deletion
    console.log('\n🗑️  Deleting mock/test notifications...');
    
    const deleteResult = await db.collection('notifications').deleteMany({
      userId: testUser._id,
      $or: [
        { title: { $regex: /New Interview Scheduled by Recruiter/i } },
        { title: { $regex: /Test Interview/i } },
        { company: 'TechCorp' },
        { company: 'StartupXYZ' },
        { company: 'CreativeStudio' },
        { company: 'DataFlow Inc.' },
        { company: 'TechFlow Inc.' },
        { company: 'Test Company' },
        { position: 'Senior Developer' },
        { position: 'React Developer' },
        { position: 'Test Developer' },
        { position: 'UI/UX Designer' },
        { position: 'Full Stack Developer' },
        { message: { $regex: /tomorrow at 3:00 PM/i } },
        { message: { $regex: /Video Call - Teams/i } },
        { message: { $regex: /StartupXYZ/i } },
        { message: { $regex: /CreativeStudio/i } },
        { message: { $regex: /TechCorp/i } },
        { type: 'profile_view' },
        { type: 'interview_invitation', company: { $in: ['TechCorp', 'Test Company', null] } }
      ]
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} mock notifications`);
    
    // Step 6: Verify cleanup
    const totalAfter = await db.collection('notifications').countDocuments({
      userId: testUser._id
    });
    
    console.log('\n📊 CLEANUP RESULTS');
    console.log('==================');
    console.log(`📊 Notifications before: ${totalBefore}`);
    console.log(`🗑️  Notifications deleted: ${deleteResult.deletedCount}`);
    console.log(`✅ Notifications remaining: ${totalAfter}`);
    console.log(`✅ Cleanup successful: ${totalBefore - deleteResult.deletedCount === totalAfter ? 'YES' : 'NO'}`);
    
    // Step 7: Show remaining notifications
    if (totalAfter > 0) {
      console.log('\n📋 REMAINING NOTIFICATIONS');
      console.log('==========================');
      
      const remaining = await db.collection('notifications')
        .find({ userId: testUser._id })
        .sort({ timestamp: -1 })
        .toArray();
      
      remaining.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Priority: ${notif.priority}`);
        console.log(`   Company: ${notif.company || 'N/A'}`);
        console.log(`   Position: ${notif.position || 'N/A'}`);
        console.log(`   Read: ${notif.read ? 'Yes' : 'No'}`);
        console.log(`   Date: ${new Date(notif.timestamp).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('\n📋 No notifications remaining (all were test data)');
    }
    
    console.log('\n🎉 CLEANUP COMPLETE!');
    console.log('The notification system now contains only real, actual notifications.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the cleanup
cleanupMockNotifications().catch(console.error);
