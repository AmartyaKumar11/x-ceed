// Test notification panel with real API data
const BASE_URL = 'http://localhost:3002';

async function testNotificationPanel() {
  console.log('🧪 Testing notification panel with real API...\n');
  
  try {
    // First, let's check the current API response format
    console.log('1️⃣ Testing API response format without auth...');
    
    const testResponse = await fetch(`${BASE_URL}/api/notifications`);
    console.log(`   Response status: ${testResponse.status}`);
    
    if (testResponse.status === 401) {
      console.log('   ✅ Expected 401 - Authentication required');
    } else {
      const testData = await testResponse.text();
      console.log('   Response:', testData);
    }
    
    // Test with mock token to see API structure
    console.log('\n2️⃣ Testing API structure with mock token...');
    
    const mockResponse = await fetch(`${BASE_URL}/api/notifications`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Mock response status: ${mockResponse.status}`);
    const mockData = await mockResponse.text();
    console.log('   Mock response:', mockData);
    
    // Test notification count API
    console.log('\n3️⃣ Testing notification count API...');
    
    const countResponse = await fetch(`${BASE_URL}/api/notifications/count`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Count response status: ${countResponse.status}`);
    const countData = await countResponse.text();
    console.log('   Count response:', countData);
    
    console.log('\n4️⃣ Browser test instructions:');
    console.log('   1. Open: http://localhost:3002/debug-notification-bell.html');
    console.log('   2. Check if localStorage has a token');
    console.log('   3. Test the notification APIs');
    console.log('   4. Check browser console for API responses');
    
    console.log('\n5️⃣ Expected API response format:');
    console.log('   GET /api/notifications should return:');
    console.log('   {');
    console.log('     "success": true,');
    console.log('     "notifications": [...]');
    console.log('   }');
    
    console.log('\n   GET /api/notifications/count should return:');
    console.log('   {');
    console.log('     "success": true,');
    console.log('     "unreadCount": 5,');
    console.log('     "totalCount": 10');
    console.log('   }');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run with dynamic import to avoid module issues
testNotificationPanel().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
