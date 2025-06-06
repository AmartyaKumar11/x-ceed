'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  User, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Bell, 
  Settings, 
  LogOut
} from 'lucide-react';
import ProfileSettingsDialog from './ProfileSettingsDialog';
import NotificationPanel from './NotificationPanel';
import DarkModeToggle from './DarkModeToggle';

export default function Sidebar({ role }) {
  const pathname = usePathname();  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);
    // Define menu items based on role
  const menuItems = role === 'applicant' ? [
    { icon: <Home size={18} />, label: 'Dashboard', href: '/dashboard/applicant' },
    { icon: <User size={18} />, label: 'Profile', href: '#', onClick: () => setIsProfileDialogOpen(true) },
    { icon: <Briefcase size={18} />, label: 'Jobs', href: '/dashboard/applicant/jobs' },
    { icon: <FileText size={18} />, label: 'Applications', href: '#' },
    { icon: <MessageSquare size={18} />, label: 'Messages', href: '#' },
    { icon: <Bell size={18} />, label: 'Notifications', href: '#', onClick: () => setIsNotificationPanelOpen(true) },
    { icon: <Settings size={18} />, label: 'Settings', href: '#' },  ] : [
    { icon: <Home size={18} />, label: 'Dashboard', href: '/dashboard/recruiter' },
    { icon: <Briefcase size={18} />, label: 'Job Postings', href: '#' },
    { icon: <User size={18} />, label: 'Candidates', href: '/candidates' },
    { icon: <FileText size={18} />, label: 'Applications', href: '#' },
    { icon: <MessageSquare size={18} />, label: 'Messages', href: '#' },
    { icon: <Settings size={18} />, label: 'Settings', href: '#' },
  ];
    useEffect(() => {
    // Function to handle mouse enter
    const handleMouseEnter = () => {
      setIsOpen(true);
    };
    
    // Function to handle mouse leave
    const handleMouseLeave = (e) => {
      // Check if mouse is still within the sidebar or the trigger area
      if (
        !sidebarRef.current?.contains(e.relatedTarget) &&
        !triggerRef.current?.contains(e.relatedTarget)
      ) {
        setIsOpen(false);
      }
    };
    
    // Create a trigger area on the left side of the screen
    let trigger = document.createElement('div');
    trigger.style.position = 'fixed';
    trigger.style.top = '0';
    trigger.style.left = '0';
    trigger.style.width = '20px';
    trigger.style.height = '100%';
    trigger.style.zIndex = '48';
    
    // Check if the trigger already exists and remove it before adding a new one
    const existingTrigger = document.querySelector('.sidebar-trigger-area');
    if (existingTrigger) {
      existingTrigger.remove();
    }
    
    // Add a class for identification
    trigger.classList.add('sidebar-trigger-area');
    
    triggerRef.current = trigger;
    document.body.appendChild(trigger);
    
    // Add event listeners
    trigger.addEventListener('mouseenter', handleMouseEnter);
    sidebarRef.current?.addEventListener('mouseleave', handleMouseLeave);
    
    // Cleanup
    return () => {
      trigger.removeEventListener('mouseenter', handleMouseEnter);
      sidebarRef.current?.removeEventListener('mouseleave', handleMouseLeave);
      
      // Safe removal of the trigger
      if (document.body.contains(trigger)) {
        document.body.removeChild(trigger);
      }
    };  }, []);  return (
    <>
      {/* Trigger area */}
      <div ref={triggerRef} className="sidebar-trigger"></div>
      
      {/* Sidebar */}      <div
        ref={sidebarRef}
        className={`sidebar fixed top-0 left-0 h-screen bg-background border-r border-border transition-all duration-300 ease-in-out z-50 ${
          isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <h2 className="text-xl font-bold text-foreground">X-CEED</h2>
          <div className="flex items-center space-x-2">
            <DarkModeToggle />            <button 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="py-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>                {item.onClick ? (                  <button 
                    onClick={item.onClick}
                    className={`sidebar-item flex items-center px-6 py-3 text-foreground hover:bg-muted cursor-pointer w-full text-left transition-colors duration-200 ${
                      pathname === item.href ? 'active bg-muted' : ''
                    }`}
                  >
                    <span className="sidebar-icon mr-4 text-foreground">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ) : (                  <Link 
                    href={item.href} 
                    className={`sidebar-item flex items-center px-6 py-3 text-foreground hover:bg-muted cursor-pointer transition-colors duration-200 ${
                      pathname === item.href ? 'active bg-muted' : ''
                    }`}
                  >
                    <span className="sidebar-icon mr-4 text-foreground">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>          <div className="absolute bottom-0 w-full border-t border-border py-4">
          <Link 
            href="/auth" 
            className="sidebar-item flex items-center px-6 py-3 text-foreground hover:bg-muted cursor-pointer transition-colors duration-200"
          >
            <span className="sidebar-icon mr-4 text-foreground"><LogOut size={18} /></span>
            <span>Sign out</span>
          </Link>
        </div>
      </div>      {/* Profile Settings Dialog - Outside sidebar container */}
      <ProfileSettingsDialog 
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        userRole={role}
      />

      {/* Notification Panel - Outside sidebar container */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </>
  );
}
