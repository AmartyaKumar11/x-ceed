// Test script to verify interview scheduling dialog functionality
// This script can be run in the browser console to test the dropdowns

console.log('Interview Scheduling Dialog Test');
console.log('================================');

// Test 1: Check if Select components are rendered correctly
function testSelectComponents() {
  const selects = document.querySelectorAll('[data-slot="select-trigger"]');
  console.log(`Found ${selects.length} select components on page`);
  
  selects.forEach((select, index) => {
    console.log(`Select ${index + 1}:`, {
      placeholder: select.textContent.trim(),
      isClickable: !select.disabled,
      hasChevron: select.querySelector('svg') !== null
    });
  });
}

// Test 2: Check z-index layering
function testZIndexLayering() {
  const dialog = document.querySelector('[role="dialog"]');
  const dialogContent = document.querySelector('[data-slot="select-content"]');
  
  if (dialog) {
    const dialogZIndex = window.getComputedStyle(dialog).zIndex;
    console.log('Dialog z-index:', dialogZIndex);
  }
  
  if (dialogContent) {
    const contentZIndex = window.getComputedStyle(dialogContent).zIndex;
    console.log('Select content z-index:', contentZIndex);
  }
}

// Test 3: Simulate dropdown click
function testDropdownClick() {
  const firstSelect = document.querySelector('[data-slot="select-trigger"]');
  if (firstSelect) {
    console.log('Simulating click on first select...');
    firstSelect.click();
    
    setTimeout(() => {
      const selectContent = document.querySelector('[data-slot="select-content"]');
      if (selectContent) {
        console.log('Dropdown opened successfully!');
        console.log('Select content visibility:', window.getComputedStyle(selectContent).visibility);
        console.log('Select content display:', window.getComputedStyle(selectContent).display);
      } else {
        console.log('Dropdown did not open - investigating...');
      }
    }, 100);
  }
}

// Run tests when interview dialog is open
function runTests() {
  console.log('Running interview dialog tests...');
  testSelectComponents();
  testZIndexLayering();
  testDropdownClick();
}

// Export for manual testing
window.testInterviewDialog = runTests;

console.log('Test functions loaded. To test, open the interview dialog and run: testInterviewDialog()');
