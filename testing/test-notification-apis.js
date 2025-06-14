// Test notification API endpoints
const testNotificationAPIs = async () => {
  console.log('🧪 Testing Notification APIs...\n');
  
  const baseUrl = 'http://localhost:3000'; // Adjust port if different
  const token = 'test-token'; // You'll need to replace this with a real token
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Get notification count
    console.log('📊 Testing GET /api/notifications/count');
    const countResponse = await fetch(`${baseUrl}/api/notifications/count`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${countResponse.status}`);
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('Response:', countData);
    } else {
      console.log('Error:', await countResponse.text());
    }
    
    console.log(''); // Empty line
    
    // Test 2: Get all notifications
    console.log('📝 Testing GET /api/notifications');
    const notificationsResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${notificationsResponse.status}`);
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('Response:', {
        success: notificationsData.success,
        count: notificationsData.notifications?.length || 0
      });
    } else {
      console.log('Error:', await notificationsResponse.text());
    }
    
    console.log(''); // Empty line
    
    // Test 3: Mark all as read
    console.log('✅ Testing PATCH /api/notifications/mark-all-read');
    const markReadResponse = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
      method: 'PATCH',
      headers
    });
    
    console.log(`Status: ${markReadResponse.status}`);
    if (markReadResponse.ok) {
      const markReadData = await markReadResponse.json();
      console.log('Response:', markReadData);
    } else {
      console.log('Error:', await markReadResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure the development server is running with: npm run dev');
  }
};

// Instructions for manual testing
console.log(`
🔧 NOTIFICATION API TEST INSTRUCTIONS:

1. Start your development server: npm run dev
2. Get a valid JWT token by logging into your app
3. Replace the 'test-token' in this script with your real token
4. Run this script: node test-notification-apis.js

OR test manually in browser:
1. Open browser dev tools
2. Go to your application
3. Login to get a token
4. In console, run:
   fetch('/api/notifications/count', {
     headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(console.log)

Expected results:
- /api/notifications/count should return: { success: true, unreadCount: X, totalCount: Y }
- /api/notifications should return: { success: true, notifications: [...] }
- /api/notifications/mark-all-read should return: { success: true, modifiedCount: X }
`);

// Uncomment the line below to run the test (after setting a real token)
// testNotificationAPIs();
