// Test job application submission
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

async function testJobApplication() {
  try {
    console.log('🧪 Testing job application submission...');
    
    // First, test authentication
    console.log('🔐 Testing authentication...');
    
    // Login as an applicant
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kumaramartya11@gmail.com',
        password: 'test123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Test job application with the first active job
    const jobId = '683bf254b60ebfeacf11bf94'; // From debug output
    console.log('📝 Submitting application for job ID:', jobId);
    
    // Create a simple PDF file for testing
    const testPdfPath = path.join(__dirname, 'test-resume.pdf');
    if (!fs.existsSync(testPdfPath)) {
      // Create a minimal PDF-like file for testing
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n213\n%%EOF');
      fs.writeFileSync(testPdfPath, pdfContent);
      console.log('📄 Created test PDF file');
    }
    
    // Create form data
    const form = new FormData();
    form.append('jobId', jobId);
    form.append('coverLetter', 'This is a test cover letter for the job application.');
    form.append('additionalMessage', 'Additional information about my application.');
    form.append('resume', fs.createReadStream(testPdfPath), {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('📤 Submitting application...');
    
    const applicationResponse = await fetch('http://localhost:3000/api/applications/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const applicationData = await applicationResponse.json();
    console.log('Application response status:', applicationResponse.status);
    console.log('Application response:', applicationData);
    
    if (applicationData.success) {
      console.log('✅ Application submitted successfully!');
    } else {
      console.log('❌ Application failed:', applicationData.message);
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testJobApplication();
