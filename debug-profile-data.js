// Test profile data loading
console.log('🔍 Testing Profile Data Loading...');

// Function to test the profile API
async function testProfileAPI() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No token found. Please log in first.');
    return;
  }
  
  console.log('🔑 Token found:', token.substring(0, 30) + '...');
  
  try {
    console.log('📡 Making API call to /api/applicant/profile...');
    
    const response = await fetch('/api/applicant/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📋 Response data:', data);
    
    if (data.success && data.data) {
      console.log('✅ Profile data found:');
      console.log('  - Name:', data.data.firstName, data.data.lastName);
      console.log('  - Email:', data.data.email);
      console.log('  - Phone:', data.data.phone);
      console.log('  - City:', data.data.city);
      console.log('  - Address:', data.data.address);
      console.log('  - Gender:', data.data.gender);
      console.log('  - Education entries:', data.data.education?.length || 0);
      console.log('  - Work experience entries:', data.data.workExperience?.length || 0);
      console.log('  - Skills:', data.data.skills?.length || 0);
      
      if (data.data.education && data.data.education.length > 0) {
        console.log('📚 First education entry:', data.data.education[0]);
      }
      
      if (data.data.workExperience && data.data.workExperience.length > 0) {
        console.log('💼 First work experience:', data.data.workExperience[0]);
      }
    } else {
      console.error('❌ API call failed or no data returned');
    }
    
  } catch (error) {
    console.error('💥 Error calling profile API:', error);
  }
}

// Run the test
testProfileAPI();

// Also test if we can find the profile dialog elements
setTimeout(() => {
  console.log('🔍 Looking for profile dialog elements...');
  
  // Check if dialog is open
  const dialog = document.querySelector('[class*="ProfileSettings"]') || 
                document.querySelector('[class*="fixed"][class*="inset-0"]');
  
  if (dialog) {
    console.log('📋 Profile dialog found:', dialog);
    
    // Check for input fields
    const inputs = dialog.querySelectorAll('input');
    console.log('📝 Found', inputs.length, 'input fields');
    
    inputs.forEach((input, index) => {
      console.log(`  Input ${index + 1}: ${input.type} - "${input.value}" (placeholder: "${input.placeholder}")`);
    });
  } else {
    console.log('ℹ️ No profile dialog found. Make sure to open the profile dialog first.');
  }
}, 2000);
