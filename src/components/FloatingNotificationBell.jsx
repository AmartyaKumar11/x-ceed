'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import NotificationPanel from './NotificationPanel';

export default function FloatingNotificationBell() {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const { theme } = useTheme();
  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔔 No token found, skipping notification fetch');
        return;
      }

      console.log('🔔 Fetching notification count...');
      const response = await fetch('/api/notifications/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('🔔 Notification count fetch failed:', response.status, response.statusText);
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          setUnreadCount(0);
        }
        return;
      }

      const data = await response.json();
      console.log('🔔 Notification count response:', data);
      
      if (data.success) {
        const newUnreadCount = data.unreadCount || 0;
        
        // Check if there are new notifications since last check
        const lastKnownCount = parseInt(localStorage.getItem('lastNotificationCount') || '0');
        if (newUnreadCount > lastKnownCount) {
          setHasNewNotifications(true);
          // Auto-hide the "new" indicator after 5 seconds
          setTimeout(() => setHasNewNotifications(false), 5000);
        }
        
        setUnreadCount(newUnreadCount);
        localStorage.setItem('lastNotificationCount', newUnreadCount.toString());
      } else {
        console.error('🔔 Notification count API returned error:', data.message);
      }
    } catch (error) {
      console.error('🔔 Error fetching notification count:', error);
      // Don't set unreadCount to 0 on network errors - keep showing last known value
    }
  };
  // Poll for new notifications every 30 seconds
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset new notification indicator when panel is opened
  const handleBellClick = () => {
    setIsNotificationPanelOpen(true);
    setHasNewNotifications(false);
  };

  // Debug: Force show bell and add logging
  console.log('🔔 FloatingNotificationBell render - unreadCount:', unreadCount);
  console.log('🔔 Token exists:', typeof window !== 'undefined' && !!localStorage.getItem('token'));
  
  // Don't render on server side
  if (typeof window === 'undefined') return null;
  
  // Temporarily always show bell for debugging
  // if (unreadCount === 0) return null;

  return (
    <>
      {/* Floating Bell Icon - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleBellClick}
          className={cn(
            "relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
            // Theme-aware background and text colors
            theme === 'dark' 
              ? "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700" 
              : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
            hasNewNotifications && "animate-bounce"
          )}
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell size={24} className={theme === 'dark' ? 'text-white' : 'text-gray-800'} />
          
          {/* Red Dot Indicator */}
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <div className={cn(
              "bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1",
              hasNewNotifications && "animate-pulse"
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>

          {/* Pulse Ring Animation for New Notifications */}
          {hasNewNotifications && (
            <div className={cn(
              "absolute inset-0 rounded-full border-2 animate-ping opacity-75",
              theme === 'dark' ? 'border-gray-600' : 'border-gray-400'
            )} />
          )}
        </button>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        onNotificationRead={fetchNotificationCount} // Refresh count when notifications are read
      />
    </>
  );
}
