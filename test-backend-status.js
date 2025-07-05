// Simple test script to check backend service status
const checkBackendStatus = async () => {
  try {
    console.log('Testing backend service status...');
    
    // Test the Next.js API route
    const response = await fetch('http://localhost:3002/api/mock-interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.status === 200) {
      console.log('✅ Backend service is ONLINE');
    } else if (response.status === 503) {
      console.log('❌ Backend service is OFFLINE');
      console.log('Start the service with: npm run job-desc-service');
    } else {
      console.log('⚠️ Unexpected response');
    }
    
  } catch (error) {
    console.error('❌ Error testing backend service:', error.message);
    console.log('Make sure the Next.js dev server is running (npm run dev)');
  }
};

// Test direct Python service (if running)
const testDirectPythonService = async () => {
  try {
    console.log('\nTesting direct Python service...');
    const response = await fetch('http://localhost:8008/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Python service is running:', data);
    } else {
      console.log('❌ Python service returned error status:', response.status);
    }
  } catch (error) {
    console.log('❌ Python service is not running');
    console.log('Start it with: npm run job-desc-service');
  }
};

// Run tests
checkBackendStatus();
testDirectPythonService();
