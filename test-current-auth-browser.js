// Test current authentication and see which user is logged in
async function testCurrentAuth() {
  try {
    const token = localStorage.getItem('token');
    console.log('🔍 Current token:', token ? 'Found' : 'Not found');
    
    if (!token) {
      console.log('❌ No token found');
      return;
    }

    // Test the authentication by calling a protected endpoint
    const response = await fetch('/api/jobs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response data:', data);
      
      // The jobs returned should only be for the current recruiter
      if (data.success && data.data) {
        console.log(`📊 Current recruiter has ${data.data.length} jobs:`);
        data.data.forEach((job, index) => {
          console.log(`   ${index + 1}. "${job.title}" (RecruiterId: ${job.recruiterId})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, errorText);
    }

    // Also decode the token to see user info (this is just for debugging)
    try {
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('🔐 Token payload:', payload);
    } catch (e) {
      console.log('⚠️ Could not decode token');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCurrentAuth();
