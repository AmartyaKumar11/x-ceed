// Quick test to check if profile data is loading
console.log('🔍 Quick Profile Test...');

const token = localStorage.getItem('token');
if (token) {
  fetch('/api/applicant/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => {
    console.log('📊 Profile data:', data);
    if (data.success && data.data) {
      console.log('✅ Name:', data.data.firstName, data.data.lastName);
      console.log('✅ Email:', data.data.email);
      console.log('✅ Phone:', data.data.phone);
      console.log('✅ Gender:', data.data.gender);
      console.log('✅ Education count:', data.data.education?.length || 0);
    }
  });
} else {
  console.error('❌ No token found');
}
