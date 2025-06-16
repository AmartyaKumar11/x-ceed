// Frontend cache clearing and job refresh utility
// This adds a force refresh mechanism to the RealJobsComponent

console.log('🔄 Frontend Job Refresh Utility');

// Function to clear all cached data and force refresh
function forceRefreshJobs() {
  console.log('🗑️ Clearing cached data...');
  
  // Clear localStorage
  localStorage.removeItem('cached-jobs');
  localStorage.removeItem('jobs-last-fetch');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Force reload the page
  console.log('🔄 Force reloading page...');
  window.location.reload(true);
}

// Function to manually check API
async function checkJobsAPI() {
  console.log('🔍 Manually checking jobs API...');
  
  try {
    const response = await fetch('/api/jobs?public=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Number of jobs:', data.data?.length || 0);
      
      if (data.data && data.data.length > 0) {
        console.log('Job titles:');
        data.data.forEach((job, index) => {
          console.log(`${index + 1}. ${job.title} (Status: ${job.status})`);
        });
      } else {
        console.log('No jobs returned from API');
      }
    } else {
      console.error('API Error:', await response.text());
    }
  } catch (error) {
    console.error('Fetch Error:', error);
  }
}

// Function to clear browser cache programmatically
function clearBrowserCache() {
  console.log('🧹 Clearing browser cache...');
  
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('Deleting cache:', name);
        caches.delete(name);
      });
    });
  }
  
  // Clear service worker cache if any
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
}

// Export functions for browser console use
if (typeof window !== 'undefined') {
  window.forceRefreshJobs = forceRefreshJobs;
  window.checkJobsAPI = checkJobsAPI;
  window.clearBrowserCache = clearBrowserCache;
  
  console.log('🛠️ Available functions:');
  console.log('- forceRefreshJobs() - Clear cache and reload');
  console.log('- checkJobsAPI() - Manually check API');
  console.log('- clearBrowserCache() - Clear browser cache');
}

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. BROWSER CONSOLE METHOD:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Run: checkJobsAPI()
   - Check the API response

2. FORCE REFRESH METHOD:
   - In Console, run: forceRefreshJobs()
   - This will clear all cache and reload

3. NETWORK TAB METHOD:
   - Go to Network tab in Dev Tools
   - Refresh the page
   - Look for the API call: /api/jobs?public=true
   - Check the response

4. HARD REFRESH METHOD:
   - Hold Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or right-click refresh button → "Empty Cache and Hard Reload"

5. APPLICATION TAB METHOD:
   - Go to Application tab
   - Click "Clear storage"
   - Check all boxes and clear

If jobs still appear after these steps, they might be:
- Hard-coded in the component
- Coming from a different API endpoint
- Cached at the server level
`);

module.exports = {
  forceRefreshJobs,
  checkJobsAPI,
  clearBrowserCache
};
