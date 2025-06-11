// Simple test for notifications API
const fetch = require('node-fetch');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODNiNDQ1NmQ1ZGRkMTY2MTg3ZjE1ZDAiLCJpYXQiOjE3NDk2NDM2OTksImV4cCI6MTc0OTczMDA5OX0.DbNkZs1Jz0u28mTNNp-YEyoPdQPm7fwfgMeSR3QdSnY';

async function testNotificationAPIs() {
  try {
    console.log('🧪 Testing Notification APIs...\n');
    
    // Test count API
    console.log('1️⃣ Testing count API...');
    const countResponse = await fetch('http://localhost:3002/api/notifications/count', {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ Count API:', countData);
    } else {
      console.log('❌ Count API Failed:', countResponse.status);
    }
    
    // Test list API
    console.log('\n2️⃣ Testing list API...');
    const listResponse = await fetch('http://localhost:3002/api/notifications', {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ List API Success');
      console.log('   Data type:', typeof listData.data);
      console.log('   Is array:', Array.isArray(listData.data));
      console.log('   Count:', listData.data?.length || 0);
      
      if (listData.data && listData.data.length > 0) {
        console.log('\n📋 Recent notifications:');
        listData.data.slice(0, 3).forEach((notif, i) => {
          console.log(`  ${i+1}. ${notif.title} (${notif.type})`);
          console.log(`     Priority: ${notif.priority}, Read: ${notif.read}`);
          if (notif.interviewDate) {
            console.log(`     Interview: ${notif.interviewDate}`);
          }
        });
      }
    } else {
      const errorText = await listResponse.text();
      console.log('❌ List API Failed:', listResponse.status);
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testNotificationAPIs();
