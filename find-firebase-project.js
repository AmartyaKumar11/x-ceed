console.log('🔍 Firebase Project Finder');
console.log('========================');
console.log('');
console.log('Based on your setup, your Firebase project might be named:');
console.log('🎯 x-ceed-18c97 (most likely)');
console.log('🎯 x-ceed-db');
console.log('🎯 x-ceed');
console.log('🎯 video-ai-assistant');
console.log('');
console.log('📋 Steps to find your project:');
console.log('1. Go to: https://console.firebase.google.com/');
console.log('2. Sign in with your Google account');
console.log('3. Look for projects with names similar to above');
console.log('4. Click on the project');
console.log('5. Go to Settings ⚙️ → Project settings');
console.log('6. Scroll to "Your apps" section');
console.log('7. Copy the firebaseConfig object');
console.log('');
console.log('🔗 Direct link to check your Firebase projects:');
console.log('https://console.firebase.google.com/');
console.log('');
console.log('📊 To verify your data is still there:');
console.log('1. Go to Firestore Database in your project');
console.log('2. Look for collections: chatSessions, chatMessages');
console.log('3. If you see data, everything is preserved!');
console.log('');
console.log('💡 Once you get the config, replace the values in .env.local');

// If the user runs this with their project ID, we can generate the likely URLs
const potentialProjectIds = ['x-ceed-18c97', 'x-ceed-db', 'x-ceed', 'video-ai-assistant'];

console.log('');
console.log('🌐 Potential direct links to your project settings:');
potentialProjectIds.forEach(id => {
  console.log(`   https://console.firebase.google.com/project/${id}/settings/general`);
});

console.log('');
console.log('🔍 Potential direct links to your Firestore:');
potentialProjectIds.forEach(id => {
  console.log(`   https://console.firebase.google.com/project/${id}/firestore/data`);
});
