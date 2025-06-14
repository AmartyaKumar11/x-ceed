// Test current API response format
const { exec } = require('child_process');

const testApiResponse = async () => {
  try {
    console.log('Testing current API response format...');
    
    // First get a token
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
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('No token in login response');
      return;
    }
    
    // Now test notifications API
    console.log('\nTesting notifications API...');
    const notificationResponse = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Notification API status:', notificationResponse.status);
    
    if (notificationResponse.ok) {
      const notificationData = await notificationResponse.json();
      console.log('Notification API response structure:');
      console.log('- Has success field:', 'success' in notificationData);
      console.log('- Has data field:', 'data' in notificationData);
      console.log('- Has notifications field:', 'notifications' in notificationData);
      console.log('- Success value:', notificationData.success);
      console.log('- Notifications count:', notificationData.notifications ? notificationData.notifications.length : 'N/A');
      
      if (notificationData.notifications && notificationData.notifications.length > 0) {
        console.log('- Sample notification:', {
          id: notificationData.notifications[0]._id,
          title: notificationData.notifications[0].title,
          read: notificationData.notifications[0].read
        });
      }
    } else {
      const errorText = await notificationResponse.text();
      console.error('Notification API error:', errorText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Start server and run test
console.log('Starting server...');
const serverProcess = exec('cd /d "c:\\Users\\AMARTYA KUMAR\\Desktop\\x-ceed" && npm run dev', 
  (error, stdout, stderr) => {
    if (error) {
      console.error('Server error:', error);
    }
  }
);

// Wait for server to start, then run test
setTimeout(async () => {
  await testApiResponse();
  serverProcess.kill();
  process.exit(0);
}, 8000);
