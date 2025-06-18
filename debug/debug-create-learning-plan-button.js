// Debug script to test the Create Learning Plan button
console.log('🔍 Starting Create Learning Plan Button Debug');

// Function to simulate button click and check for errors
function debugCreateLearningPlanButton() {
  console.log('🎯 Testing Create Learning Plan Button Functionality');
  
  // Check if we're on the resume match page
  const currentPath = window.location.pathname;
  console.log('📍 Current path:', currentPath);
  
  if (!currentPath.includes('resume-match')) {
    console.log('⚠️ Not on resume match page. Navigate to /dashboard/applicant/resume-match first');
    return;
  }
  
  // Look for the Create Learning Plan button
  const button = document.querySelector('button:has-text("Create Learning Plan for This Job")') || 
                 Array.from(document.querySelectorAll('button')).find(btn => 
                   btn.textContent.includes('Create Learning Plan'));
  
  if (!button) {
    console.log('❌ Create Learning Plan button not found');
    console.log('🔍 Available buttons:', Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()));
    return;
  }
  
  console.log('✅ Found Create Learning Plan button:', button);
  
  // Check if button is disabled or has any special attributes
  console.log('🔍 Button properties:', {
    disabled: button.disabled,
    className: button.className,
    onclick: button.onclick,
    style: button.style.cssText
  });
  
  // Check for any React event listeners
  const reactProps = Object.keys(button).filter(key => key.startsWith('__reactProps') || key.startsWith('__reactEventHandlers'));
  console.log('⚛️ React props found:', reactProps);
  
  // Try to click the button programmatically
  console.log('🖱️ Simulating button click...');
  try {
    button.click();
    console.log('✅ Button click executed successfully');
  } catch (error) {
    console.error('❌ Error clicking button:', error);
  }
  
  // Check for any recent console errors
  setTimeout(() => {
    console.log('🔍 Check browser console for any errors after button click');
  }, 1000);
}

// Function to check for required data (job, authentication)
function checkRequiredData() {
  console.log('📊 Checking required data for prep plan creation...');
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  console.log('🔐 Authentication token:', token ? 'Present' : 'Missing');
  
  // Check if job data is available in React state
  // This is tricky since we can't easily access React state from the console
  // but we can look for job data in the DOM
  const jobTitle = document.querySelector('h1, h2, h3, [class*="title"]');
  console.log('💼 Job title element found:', jobTitle ? jobTitle.textContent : 'Not found');
  
  // Check for any error messages in the UI
  const errorMessages = Array.from(document.querySelectorAll('[class*="error"], [class*="alert"]'))
    .map(el => el.textContent.trim())
    .filter(text => text.length > 0);
  
  if (errorMessages.length > 0) {
    console.log('⚠️ Error messages found:', errorMessages);
  }
}

// Function to monitor network requests
function monitorNetworkRequests() {
  console.log('🌐 Monitoring network requests...');
  
  // Override fetch to log API calls
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('📡 API Call:', args);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📡 API Response:', response.status, response.url);
        return response;
      })
      .catch(error => {
        console.error('📡 API Error:', error);
        throw error;
      });
  };
  
  console.log('✅ Network monitoring enabled');
}

// Main debug function
function runFullDebug() {
  console.log('🚀 Running full Create Learning Plan debug...');
  console.log('='.repeat(50));
  
  checkRequiredData();
  console.log('');
  
  monitorNetworkRequests();
  console.log('');
  
  debugCreateLearningPlanButton();
  console.log('');
  
  console.log('📋 Debug complete. Check the logs above for any issues.');
  console.log('💡 If the button still doesn\'t work, try opening the browser DevTools Console');
}

// Run the debug
runFullDebug();
