// This simulates exactly what happens when you submit a job application
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testApplicationSubmission() {
  console.log('=== TESTING JOB APPLICATION SUBMISSION ===');
  
  // Let's test with a known active job ID from our database
  const activeJobId = '683bf254b60ebfeacf11bf94'; // "Test Job Position"
  
  try {
    // First, let's try to authenticate as an applicant
    console.log('1. Attempting to login as applicant...');
    
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
      const loginResult = await loginResponse.json();
    console.log('Login response:', loginResult);
    
    if (!loginResult.token || loginResult.message !== 'Login successful') {
      console.log('❌ Login failed, trying with different credentials...');
      
      // Try different credentials
      const loginResponse2 = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'amartya3@gmail.com',
          password: 'password123'
        })
      });
        const loginResult2 = await loginResponse2.json();
      console.log('Second login attempt:', loginResult2);
      
      if (!loginResult2.token || loginResult2.message !== 'Login successful') {
        console.log('❌ All login attempts failed. The issue might be authentication.');
        return;
      }
      
      // Use the successful login token
      var token = loginResult2.token;
    } else {
      var token = loginResult.token;
    }
    
    console.log('✅ Successfully logged in, token:', token ? 'Present' : 'Missing');
    
    // Now test the job application submission
    console.log('2. Testing job application submission...');
    
    // Create a test PDF file
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    const formData = new FormData();
    formData.append('jobId', activeJobId);
    formData.append('coverLetter', 'This is a test cover letter for the application.');
    formData.append('additionalMessage', 'This is an additional message.');
    formData.append('resume', testPdfContent, {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('Submitting application with jobId:', activeJobId);
    
    const applicationResponse = await fetch('http://localhost:3002/api/applications/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const applicationResult = await applicationResponse.json();
    console.log('Application submission status:', applicationResponse.status);
    console.log('Application submission result:', applicationResult);
    
    if (!applicationResult.success) {
      console.log('❌ Application submission failed:', applicationResult.message);
    } else {
      console.log('✅ Application submitted successfully!');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testApplicationSubmission();
