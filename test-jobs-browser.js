// Simple test to check jobs ownership via API
async function testJobsOwnership() {
  try {
    // Get token from localStorage (simulate browser environment)
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found in localStorage');
      return;
    }

    console.log('🔍 Testing jobs API with current user token...');

    // Test authenticated jobs endpoint
    const response = await fetch('/api/jobs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.success && data.data) {
        console.log(`📊 Found ${data.data.length} jobs for current recruiter:`);
        data.data.forEach((job, index) => {
          console.log(`   ${index + 1}. "${job.title}" (ID: ${job._id}, Recruiter: ${job.recruiterId}, Status: ${job.status})`);
        });
      }
    } else {
      console.log('❌ API request failed:', response.status, await response.text());
    }

    // Also test public jobs endpoint for comparison
    console.log('\n🌐 Testing public jobs endpoint...');
    const publicResponse = await fetch('/api/jobs?public=true');
    if (publicResponse.ok) {
      const publicData = await publicResponse.json();
      console.log(`📊 Found ${publicData.data.length} public jobs total`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testJobsOwnership();
