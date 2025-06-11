// Test script to verify JWT token generation and notification API
const jwt = require('jsonwebtoken');

// Test JWT token creation (mimicking what the login does)
function createTestToken() {
  const userId = '683afa2efd13b42499eaea0d'; // The test user ID we found
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  const token = jwt.sign(
    { userId: userId },
    secret,
    { expiresIn: '1h' }
  );
  
  console.log('Generated JWT token:', token);
  return token;
}

// Test token verification (mimicking what the API does)
function testTokenVerification(token) {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    console.log('Token verified successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

const token = createTestToken();
testTokenVerification(token);

console.log('\nTo test in browser console:');
console.log('localStorage.setItem("token", "' + token + '");');
console.log('Then open the notification panel to see if it works.');
