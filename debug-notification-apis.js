// Debug script to test notification APIs
async function testNotificationAPIs() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODNhZmEyZWZkMTNiNDI0OTllYWVhMGQiLCJpYXQiOjE3NDk2NDA4NzgsImV4cCI6MTc0OTY0NDQ3OH0.jEmNw6_RXrp1Z2R88kX7JZKdoe8gMZAWUV--jSrOFf4';
  
  try {
    console.log('Testing notification count API...');
    const countResponse = await fetch('http://localhost:3000/api/notifications/count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const countData = await countResponse.json();
    console.log('Count API response:', countData);
    
    console.log('\nTesting notifications list API...');
    const listResponse = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const listData = await listResponse.json();
    console.log('List API response:', listData);
    console.log('Number of notifications:', listData.data?.length || 0);
    
    if (listData.data && listData.data.length > 0) {
      console.log('First notification:', listData.data[0]);
    }
    
  } catch (error) {
    console.error('Error testing APIs:', error);
  }
}

// Run in browser console or node with fetch polyfill
if (typeof window !== 'undefined') {
  testNotificationAPIs();
} else {
  console.log('This script should be run in the browser console');
}
