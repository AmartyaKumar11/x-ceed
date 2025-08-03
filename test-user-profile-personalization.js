// Test user profile data for prep plan personalization

console.log('🔍 TESTING USER PROFILE DATA FOR PREP PLAN PERSONALIZATION\n');

// Simulate API call to check user profile
async function testUserProfileData() {
  try {
    console.log('📊 Simulating user profile check...\n');
    
    // This is what the AI generation function receives as userProfile
    const sampleEmptyProfile = {};
    const sampleGoodProfile = {
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
      workExperience: [
        {
          company: 'TechCorp',
          position: 'Frontend Developer',
          duration: '2 years',
          description: 'Built web applications using React and JavaScript'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Computer Science',
          institution: 'University of Technology',
          year: '2022'
        }
      ]
    };
    
    console.log('❌ EMPTY PROFILE (Generic Plans):');
    console.log('   Skills:', sampleEmptyProfile.skills || 'NONE');
    console.log('   Experience:', sampleEmptyProfile.workExperience || 'NONE');
    console.log('   Education:', sampleEmptyProfile.education || 'NONE');
    console.log('   Result: AI cannot personalize, creates generic content\n');
    
    console.log('✅ GOOD PROFILE (Personalized Plans):');
    console.log('   Skills:', sampleGoodProfile.skills.join(', '));
    console.log('   Experience:', `${sampleGoodProfile.workExperience[0].position} at ${sampleGoodProfile.workExperience[0].company}`);
    console.log('   Education:', `${sampleGoodProfile.education[0].degree} from ${sampleGoodProfile.education[0].institution}`);
    console.log('   Result: AI can create personalized gap analysis and recommendations\n');
    
    console.log('🎯 AI PROMPT COMPARISON:');
    console.log('');
    console.log('With Empty Profile:');
    console.log('==== CANDIDATE CURRENT SKILLS ====');
    console.log('Existing Skills: No skills listed');
    console.log('Experience: No experience data');
    console.log('Education: No education data\n');
    
    console.log('With Good Profile:');
    console.log('==== CANDIDATE CURRENT SKILLS ====');
    console.log('Existing Skills: JavaScript, React, Node.js, Python, SQL');
    console.log('Experience: {"company":"TechCorp","position":"Frontend Developer","duration":"2 years","description":"Built web applications using React and JavaScript"}');
    console.log('Education: {"degree":"Bachelor of Computer Science","institution":"University of Technology","year":"2022"}\n');
    
    console.log('🚀 SOLUTION:');
    console.log('1. Go to your profile settings');
    console.log('2. Add your skills (JavaScript, React, Python, etc.)');
    console.log('3. Add work experience (company, position, description)');
    console.log('4. Add education (degree, institution)');
    console.log('5. Save profile');
    console.log('6. Try generating prep plan again\n');
    
    console.log('💡 ACCESS PROFILE SETTINGS:');
    console.log('- Look for profile/settings icon in navigation');
    console.log('- Or check dashboard for profile completion widget');
    console.log('- Or use ProfileSettingsDialog component\n');
    
    console.log('🔍 TO DEBUG YOUR CURRENT PROFILE:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to Network tab');
    console.log('3. Generate a prep plan');
    console.log('4. Look for API call to /api/prep-plans/generate');
    console.log('5. Check what userProfile data is being sent');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserProfileData();
