// Debug script to run in browser console
console.log('🔍 Debugging API endpoint...');

// Test 1: Check if the endpoint exists
fetch('/api/ai/shortlist-candidates', { method: 'HEAD' })
  .then(response => {
    console.log('✅ HEAD request status:', response.status);
    console.log('✅ HEAD request URL:', response.url);
  })
  .catch(error => {
    console.log('❌ HEAD request failed:', error);
  });

// Test 2: Check what happens with a basic GET
fetch('/api/ai/shortlist-candidates')
  .then(response => {
    console.log('📊 GET request status:', response.status);
    console.log('📊 GET request URL:', response.url);
  })
  .catch(error => {
    console.log('❌ GET request failed:', error);
  });

// Test 3: Check the wrong endpoint that's showing in the error
fetch('/api/shortlist-candidates')
  .then(response => {
    console.log('🔍 Wrong endpoint status:', response.status);
  })
  .catch(error => {
    console.log('❌ Wrong endpoint failed (expected):', error);
  });
