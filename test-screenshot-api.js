// Quick test script for screenshot API
// Run with: node test-screenshot-api.js

const testData = {
  action: 'upload_screenshot',
  data: {
    imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // 1x1 pixel test image
    fileName: 'test-screenshot.jpg',
    folderId: null,
    videoTitle: 'Test Video',
    videoId: 'test123',
    videoChannel: 'Test Channel',
    timestamp: 120
  }
};

async function testScreenshotAPI() {
  try {
    console.log('Testing screenshot API...');
    
    const response = await fetch('http://localhost:3002/api/google-integration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Screenshot API test PASSED');
      console.log('File ID:', result.file?.id);
      console.log('View Link:', result.file?.webViewLink);
    } else {
      console.log('❌ Screenshot API test FAILED');
      console.log('Error:', result.error || result.message);
    }
  } catch (error) {
    console.log('❌ Screenshot API test ERROR');
    console.log('Error:', error.message);
  }
}

testScreenshotAPI();
