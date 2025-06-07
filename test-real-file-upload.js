// Test with a real file upload to mimic frontend behavior
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testRealFileUpload() {
  try {
    console.log('🔍 Testing with real file upload...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginJson = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Use the actual test-resume.pdf file from the workspace
    const resumePath = 'C:\\Users\\AMARTYA KUMAR\\Desktop\\x-ceed\\test-resume.pdf';
    
    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      console.log('❌ Test resume file not found at:', resumePath);
      return;
    }
    
    console.log('✅ Test resume file found');
    const fileStats = fs.statSync(resumePath);
    console.log('📁 File size:', fileStats.size, 'bytes');
    
    // Create FormData with real file
    const formData = new FormData();
    formData.append('jobId', '683d4a3b65384a46ad6a693b'); // "senior frontend developer"
    formData.append('coverLetter', 'This is a test cover letter from real file test');
    formData.append('additionalMessage', 'Additional message for real file test');
    
    // Append the real file
    const fileStream = fs.createReadStream(resumePath);
    formData.append('resume', fileStream, {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('🔍 Submitting with real file...');
    
    const response = await fetch('http://localhost:3002/api/applications/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginJson.token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('📊 Parsed response:', responseJson);
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testRealFileUpload();
