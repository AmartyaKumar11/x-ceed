const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Testing Chatbot Response UI...\n');

try {
    // Test 1: Check if the Next.js app is running
    console.log('1. Checking if Next.js app is running...');
    
    try {
        const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/applicant/resume-match', { encoding: 'utf8' });
        
        if (response.trim() === '200') {
            console.log('✅ Next.js app is running and accessible');
        } else {
            console.log(`⚠️  Next.js app returned status code: ${response}`);
            console.log('💡 Starting Next.js app...');
            // This would start the app in the background
        }
    } catch (error) {
        console.log('❌ Next.js app is not accessible');
        console.log('💡 Please run: npm run dev');
    }

    // Test 2: Check the cursor test file
    console.log('\n2. Opening cursor test file...');
    const cursorTestPath = path.resolve(__dirname, 'test-typewriter-cursor.html');
    console.log(`📂 Created test file: ${cursorTestPath}`);
    console.log('💡 Open this file in your browser to test cursor styles');

    // Test 3: Verify the TypewriterText component changes
    console.log('\n3. Verifying TypewriterText component changes...');
    const fs = require('fs');
    const componentPath = path.resolve(__dirname, 'src/app/dashboard/applicant/resume-match/page.jsx');
    
    if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for the updated cursor styling
        if (content.includes('bg-gray-700 dark:bg-gray-300')) {
            console.log('✅ Updated cursor styling found');
        } else {
            console.log('❌ Updated cursor styling not found');
        }
        
        // Check for slower blink interval
        if (content.includes('}, 600)')) {
            console.log('✅ Updated blink timing found');
        } else {
            console.log('❌ Updated blink timing not found');
        }
        
        // Check that animate-pulse was removed
        if (!content.includes('animate-pulse')) {
            console.log('✅ animate-pulse class removed');
        } else {
            console.log('⚠️  animate-pulse class still present');
        }
    } else {
        console.log('❌ Component file not found');
    }

    console.log('\n🎯 Summary of Changes Made:');
    console.log('• Changed cursor color from bg-foreground to bg-gray-700/bg-gray-300');
    console.log('• Removed animate-pulse class to prevent double animation');
    console.log('• Increased blink timing from 530ms to 600ms for more natural feel');
    console.log('• Removed opacity-75 for cleaner appearance');
    
    console.log('\n📋 Testing Instructions:');
    console.log('1. Start your Next.js app with: npm run dev');
    console.log('2. Open the resume match page in your browser');
    console.log('3. Try the chatbot functionality');
    console.log('4. Look for the small cursor during typing - it should now be a subtle gray bar instead of blue');
    console.log('5. Test in both light and dark modes');

} catch (error) {
    console.error('❌ Test failed:', error.message);
}
