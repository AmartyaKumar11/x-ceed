// Test if Matching Skills and Missing Skills sections are rendering
// This will help verify if the content exists but is hidden vs not rendering at all

console.log('🔍 Debugging Resume Analysis Page Content...');

// Wait for page to load
setTimeout(() => {
  console.log('📊 Checking for analysis sections...');
  
  // Look for all card elements
  const cards = document.querySelectorAll('.bg-card, [class*="Card"]');
  console.log(`Found ${cards.length} card elements`);
  
  // Look for specific sections
  const sections = [
    'Overall Match',
    'Key Strengths', 
    'Matching Skills',
    'Missing Skills',
    'Experience Analysis',
    'Improvement Suggestions',
    'Competitive Advantages',
    'Interview Prep'
  ];
  
  sections.forEach(section => {
    const found = document.querySelector(`*:contains("${section}")`);
    console.log(`${section}: ${found ? '✅ Found' : '❌ Not found'}`);
  });
  
  // Check page height and scroll
  console.log(`📏 Page height: ${document.body.scrollHeight}px`);
  console.log(`📏 Window height: ${window.innerHeight}px`);
  console.log(`📏 Can scroll: ${document.body.scrollHeight > window.innerHeight ? 'YES' : 'NO'}`);
  
  // Force scroll to bottom to test
  window.scrollTo(0, document.body.scrollHeight);
  console.log('📍 Scrolled to bottom');
  
  // Check if any elements are outside viewport
  const allElements = document.querySelectorAll('*');
  let hiddenElements = 0;
  
  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight && rect.top > 0) {
      hiddenElements++;
    }
  });
  
  console.log(`🔍 Elements below viewport: ${hiddenElements}`);
  
}, 2000);

console.log('Copy and paste this script into your browser console while on the resume analysis page');
