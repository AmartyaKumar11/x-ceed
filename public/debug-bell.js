// Quick debug script to check notification bell status
console.log('=== Notification Bell Debug ===');

// Check if token exists
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
if (token) {
    console.log('Token preview:', token.substring(0, 50) + '...');
}

// Check current URL
console.log('Current URL:', window.location.href);
console.log('Is applicant page:', window.location.href.includes('/dashboard/applicant'));

// Test notification count API
async function testNotificationCount() {
    if (!token) {
        console.log('❌ No token found - bell won\'t appear');
        return;
    }
    
    try {
        console.log('🔄 Testing notification count API...');
        const response = await fetch('/api/notifications/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('📊 Count API Response:', data);
        
        if (data.success) {
            console.log(`📨 Unread notifications: ${data.unreadCount}`);
            if (data.unreadCount === 0) {
                console.log('ℹ️ Bell hidden because unreadCount = 0');
            } else {
                console.log('✅ Bell should be visible with count:', data.unreadCount);
            }
        } else {
            console.log('❌ Count API failed:', data.message);
        }
    } catch (error) {
        console.log('❌ Count API error:', error.message);
    }
}

// Test notification list API
async function testNotificationList() {
    if (!token) return;
    
    try {
        console.log('🔄 Testing notification list API...');
        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('📋 List API Response:', data);
        
        if (data.success && data.data) {
            console.log(`📨 Found ${data.data.length} notifications`);
            data.data.forEach((notif, i) => {
                console.log(`  ${i+1}. "${notif.title}" - ${notif.read ? 'read' : 'UNREAD'}`);
            });
        }
    } catch (error) {
        console.log('❌ List API error:', error.message);
    }
}

// Run tests
testNotificationCount();
testNotificationList();

// Check for bell element in DOM
setTimeout(() => {
    const bellElement = document.querySelector('[aria-label*="unread notifications"]');
    console.log('🔍 Bell element found in DOM:', !!bellElement);
    if (bellElement) {
        console.log('Bell element:', bellElement);
    } else {
        console.log('❌ No bell element found - check if component is rendered');
    }
}, 2000);
