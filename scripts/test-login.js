// Test login script to authenticate a user for testing
const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kumaramartya11@gmail.com',
        password: 'test123' // You'll need to update this with the actual password
      })
    });
    
    const result = await response.json();
    console.log('Login response:', result);
    
    if (result.success) {
      console.log('Token:', result.token);
      console.log('User:', result.user);
    } else {
      console.log('Login failed:', result.message);
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
}

testLogin();
