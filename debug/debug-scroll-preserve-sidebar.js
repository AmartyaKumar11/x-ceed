// Updated browser script that fixes scrolling WITHOUT affecting the sidebar
console.log('🔧 Fixing page scrolling while preserving sidebar...');

// 1. Fix page scrolling without affecting fixed elements
document.body.style.height = 'auto';
document.body.style.overflow = 'auto';
document.documentElement.style.height = 'auto';
document.documentElement.style.overflow = 'auto';

// 2. Find and fix main content containers (but NOT sidebar)
const containers = document.querySelectorAll('[class*="container"]:not(.sidebar), main, .bg-background');
containers.forEach(el => {
  // Skip if this is the sidebar or inside sidebar
  if (!el.classList.contains('sidebar') && !el.closest('.sidebar')) {
    el.style.height = 'auto';
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
  }
});

// 3. Specifically preserve sidebar styling
const sidebar = document.querySelector('.sidebar');
if (sidebar) {
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.left = '0';
  sidebar.style.height = '100vh';
  sidebar.style.zIndex = '9999';
  sidebar.style.transform = 'none';
  console.log('✅ Sidebar positioning preserved');
}

// 4. Force the main content area to be scrollable
const mainContent = document.querySelector('main');
if (mainContent) {
  mainContent.style.overflow = 'auto';
  mainContent.style.height = 'auto';
  mainContent.style.minHeight = '100vh';
  console.log('✅ Main content made scrollable');
}

// 5. Scroll to see the missing skills section
setTimeout(() => {
  // Try to find Missing Skills section
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, span'));
  const missingSkillsElement = headings.find(el => el.textContent?.includes('Missing Skills'));
  
  if (missingSkillsElement) {
    missingSkillsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log('✅ Scrolled to Missing Skills section');
  } else {
    // Try scrolling to bottom to see more content
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    console.log('📍 Scrolled to bottom to reveal more content');
  }
}, 1500);

// 6. Add keyboard scroll support
document.addEventListener('keydown', function(e) {
  if (e.key === 'PageDown' || e.key === 'End') {
    e.preventDefault();
    window.scrollBy({ top: 500, behavior: 'smooth' });
  }
  if (e.key === 'PageUp' || e.key === 'Home') {
    e.preventDefault();
    window.scrollBy({ top: -500, behavior: 'smooth' });
  }
});

console.log('🎯 Page scroll fixes applied, sidebar preserved');
console.log('Use Page Down, Page Up, or mouse wheel to scroll');
console.log('Move mouse to left edge to show sidebar');
