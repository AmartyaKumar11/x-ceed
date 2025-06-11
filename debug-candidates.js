// Simple test to check application data structure
console.log('🔍 Testing application data structure');

// This should be run in browser console when viewing candidates
function debugCandidateData() {
  // Get candidates from React dev tools or window object
  console.log('Current page URL:', window.location.href);
  
  // Try to find the candidates data in React components
  const reactFiber = document.querySelector('#__next')._reactInternalFiber || 
                     document.querySelector('#__next')._reactInternals;
  
  if (reactFiber) {
    console.log('React fiber found, searching for candidate data...');
    
    // This is a simplified way to access React state
    // In real testing, we'd use React dev tools
    function findCandidatesInFiber(fiber) {
      if (fiber.memoizedState) {
        console.log('Found state:', fiber.memoizedState);
      }
      if (fiber.child) findCandidatesInFiber(fiber.child);
      if (fiber.sibling) findCandidatesInFiber(fiber.sibling);
    }
    
    // findCandidatesInFiber(reactFiber);
  }
  
  // Alternative: Look for jobCandidates in localStorage or sessionStorage
  const keys = Object.keys(localStorage);
  console.log('LocalStorage keys:', keys);
  
  // Check if there's any candidate data
  keys.forEach(key => {
    if (key.includes('candidate') || key.includes('job') || key.includes('application')) {
      console.log(`${key}:`, localStorage.getItem(key));
    }
  });
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugCandidateData = debugCandidateData;
  console.log('✅ debugCandidateData function available. Run debugCandidateData() in console.');
}

export { debugCandidateData };
