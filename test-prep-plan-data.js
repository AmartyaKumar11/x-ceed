/**
 * Quick Test: Create a minimal prep plan for testing generation
 */

const testPrepPlan = {
  jobTitle: "Frontend Developer",
  companyName: "Test Company",
  jobDescription: "We are looking for a skilled Frontend Developer with experience in React, JavaScript, and modern web technologies.",
  requirements: ["React", "JavaScript", "HTML/CSS", "Git"],
  duration: 4,
  department: "Engineering",
  level: "Mid-level",
  location: "Remote",
  workMode: "Remote"
};

console.log('🧪 Test Prep Plan Data:');
console.log(JSON.stringify(testPrepPlan, null, 2));

console.log('\n📋 To test manually:');
console.log('1. Go to Resume Match page');
console.log('2. Upload any resume file');
console.log('3. Paste this job description:');
console.log('"We are looking for a skilled Frontend Developer with experience in React, JavaScript, and modern web technologies. Must have 2+ years experience with React, proficiency in HTML/CSS, and Git version control."');
console.log('4. Select 4 weeks duration');
console.log('5. Create the prep plan');
console.log('6. Go to prep plans page and generate detailed plan');

console.log('\n🔍 Expected server logs:');
console.log('• 🔑 GROQ_API_KEY check: Available');
console.log('• 🎯 Generate detailed plan request');
console.log('• AI generation start/complete messages');
