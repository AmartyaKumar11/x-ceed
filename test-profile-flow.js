// Test script to debug profile data flow and education
console.log('🔍 Testing Profile Data Flow...');

// Test data that would be sent to the API
const testEducationData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'amartya3@gmail.com',
  education: [
    {
      institution: 'Harvard University',
      degree: 'Master of Science',
      field: 'Computer Science',
      startDate: '2020-09-01',
      endDate: '2022-05-15',
      gpa: '3.9'
    }
  ]
};

async function testProfileAPI() {
  const API_BASE = 'http://localhost:3000';
  
  // You would need to get a real token from localStorage
  const token = 'your-jwt-token-here'; // Replace with actual token
  
  try {
    console.log('📤 Sending education data:', JSON.stringify(testEducationData, null, 2));
    
    const response = await fetch(`${API_BASE}/api/applicant/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testEducationData)
    });
    
    const result = await response.json();
    console.log('📥 API Response:', result);
    
    if (response.ok) {
      console.log('✅ Education data saved successfully');
      
      // Now test GET to see if it's retrievable
      const getResponse = await fetch(`${API_BASE}/api/applicant/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const getData = await getResponse.json();
      console.log('📋 Retrieved profile data:', JSON.stringify(getData.data, null, 2));
      
      if (getData.data.education && getData.data.education.length > 0) {
        console.log('✅ Education data successfully retrieved');
        console.log('📚 Education entries:', getData.data.education.length);
      } else {
        console.log('❌ No education data found in retrieved profile');
      }
      
    } else {
      console.log('❌ Failed to save education data:', result.message);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// For now, just show the test data structure
console.log('📋 Test education data structure:');
console.log(JSON.stringify(testEducationData, null, 2));

console.log('\n📊 Profile completion check simulation:');
const mockProfileData = {
  firstName: 'Test',
  lastName: 'User', 
  email: 'test@example.com',
  phone: '1234567890',
  city: 'New York',
  education: [
    {
      institution: 'Harvard University',
      degree: 'Master of Science'
    }
  ],
  workExperience: [
    {
      company: 'Google',
      position: 'Software Engineer'
    }
  ]
};

// Simulate the profile completion calculation
const fields = [
  { 
    key: 'personal', 
    label: 'Personal Information', 
    check: () => mockProfileData.firstName && mockProfileData.lastName && mockProfileData.email 
  },
  { 
    key: 'education', 
    label: 'Education', 
    check: () => mockProfileData.education && mockProfileData.education.length > 0 && 
                mockProfileData.education.some(edu => edu.institution && edu.degree)
  },
  { 
    key: 'contact', 
    label: 'Contact Information', 
    check: () => mockProfileData.phone && (mockProfileData.city || mockProfileData.address)
  },
  { 
    key: 'experience', 
    label: 'Work Experience', 
    check: () => mockProfileData.workExperience && mockProfileData.workExperience.length > 0 && 
                mockProfileData.workExperience.some(exp => exp.company && exp.position)
  }
];

const completed = fields.filter(field => field.check());
const pending = fields.filter(field => !field.check());
const percentage = Math.round((completed.length / fields.length) * 100);

console.log(`✅ Completed fields (${completed.length}/${fields.length}):`);
completed.forEach(field => console.log(`  - ${field.label}`));

console.log(`⏳ Pending fields (${pending.length}/${fields.length}):`);
pending.forEach(field => console.log(`  - ${field.label}`));

console.log(`📊 Profile completion: ${percentage}%`);

// Test education check specifically
const educationCheck = mockProfileData.education && mockProfileData.education.length > 0 && 
                      mockProfileData.education.some(edu => edu.institution && edu.degree);
console.log(`📚 Education check result: ${educationCheck}`);
console.log(`📚 Education data:`, mockProfileData.education);
