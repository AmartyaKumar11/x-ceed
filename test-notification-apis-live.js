// Debug script to test notification APIs directly
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function testNotificationAPIs() {
  console.log('🔍 Testing notification APIs directly...\n');
  
  try {
    // First, let's get a valid token by logging in
    console.log('1️⃣ Getting authentication token...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'kumaramartya11@gmail.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.log('Error:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    const user = loginData.user;
    
    console.log(`   ✅ Login successful for: ${user.email}`);
    console.log(`   ✅ User ID: ${user._id}`);
    console.log(`   ✅ User Type: ${user.userType}`);
    
    // 2. Test notification count API
    console.log('\n2️⃣ Testing notification count API...');
    
    const countResponse = await fetch(`${BASE_URL}/api/notifications/count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Response status: ${countResponse.status}`);
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('   ✅ Count API response:', JSON.stringify(countData, null, 2));
    } else {
      const errorText = await countResponse.text();
      console.log('   ❌ Count API failed:', errorText);
    }
    
    // 3. Test notification list API
    console.log('\n3️⃣ Testing notification list API...');
    
    const listResponse = await fetch(`${BASE_URL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Response status: ${listResponse.status}`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log(`   ✅ List API response - success: ${listData.success}`);
      
      if (listData.success && listData.notifications) {
        console.log(`   ✅ Found ${listData.notifications.length} notifications`);
        
        if (listData.notifications.length > 0) {
          console.log('\n   📨 Recent notifications:');
          listData.notifications.slice(0, 5).forEach((notif, i) => {
            console.log(`     ${i + 1}. "${notif.title}" - ${notif.read ? 'read' : 'UNREAD'}`);
            console.log(`        Type: ${notif.type}`);
            console.log(`        Created: ${notif.timestamp || notif.createdAt}`);
            console.log(`        Priority: ${notif.priority || 'medium'}`);
          });
        } else {
          console.log('   📭 No notifications found');
        }
      } else {
        console.log('   ⚠️ Unexpected response structure:', JSON.stringify(listData, null, 2));
      }
    } else {
      const errorText = await listResponse.text();
      console.log('   ❌ List API failed:', errorText);
    }
    
    // 4. Test creating a notification via application status update
    console.log('\n4️⃣ Testing application status update...');
    
    // First, find an application for this user
    const applicationsResponse = await fetch(`${BASE_URL}/api/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (applicationsResponse.ok) {
      const appsData = await applicationsResponse.json();
      console.log(`   Found ${appsData.data?.length || 0} applications`);
      
      if (appsData.data && appsData.data.length > 0) {
        const testApp = appsData.data[0];
        console.log(`   Testing with application: ${testApp._id}`);
        console.log(`   Current status: ${testApp.status}`);
        
        // We can't update status as applicant, so let's check if we can login as recruiter
        console.log('\n   Trying to login as recruiter to test status update...');
        
        const recruiterLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 're234@microsoft.com',
            password: 'password123'
          })
        });
        
        if (recruiterLoginResponse.ok) {
          const recruiterLoginData = await recruiterLoginResponse.json();
          const recruiterToken = recruiterLoginData.token;
          
          console.log(`   ✅ Recruiter login successful: ${recruiterLoginData.user.email}`);
          
          // Try to update application status
          const newStatus = testApp.status === 'pending' ? 'reviewing' : 'pending';
          
          const updateResponse = await fetch(`${BASE_URL}/api/applications/${testApp._id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${recruiterToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
          });
          
          console.log(`   Status update response: ${updateResponse.status}`);
          
          if (updateResponse.ok) {
            const updateData = await updateResponse.json();
            console.log(`   ✅ Status updated to: ${newStatus}`);
            console.log(`   ✅ Update response:`, JSON.stringify(updateData, null, 2));
            
            // Wait a moment then check for new notifications
            console.log('\n   Waiting 2 seconds then checking for new notifications...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check notifications again for the applicant
            const newCountResponse = await fetch(`${BASE_URL}/api/notifications/count`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (newCountResponse.ok) {
              const newCountData = await newCountResponse.json();
              console.log('   📊 New notification count:', JSON.stringify(newCountData, null, 2));
            }
            
            const newListResponse = await fetch(`${BASE_URL}/api/notifications`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (newListResponse.ok) {
              const newListData = await newListResponse.json();
              console.log(`   📨 New notifications count: ${newListData.notifications?.length || 0}`);
              
              if (newListData.notifications && newListData.notifications.length > 0) {
                console.log('   📨 Latest notification:');
                const latest = newListData.notifications[0];
                console.log(`     Title: ${latest.title}`);
                console.log(`     Message: ${latest.message}`);
                console.log(`     Type: ${latest.type}`);
                console.log(`     Read: ${latest.read}`);
                console.log(`     Created: ${latest.timestamp || latest.createdAt}`);
              }
            }
            
          } else {
            const updateError = await updateResponse.text();
            console.log(`   ❌ Status update failed: ${updateError}`);
          }
        } else {
          console.log('   ❌ Recruiter login failed');
        }
      } else {
        console.log('   📭 No applications found for testing');
      }
    } else {
      console.log('   ❌ Failed to fetch applications');
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ API testing failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testNotificationAPIs().then(() => {
  console.log('\n✅ API test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ API test script failed:', error);
  process.exit(1);
});
