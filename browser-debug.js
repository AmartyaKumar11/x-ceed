// Run this in your browser console on the recruiter dashboard page
// Press F12 -> Console -> Paste this code

console.log('🔍 Browser Auth Debug');
console.log('Current URL:', window.location.href);

// Check localStorage
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

if (token) {
  console.log('Token preview:', token.substring(0, 20) + '...');
  
  // Try to decode the JWT (just the payload part)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', {
        userId: payload.userId,
        email: payload.email,
        userType: payload.userType,
        exp: new Date(payload.exp * 1000)
      });
      
      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.log('❌ Token is EXPIRED!');
      } else {
        console.log('✅ Token is valid');
      }
    }
  } catch (e) {
    console.log('❌ Could not decode token:', e.message);
  }
}

// Check if clientAuth is available
if (window.clientAuth) {
  console.log('ClientAuth available:', !!window.clientAuth);
  console.log('Is authenticated:', window.clientAuth.isAuthenticated());
  console.log('User role:', window.clientAuth.getUserRole());
} else {
  console.log('❌ ClientAuth not available in window object');
}

// Test API call directly
console.log('🧪 Testing jobs API call...');
fetch('/api/jobs', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('API Response:', data);
  if (data.success && data.data) {
    console.log(`Found ${data.data.length} jobs`);
    
    // Check for multiple recruiters
    const recruiters = [...new Set(data.data.map(job => job.recruiterId))];
    console.log(`Jobs from ${recruiters.length} recruiter(s)`);
    
    if (recruiters.length > 1) {
      console.log('⚠️  Multiple recruiters detected in response!');
      recruiters.forEach(id => {
        const count = data.data.filter(job => job.recruiterId === id).length;
        console.log(`  - Recruiter ${id}: ${count} jobs`);
      });
    } else {
      console.log('✅ All jobs belong to the same recruiter');
    }
  }
})
.catch(error => {
  console.log('❌ API call failed:', error);
});
