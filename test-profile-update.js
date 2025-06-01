// Test script for profile update functionality
async function testProfileUpdate() {
  try {
    const userId = '64f8d17e8a68f6de4cbc5bca'; // Replace with a valid user ID from your database
    const token = 'YOUR_JWT_TOKEN'; // Replace with a valid JWT token

    console.log('Starting profile update test...');

    // Define test profile data
    const profileData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      dateOfBirth: '1990-01-01',
      skills: ['JavaScript', 'React', 'Node.js'],
      education: [],
      workExperience: [],
      certifications: []
    };

    console.log('Profile data:', profileData);
    console.log('Sending request...');

    // Send the request
    const response = await fetch('http://localhost:3002/api/applicant/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (response.ok) {
      console.log('✅ Test passed: Profile update successful');
    } else {
      console.log('❌ Test failed: Profile update failed');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testProfileUpdate();
