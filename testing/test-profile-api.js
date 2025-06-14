// Test profile API endpoints
console.log('🧪 Testing Profile API...');

// Get token
const token = localStorage.getItem('token');
if (!token) {
  console.error('❌ No token found');
} else {
  console.log('✅ Token found');
  
  // Test GET /api/applicant/profile
  console.log('🔍 Testing GET /api/applicant/profile...');
  fetch('/api/applicant/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 GET Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 GET Response data:', data);
    
    if (data.success && data.data) {
      console.log('✅ GET Success - User data found');
      
      // Now test PUT with minimal data
      const testData = {
        firstName: data.data.firstName || 'Test',
        lastName: data.data.lastName || 'User',
        email: data.data.email || 'test@example.com',
        skills: ['JavaScript', 'React']
      };
      
      console.log('🔄 Testing PUT /api/applicant/profile...');
      console.log('📤 PUT Data:', testData);
      
      return fetch('/api/applicant/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
    } else {
      throw new Error('GET request failed');
    }
  })
  .then(response => {
    console.log('📡 PUT Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 PUT Response data:', data);
    if (data.success) {
      console.log('✅ PUT Success - Profile updated');
    } else {
      console.error('❌ PUT Failed:', data.message);
    }
  })
  .catch(error => {
    console.error('💥 API Test Error:', error);
  });
}
