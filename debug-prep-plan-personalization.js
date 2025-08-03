// Debug script to check user profile data for prep plan personalization

console.log('🔍 DEBUGGING: Prep Plan Personalization Issue\n');

console.log('🎯 PROBLEM: Generic prep plans instead of personalized ones');
console.log('💡 LIKELY CAUSES:');
console.log('   1. User profile data is missing or incomplete');
console.log('   2. AI prompt is not using the profile data effectively');
console.log('   3. Skills/experience data is not being parsed correctly');
console.log('   4. The wrong AI generation function is being used\n');

console.log('🔧 DEBUGGING STEPS:');
console.log('');
console.log('1. Check User Profile Structure:');
console.log('   - Open MongoDB Compass or use terminal');
console.log('   - Look at users collection');
console.log('   - Check what data exists for your user ID');
console.log('   - Verify skills, experience, education fields\n');

console.log('2. Test the API Generation:');
console.log('   - Open browser dev tools');
console.log('   - Go to prep plans page');
console.log('   - Click "Generate Detailed Plan"');
console.log('   - Check network tab for API request/response');
console.log('   - Look at console logs for user profile data\n');

console.log('3. Check Database User Profile:');
console.log('   Command to run in MongoDB:');
console.log('   db.users.findOne({}, {skills: 1, workExperience: 1, education: 1})');
console.log('');

console.log('4. Manual Profile Check:');
console.log('   - Go to Profile/Settings page');
console.log('   - Check if skills, experience are filled');
console.log('   - Update profile with relevant information\n');

console.log('🎯 EXPECTED USER PROFILE STRUCTURE:');
console.log(`{
  _id: ObjectId("..."),
  email: "user@example.com",
  skills: ["JavaScript", "React", "Node.js", "Python"],
  workExperience: [
    {
      title: "Software Developer",
      company: "TechCorp",
      duration: "2 years",
      description: "Built web applications..."
    }
  ],
  education: [
    {
      degree: "Bachelor of Engineering",
      institution: "University",
      year: "2022"
    }
  ]
}`);

console.log('\n🚀 QUICK FIX TEST:');
console.log('1. Go to: http://localhost:3002/dashboard/applicant/profile');
console.log('2. Add some skills like: JavaScript, React, Python, SQL');
console.log('3. Add work experience or education');
console.log('4. Save profile');
console.log('5. Try generating prep plan again');
console.log('6. Check if it becomes more personalized\n');

console.log('✨ If profile is empty, that explains the generic plans!');
console.log('📝 The AI can only personalize based on available user data.');
