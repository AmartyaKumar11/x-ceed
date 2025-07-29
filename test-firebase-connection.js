const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: './.env.local' });

console.log('🔥 Testing Firebase Connection...');
console.log('=================================');

// Check environment variables
console.log('📋 Checking environment variables:');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');

async function testFirebaseConnection() {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    // Check if all required config is present
    const missingConfig = Object.entries(firebaseConfig).filter(([key, value]) => !value);
    if (missingConfig.length > 0) {
      console.log('\n❌ Missing Firebase configuration:');
      missingConfig.forEach(([key]) => console.log(`   - ${key}`));
      console.log('\n💡 Please add these to your .env.local file');
      process.exit(1);
    }

    console.log('\n🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');

    console.log('🗄️ Connecting to Firestore...');
    const db = getFirestore(app);
    console.log('✅ Firestore connected');

    console.log('📝 Testing write operation...');
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      message: 'Firebase connection test successful!',
      timestamp: new Date(),
      testId: Date.now()
    });
    console.log('✅ Test document written successfully');

    console.log('\n🎉 FIREBASE CONNECTION TEST PASSED!');
    console.log('====================================');
    console.log('✅ All environment variables set');
    console.log('✅ Firebase initialized successfully');
    console.log('✅ Firestore write operation working');
    console.log('✅ Chat history feature should work now');

  } catch (error) {
    console.error('\n❌ FIREBASE CONNECTION TEST FAILED');
    console.error('===================================');
    console.error('Error:', error.message);

    if (error.code === 'permission-denied') {
      console.error('\n💡 Solution: Check Firestore security rules');
      console.error('Make sure you have proper read/write permissions');
    } else if (error.code === 'invalid-argument') {
      console.error('\n💡 Solution: Check your Firebase configuration');
      console.error('Verify all environment variables are correct');
    } else {
      console.error('\n💡 Solution: Verify Firebase project setup');
      console.error('1. Check if Firestore is enabled in your Firebase project');
      console.error('2. Ensure your environment variables match your Firebase config');
    }
    
    process.exit(1);
  }
}

testFirebaseConnection();
