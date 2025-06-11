// Debug script to run in browser console after setting token
console.clear();
console.log('🔍 Notification Bell Debug Script');
console.log('================================');

// Check token
const token = localStorage.getItem('token');
console.log('✅ Token exists:', !!token);

// Check current URL
console.log('✅ Current URL:', window.location.href);
console.log('✅ Is applicant page:', window.location.href.includes('/dashboard/applicant'));

// Test APIs
async function testApis() {
    if (!token) {
        console.log('❌ No token - bell will not appear');
        return;
    }
    
    try {
        // Test count API
        const countResponse = await fetch('/api/notifications/count', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const countData = await countResponse.json();
        console.log('📊 Count API:', countData);
        
        if (countData.success && countData.unreadCount > 0) {
            console.log('🎯 Bell should be visible with count:', countData.unreadCount);
        } else {
            console.log('ℹ️ Bell hidden - no unread notifications');
        }
        
    } catch (error) {
        console.log('❌ API Error:', error.message);
    }
}

// Check DOM for bell
function checkBell() {
    const bellButton = document.querySelector('button[aria-label*="unread notifications"]');
    const bellContainer = document.querySelector('.fixed.bottom-6.right-6');
    
    console.log('🔍 Bell button found:', !!bellButton);
    console.log('🔍 Bell container found:', !!bellContainer);
    
    if (bellButton) {
        console.log('✅ Bell is in DOM:', bellButton);
        console.log('✅ Bell position:', getComputedStyle(bellButton.parentElement));
    } else {
        console.log('❌ Bell not found in DOM - check if component rendered');
    }
}

// Run tests
testApis();
setTimeout(checkBell, 1000);
