// Debug script to check JWT token
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

// You'll need to manually paste the token from localStorage here
const token = process.argv[2];

if (!token) {
  console.log('Please provide a token as an argument:');
  console.log('node debug-token.js YOUR_TOKEN_HERE');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Application -> Storage -> Cookies or localStorage');
  console.log('3. Look for "auth_token" or similar');
  console.log('4. Copy the token value');
  process.exit(1);
}

console.log('Token:', token.substring(0, 50) + '...');
console.log('\n=== DECODED TOKEN ===');

try {
  // Decode without verification first to see contents
  const decoded = jwt.decode(token);
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
  
  // Check if userId is a valid ObjectId
  if (decoded.userId) {
    try {
      const objectId = new ObjectId(decoded.userId);
      console.log('\n=== USER ID VALIDATION ===');
      console.log('User ID from token:', decoded.userId);
      console.log('Is valid ObjectId:', ObjectId.isValid(decoded.userId));
      console.log('Converted ObjectId:', objectId.toString());
    } catch (error) {
      console.log('\n❌ USER ID VALIDATION FAILED');
      console.log('User ID from token:', decoded.userId);
      console.log('Error:', error.message);
    }
  }
  
  // Check expiration
  if (decoded.exp) {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = now >= decoded.exp;
    console.log('\n=== EXPIRATION CHECK ===');
    console.log('Current time (unix):', now);
    console.log('Token expires (unix):', decoded.exp);
    console.log('Is expired:', isExpired);
    console.log('Expires at:', new Date(decoded.exp * 1000).toISOString());
  }
  
  // Try to verify with secret (won't work without .env but shows structure)
  console.log('\n=== VERIFICATION ATTEMPT ===');
  console.log('Note: This will fail without proper JWT_SECRET in environment');
  
} catch (error) {
  console.error('Token decoding failed:', error.message);
}
