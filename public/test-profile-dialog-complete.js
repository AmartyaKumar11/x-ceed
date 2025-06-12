// Test the ProfileSettingsDialog functionality end-to-end
const testProfileDialogFlow = async () => {
  console.log('🧪 Testing Profile Settings Dialog Flow...');
  
  // Test authentication
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return;
  }
  
  console.log('✅ Auth token found');
  
  // Test profile data fetch
  try {
    console.log('📥 Fetching current profile data...');
    const response = await fetch('/api/applicant/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Profile data fetched successfully');
      console.log('📊 Current profile data:');
      console.log('  - Name:', result.data.firstName, result.data.lastName);
      console.log('  - Email:', result.data.email);
      console.log('  - Phone:', result.data.phone || 'Not set');
      console.log('  - Education entries:', result.data.education?.length || 0);
      console.log('  - Experience entries:', result.data.workExperience?.length || 0);
      console.log('  - Skills:', result.data.skills?.length || 0);
      console.log('  - Certifications:', result.data.certifications?.length || 0);
      
      // Calculate completion
      const completionFields = {
        hasPhone: !!result.data.phone,
        hasEducation: result.data.education && result.data.education.length > 0,
        hasExperience: result.data.workExperience && result.data.workExperience.length > 0,
        hasSkills: result.data.skills && result.data.skills.length > 0
      };
      
      const completedCount = Object.values(completionFields).filter(Boolean).length;
      const completionPercentage = Math.round((completedCount / 4) * 100);
      
      console.log('📈 Profile Completion:');
      console.log('  - Has Phone:', completionFields.hasPhone);
      console.log('  - Has Education:', completionFields.hasEducation);
      console.log('  - Has Experience:', completionFields.hasExperience);
      console.log('  - Has Skills:', completionFields.hasSkills);
      console.log('  - Overall:', completionPercentage + '%');
      
      // Test profile save with complete data
      console.log('\n🧪 Testing profile save with complete data...');
      
      const testSaveData = {
        firstName: result.data.firstName || 'Test',
        lastName: result.data.lastName || 'User',
        email: result.data.email,
        phone: result.data.phone || '555-TEST-1234',
        address: result.data.address || 'Test Address',
        city: result.data.city || 'Test City',
        state: result.data.state || 'Test State',
        zipCode: result.data.zipCode || '12345',
        dateOfBirth: result.data.dateOfBirth || '1990-01-01',
        gender: result.data.gender || 'prefer_not_to_say',
        education: result.data.education || [],
        workExperience: result.data.workExperience || [],
        skills: result.data.skills || [],
        certifications: result.data.certifications || []
      };
      
      const saveResponse = await fetch('/api/applicant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testSaveData)
      });
      
      const saveResult = await saveResponse.json();
      
      if (saveResult.success) {
        console.log('✅ Profile save test successful');
        
        // Verify data wasn't corrupted
        const verifyResponse = await fetch('/api/applicant/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (verifyResult.success && verifyResult.data) {
          console.log('✅ Data verification successful');
          console.log('📊 After save verification:');
          console.log('  - Phone preserved:', !!verifyResult.data.phone);
          console.log('  - Education preserved:', verifyResult.data.education?.length || 0);
          console.log('  - Experience preserved:', verifyResult.data.workExperience?.length || 0);
          console.log('  - Skills preserved:', verifyResult.data.skills?.length || 0);
        } else {
          console.error('❌ Data verification failed');
        }
      } else {
        console.error('❌ Profile save test failed:', saveResult.message);
      }
      
    } else {
      console.error('❌ Failed to fetch profile data:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testProfileDialogFlow();
