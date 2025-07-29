// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id'
};

// Check if Firebase is properly configured
const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app, db;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('🔥 Firebase connected successfully');
  } catch (error) {
    console.warn('🔥 Firebase connection failed:', error.message);
    console.warn('📝 Chat will fallback to localStorage');
    db = null;
  }
} else {
  console.warn('🔥 Firebase not configured - using localStorage fallback');
  console.warn('📝 Add Firebase config to .env.local to enable cloud sync');
  db = null;
}

export { db };
