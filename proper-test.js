// Proper multipart test to match what the frontend sends
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function properTest() {
  try {
    console.log('🔍 Starting proper multipart test...');
    
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
    console.log('✅ Login successful, token received');
      // Create a proper FormData request like the frontend does
    const formData = new FormData();
    formData.append('jobId', '683bf2e7b60ebfeacf11bf95'); // Different job: "adadad"
    formData.append('coverLetter', 'This is a test cover letter');
    formData.append('additionalMessage', 'Additional test message');
    
    // Create a simple PDF buffer for testing
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000074 00000 n 0000000120 00000 n trailer<</Size 4/Root 1 0 R>>startxref 179 %%EOF');
    
    formData.append('resume', pdfBuffer, {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('🔍 Submitting job application...');
    
    const response = await fetch('http://localhost:3002/api/applications/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginJson.token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Parsed response:', responseJson);
    } catch (e) {
      console.log('Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

properTest();
