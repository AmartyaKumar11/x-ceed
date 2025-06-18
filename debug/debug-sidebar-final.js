// Advanced sidebar preservation and debugging script
console.log('🔧 Advanced Sidebar Debug - Fixing all sidebar issues...');

// 1. Fix global document scrolling
document.body.style.height = 'auto';
document.body.style.overflow = 'auto';
document.documentElement.style.height = 'auto';
document.documentElement.style.overflow = 'auto';

// 2. Find and analyze the sidebar
const sidebar = document.querySelector('.sidebar');
const trigger = document.querySelector('.fixed.top-0.left-0.w-5');

if (sidebar) {
  console.log('📊 Sidebar found, analyzing current state...');
  console.log('Current classes:', sidebar.className);
  console.log('Current computed styles:', {
    position: getComputedStyle(sidebar).position,
    width: getComputedStyle(sidebar).width,
    height: getComputedStyle(sidebar).height,
    zIndex: getComputedStyle(sidebar).zIndex,
    transform: getComputedStyle(sidebar).transform,
    opacity: getComputedStyle(sidebar).opacity
  });

  // 3. Remove any problematic inline styles
  sidebar.style.removeProperty('width');
  sidebar.style.removeProperty('min-width');
  sidebar.style.removeProperty('max-width');
  sidebar.style.removeProperty('height');
  sidebar.style.removeProperty('min-height');
  sidebar.style.removeProperty('max-height');
  sidebar.style.removeProperty('transform');
  
  // 4. Ensure proper positioning
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.left = '0';
  sidebar.style.zIndex = '9999';
  
  console.log('✅ Sidebar styles cleaned and repositioned');
} else {
  console.log('❌ Sidebar not found');
}

if (trigger) {
  console.log('📊 Trigger area found');
  trigger.style.position = 'fixed';
  trigger.style.top = '0';
  trigger.style.left = '0';
  trigger.style.width = '20px';
  trigger.style.height = '100vh';
  trigger.style.zIndex = '9998';
  console.log('✅ Trigger area positioned correctly');
} else {
  console.log('❌ Trigger area not found');
}

// 5. Fix main content area scrolling
const mainContent = document.querySelector('main');
if (mainContent) {
  mainContent.style.overflow = 'auto';
  mainContent.style.height = 'auto';
  mainContent.style.minHeight = '100vh';
  console.log('✅ Main content made scrollable');
}

// 6. Monitor sidebar state changes
let isMonitoring = false;
function startSidebarMonitoring() {
  if (isMonitoring) return;
  isMonitoring = true;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList.contains('sidebar')) {
        console.log('🔄 Sidebar state changed:', {
          classes: mutation.target.className,
          width: getComputedStyle(mutation.target).width,
          opacity: getComputedStyle(mutation.target).opacity
        });
      }
    });
  });
  
  if (sidebar) {
    observer.observe(sidebar, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });
    console.log('👁️ Sidebar monitoring started');
  }
}

// 7. Test sidebar functionality
function testSidebar() {
  console.log('🧪 Testing sidebar functionality...');
  
  // Simulate mouse enter on trigger
  if (trigger) {
    const mouseEnterEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    trigger.dispatchEvent(mouseEnterEvent);
    console.log('✅ Simulated mouse enter on trigger');
    
    setTimeout(() => {
      if (sidebar) {
        console.log('📊 Sidebar state after trigger:', {
          classes: sidebar.className,
          width: getComputedStyle(sidebar).width,
          opacity: getComputedStyle(sidebar).opacity,
          isVisible: sidebar.classList.contains('w-64')
        });
      }
    }, 500);
  }
}

// 8. Add CSS to ensure sidebar doesn't shrink
const style = document.createElement('style');
style.textContent = `
  .sidebar {
    flex-shrink: 0 !important;
    min-width: 0 !important;
  }
  
  .sidebar.w-64 {
    width: 16rem !important;
    min-width: 16rem !important;
  }
  
  .sidebar.w-0 {
    width: 0 !important;
    min-width: 0 !important;
  }
  
  .sidebar * {
    flex-shrink: 0;
  }
`;
document.head.appendChild(style);
console.log('✅ Anti-shrink CSS added');

// Start monitoring and run test
startSidebarMonitoring();
setTimeout(testSidebar, 1000);

console.log('🎯 Sidebar debugging complete!');
console.log('Instructions:');
console.log('- Move mouse to left edge to trigger sidebar');
console.log('- Check console for state changes');
console.log('- Sidebar should maintain constant width when open');
