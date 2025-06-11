// Script to create user and send test notifications to amartya3@gmail.com
const { MongoClient, ObjectId } = require('mongodb');

async function setupUserAndNotifications() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🔍 Checking for user: amartya3@gmail.com');
    
    // Check if user exists
    let user = await db.collection('users').findOne({ email: 'amartya3@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found. Creating user: amartya3@gmail.com');
      
      // Create the user
      const newUser = {
        email: 'amartya3@gmail.com',
        password: 'hashedpassword123', // In real app, this would be properly hashed
        userType: 'applicant',
        firstName: 'Amartya',
        lastName: 'Kumar',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userResult = await db.collection('users').insertOne(newUser);
      user = { ...newUser, _id: userResult.insertedId };
      console.log('✅ Created user:', userResult.insertedId);
    } else {
      console.log('✅ Found existing user:', user._id);
    }
    
    console.log('👤 User email:', user.email);
    console.log('👤 User ID:', user._id.toString());
    
    // Clear existing notifications for this user to start fresh
    const deleteResult = await db.collection('notifications').deleteMany({ userId: user._id });
    console.log('🗑️ Cleared', deleteResult.deletedCount, 'existing notifications');
    
    // Create test notifications
    const testNotifications = [
      {
        userId: user._id,
        type: 'application_accepted',
        title: '🎉 Application Accepted!',
        message: 'Congratulations! Your application for Senior Frontend Developer at TechCorp has been accepted. You will hear from the recruiter soon with next steps.',
        company: 'TechCorp',
        position: 'Senior Frontend Developer',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        read: false,
        priority: 'high',
        actionRequired: true
      },
      {
        userId: user._id,
        type: 'interview_scheduled',
        title: '📅 Interview Scheduled',
        message: 'Great news! You have been selected for an interview for the Full Stack Developer position at DataFlow Inc. Your interview is scheduled for tomorrow at 2:00 PM.',
        company: 'DataFlow Inc.',
        position: 'Full Stack Developer',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        priority: 'urgent',
        actionRequired: true,
        interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
      },
      {
        userId: user._id,
        type: 'application_rejected',
        title: 'Application Update',
        message: 'Thank you for your interest in the UI/UX Designer position at CreativeStudio. After careful consideration, we have decided to move forward with other candidates.',
        company: 'CreativeStudio',
        position: 'UI/UX Designer',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        priority: 'medium',
        actionRequired: false
      },
      {
        userId: user._id,
        type: 'profile_view',
        title: 'Profile Viewed',
        message: 'A recruiter from InnovateTech viewed your profile and showed interest in your background.',
        company: 'InnovateTech',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        read: false,
        priority: 'medium',
        actionRequired: false
      },
      {
        userId: user._id,
        type: 'application_accepted',
        title: '🚀 Another Great News!',
        message: 'Your application for React Developer at StartupXYZ has been accepted! They are impressed with your portfolio and want to schedule a final interview.',
        company: 'StartupXYZ',
        position: 'React Developer',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        priority: 'high',
        actionRequired: true
      }
    ];
    
    console.log('📨 Creating test notifications...');
    
    for (const notification of testNotifications) {
      const result = await db.collection('notifications').insertOne(notification);
      console.log('✅ Created', notification.type, 'notification:', result.insertedId);
      console.log('   Title:', notification.title);
    }
    
    // Count notifications
    const totalCount = await db.collection('notifications').countDocuments({ userId: user._id });
    const unreadCount = await db.collection('notifications').countDocuments({ userId: user._id, read: false });
    
    console.log('\n📊 Final Results:');
    console.log('   Total notifications:', totalCount);
    console.log('   Unread notifications:', unreadCount);
    console.log('\n🎯 Test notifications sent to:', user.email);
    console.log('   User ID for login:', user._id.toString());
    
    // Generate a test JWT token for this user
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key-for-jwt-tokens';
    const token = jwt.sign(
      { userId: user._id.toString() },
      secret,
      { expiresIn: '24h' }
    );
    
    console.log('\n🔑 JWT Token for testing:');
    console.log(token);
    console.log('\n📋 Instructions:');
    console.log('1. Go to http://localhost:3002/dashboard/applicant');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: localStorage.setItem("token", "' + token + '")');
    console.log('4. Refresh the page');
    console.log('5. You should see the notification bell with', unreadCount, 'notifications');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupUserAndNotifications();
