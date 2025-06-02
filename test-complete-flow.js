const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testCompleteFlow() {
  const baseUrl = 'http://localhost:3002';
  
  try {
    console.log('🚀 Starting complete application flow test...\n');
    
    // Step 1: Login to get a token
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kumaramartya11@gmail.com',
        password: 'password123' // You'll need to use the actual password
      }),
    });
    
    const loginResult = await loginResponse.json();
    console.log('📝 Login response status:', loginResponse.status);
    console.log('📝 Login response:', loginResult);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, cannot continue test');
      return;
    }
    
    const token = loginResult.token;
    console.log('✅ Login successful, got token:', token.substring(0, 50) + '...\n');
    
    // Step 2: Upload a resume
    console.log('📄 Step 2: Uploading resume...');
    
    // Check if there's a sample resume file in the uploads folder
    const resumesDir = path.join(__dirname, 'public', 'uploads', 'resumes');
    const existingFiles = fs.readdirSync(resumesDir);
    
    if (existingFiles.length === 0) {
      console.log('❌ No sample resume files found in uploads directory');
      return;
    }
    
    // Use the first available resume file
    const sampleFile = existingFiles[0];
    const filePath = path.join(resumesDir, sampleFile);
    
    console.log('📄 Using sample file:', sampleFile);
    console.log('📄 File path:', filePath);
    console.log('📄 File exists:', fs.existsSync(filePath));
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });
    
    const uploadResponse = await fetch(`${baseUrl}/api/upload/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData,
    });
    
    console.log('📄 Upload response status:', uploadResponse.status);
    console.log('📄 Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
    
    const uploadResult = await uploadResponse.text();
    console.log('📄 Upload response body:', uploadResult);
    
    if (!uploadResponse.ok) {
      console.log('❌ Resume upload failed');
      return;
    }
    
    console.log('✅ Resume upload completed\n');
    
    // Step 3: Try to submit an application
    console.log('📝 Step 3: Submitting job application...');
    
    // First get a job ID
    const jobsResponse = await fetch(`${baseUrl}/api/jobs?public=true`);
    const jobsResult = await jobsResponse.json();
    
    if (!jobsResult.success || jobsResult.data.length === 0) {
      console.log('❌ No jobs available for application');
      return;
    }
    
    const job = jobsResult.data[0];
    console.log('📝 Applying to job:', job.title, 'ID:', job._id);
    
    const applicationResponse = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId: job._id,
        coverLetter: 'This is a test application from the automated test script.',
      }),
    });
    
    console.log('📝 Application response status:', applicationResponse.status);
    
    const applicationResult = await applicationResponse.text();
    console.log('📝 Application response body:', applicationResult);
    
    if (applicationResponse.ok) {
      console.log('✅ Application submitted successfully!');
    } else {
      console.log('❌ Application submission failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFlow();
