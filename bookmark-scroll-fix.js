// Quick Scroll Fix - Bookmark this for one-click fix after refresh
javascript:(function(){
  document.body.style.height='auto';
  document.body.style.overflow='auto';
  document.documentElement.style.height='auto';
  document.documentElement.style.overflow='auto';
  document.querySelectorAll('[class*="container"]:not(.sidebar), main').forEach(el=>{
    if(!el.classList.contains('sidebar')&&!el.closest('.sidebar')){
      el.style.height='auto';
      el.style.maxHeight='none';
      el.style.overflow='visible';
    }
  });
  setTimeout(()=>{
    const missing=Array.from(document.querySelectorAll('*')).find(el=>el.textContent?.includes('Missing Skills'));
    if(missing)missing.scrollIntoView({behavior:'smooth'});
  },500);
  console.log('✅ Scroll fixed!');
})();
