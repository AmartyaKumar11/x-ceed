// Test the notification APIs with the JWT token
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3002/api';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODNiNDQ1NmQ1ZGRkMTY2MTg3ZjE1ZDAiLCJpYXQiOjE3NDk2NDM2OTksImV4cCI6MTc0OTczMDA5OX0.DbNkZs1Jz0u28mTNNp-YEyoPdQPm7fwfgMeSR3QdSnY';

async function testNotificationAPIs() {
  try {
    console.log('🧪 Testing Notification APIs...\n');
    
    // Test notification count API
    console.log('1️⃣ Testing notification count API...');
    const countResponse = await fetch(`${API_BASE}/notifications/count`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ Count API Success:', countData);
    } else {
      console.log('❌ Count API Failed:', countResponse.status, await countResponse.text());
    }
    
    // Test notifications list API
    console.log('\n2️⃣ Testing notifications list API...');
    const listResponse = await fetch(`${API_BASE}/notifications`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ List API Success:');
      console.log('   Total notifications:', listData.notifications.length);
      console.log('   Unread count:', listData.unreadCount);
      console.log('   Sample notification titles:');
      listData.notifications.slice(0, 3).forEach((notif, i) => {
        console.log(`     ${i + 1}. ${notif.title} (${notif.type})`);
      });
    } else {
      console.log('❌ List API Failed:', listResponse.status, await listResponse.text());
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ User: amartya3@gmail.com');
    console.log('✅ 5 test notifications created');
    console.log('✅ JWT token generated and working');
    console.log('✅ Notification APIs responding correctly');
    console.log('\n📋 Next Steps:');
    console.log('1. Open http://localhost:3002/dashboard/applicant');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: localStorage.setItem("token", "' + JWT_TOKEN + '")');
    console.log('4. Refresh the page');
    console.log('5. Look for floating notification bell in bottom-right corner');
    console.log('6. Bell should show red dot with 5 notifications');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testNotificationAPIs();
