// === BROWSER CONSOLE TEST SCRIPT ===
// Copy and paste this into your browser console (F12) on the recruiter dashboard page

console.log('🔍 X-CEED Job Filtering Debug Test');
console.log('Current URL:', window.location.href);

// Check authentication state
const token = localStorage.getItem('token');
console.log('✅ Token exists:', !!token);

if (token) {
  try {
    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('✅ Token payload:', {
        userId: payload.userId,
        email: payload.email,
        userType: payload.userType,
        name: payload.name,
        expires: new Date(payload.exp * 1000)
      });
      
      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.log('❌ TOKEN IS EXPIRED!');
        console.log('   → Clear localStorage and login again');
        localStorage.removeItem('token');
      } else {
        console.log('✅ Token is valid');
      }
    }
  } catch (e) {
    console.log('❌ Token decode error:', e.message);
  }
}

// Test the jobs API
console.log('\n🧪 Testing Jobs API...');
fetch('/api/jobs', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📥 API Response Status:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  if (data.success && data.data) {
    console.log(`✅ Found ${data.data.length} jobs`);
    
    // Check recruiter ownership
    const recruiters = [...new Set(data.data.map(job => job.recruiterId))];
    console.log(`📊 Jobs from ${recruiters.length} recruiter(s)`);
    
    if (recruiters.length === 1) {
      console.log('✅ GOOD: All jobs belong to the same recruiter');
      console.log(`   → Recruiter ID: ${recruiters[0]}`);
    } else {
      console.log('❌ PROBLEM: Multiple recruiters detected!');
      recruiters.forEach(id => {
        const count = data.data.filter(job => job.recruiterId === id).length;
        console.log(`   → Recruiter ${id}: ${count} jobs`);
      });
    }
    
    // Show job details
    console.log('\n📋 Job List:');
    data.data.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} (${job.status})`);
      console.log(`      → Recruiter: ${job.recruiterId}`);
      console.log(`      → Created: ${job.createdAt}`);
    });
  } else {
    console.log('❌ API Error:', data.message || 'Unknown error');
  }
})
.catch(error => {
  console.log('❌ Network Error:', error.message);
});

console.log('\n💡 Instructions:');
console.log('1. If token is expired → Logout and login again');
console.log('2. If multiple recruiters → Contact support (this should not happen)');
console.log('3. If network error → Check server status');
console.log('4. If all looks good → Try hard refresh (Ctrl+Shift+R)');
