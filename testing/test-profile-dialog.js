// Test ProfileSettingsDialog data loading
console.log('🧪 Testing Profile Dialog Data Loading...');

// Check if user is logged in
const token = localStorage.getItem('token');
console.log('🔑 Token exists:', !!token);

if (!token) {
  console.error('❌ No authentication token found. Please log in first.');
} else {
  console.log('🔓 Token preview:', token.substring(0, 50) + '...');
  
  // Test the profile API endpoint directly
  fetch('/api/applicant/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 Profile API Response:', data);
    
    if (data.success && data.data) {
      console.log('✅ Profile data structure:');
      console.log('  - Name:', data.data.firstName, data.data.lastName);
      console.log('  - Email:', data.data.email);
      console.log('  - Phone:', data.data.phone);
      console.log('  - Education:', Array.isArray(data.data.education) ? data.data.education.length + ' entries' : 'Not an array');
      console.log('  - Work Experience:', Array.isArray(data.data.workExperience) ? data.data.workExperience.length + ' entries' : 'Not an array');
      console.log('  - Skills:', Array.isArray(data.data.skills) ? data.data.skills.length + ' skills' : 'Not an array');
      
      // Log first education entry if exists
      if (Array.isArray(data.data.education) && data.data.education.length > 0) {
        console.log('  - First Education:', data.data.education[0]);
      }
      
      // Log first work experience if exists
      if (Array.isArray(data.data.workExperience) && data.data.workExperience.length > 0) {
        console.log('  - First Work Experience:', data.data.workExperience[0]);
      }
    } else {
      console.error('❌ Profile data not found or API failed');
    }
  })
  .catch(error => {
    console.error('💥 Error testing profile API:', error);
  });
}

// Test opening the profile dialog (if on dashboard page)
setTimeout(() => {
  const profileSection = document.querySelector('[data-testid="profile-completion"]') || 
                        document.querySelector('.profile-completion') ||
                        document.querySelector('[class*="profile"]');
  
  if (profileSection) {
    console.log('📋 Found profile section on page:', profileSection);
  } else {
    console.log('ℹ️ No profile section found on current page. Navigate to applicant dashboard to test.');
  }
}, 2000);
