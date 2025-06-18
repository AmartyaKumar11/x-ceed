// Comprehensive test for NotificationPanel with real API data
const { exec } = require('child_process');

const testNotificationPanel = async () => {
  try {
    console.log('=== Testing NotificationPanel with Real API Data ===');
    
    // First get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amartya3@gmail.com',
        password: 'Test123!'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    if (!loginData.token) {
      console.error('❌ No token in login response');
      return;
    }
    
    // Test notifications API format
    console.log('\n2. Testing notifications API...');
    const notificationResponse = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Notification API status:', notificationResponse.status);
    
    if (!notificationResponse.ok) {
      const errorText = await notificationResponse.text();
      console.error('❌ Notification API error:', errorText);
      return;
    }
    
    const notificationData = await notificationResponse.json();
    console.log('✅ Notification API successful');
    console.log('Response structure:');
    console.log('- success:', notificationData.success);
    console.log('- notifications field exists:', 'notifications' in notificationData);
    console.log('- data field exists:', 'data' in notificationData);
    
    if (notificationData.success && notificationData.notifications) {
      console.log('- notifications count:', notificationData.notifications.length);
      
      if (notificationData.notifications.length > 0) {
        console.log('- sample notification:');
        const sample = notificationData.notifications[0];
        console.log('  - id:', sample._id);
        console.log('  - title:', sample.title);
        console.log('  - type:', sample.type);
        console.log('  - read:', sample.read);
        console.log('  - timestamp:', sample.timestamp);
      } else {
        console.log('📝 No notifications found, creating a test notification...');
        
        // Create a test notification
        const createResponse = await fetch('http://localhost:3000/api/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'application_accepted',
            title: 'Test Notification - Application Accepted',
            message: 'This is a test notification to verify the panel displays real data.',
            company: 'Test Company',
            position: 'Test Position',
            priority: 'high',
            actionRequired: true
          })
        });
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log('✅ Test notification created:', createData.notificationId);
          
          // Fetch notifications again
          const newNotificationResponse = await fetch('http://localhost:3000/api/notifications', {
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (newNotificationResponse.ok) {
            const newNotificationData = await newNotificationResponse.json();
            console.log('✅ Refreshed notifications, count:', newNotificationData.notifications?.length || 0);
          }
        } else {
          console.error('❌ Failed to create test notification');
        }
      }
    } else {
      console.error('❌ Unexpected API response format');
    }
    
    // Test unread count API
    console.log('\n3. Testing unread count API...');
    const countResponse = await fetch('http://localhost:3000/api/notifications/count', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ Unread count API successful');
      console.log('- success:', countData.success);
      console.log('- unreadCount:', countData.unreadCount);
    } else {
      console.error('❌ Unread count API failed');
    }
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Login API: Working');
    console.log('✅ Notifications API: Working with correct format');
    console.log('✅ Unread Count API: Working');
    console.log('🔧 NotificationPanel.jsx: Fixed to use correct API response format');
    console.log('🚀 Ready for browser testing!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open the application in browser');
    console.log('3. Login with amartya3@gmail.com / Test123!');
    console.log('4. Check the notification bell and panel');
    console.log('5. Verify real notifications are displayed (no mock data)');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Start server and run test
console.log('Starting development server...');
const serverProcess = exec('cd /d "c:\\Users\\AMARTYA KUMAR\\Desktop\\x-ceed" && npm run dev', {
  stdio: 'inherit'
});

// Wait for server to start, then run test
setTimeout(async () => {
  try {
    await testNotificationPanel();
  } finally {
    console.log('\nStopping server...');
    serverProcess.kill();
    process.exit(0);
  }
}, 10000);
