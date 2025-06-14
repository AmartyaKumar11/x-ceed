'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Briefcase, 
  Clock, 
  Timer,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function NotificationPanel({ isOpen, onClose, onNotificationRead }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, applications, interviews, updates
  const [removingNotifications, setRemovingNotifications] = useState(new Set()); // Track notifications being removed
  const panelRef = useRef(null);// Load notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found, showing empty notifications');
          setNotifications([]);
          return;
        }

        console.log('Fetching notifications with token...');
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API Response data:', data);
          
          // Fix: API returns { success: true, notifications: [...] }, not { success: true, data: [...] }
          if (data.success && data.notifications) {
            console.log('Successfully fetched', data.notifications.length, 'notifications from API');
            setNotifications(data.notifications);
            return;
          } else if (data.success && Array.isArray(data.notifications)) {
            // Handle case where notifications array is empty but success is true
            console.log('API returned empty notifications array');
            setNotifications([]);
            return;
          } else {
            console.warn('API response successful but unexpected format:', data);
            setNotifications([]);
            return;
          }
        } else {
          const errorText = await response.text();
          console.warn('API response not ok:', response.status, errorText);
          setNotifications([]);
          return;
        }
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };    /* Mock notifications removed - using real API data only
    const loadMockNotifications = () => {
      const mockNotifications = [
        // ... mock data removed for brevity
      ];
      setNotifications(mockNotifications);
    };
    */

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'applications') return ['application_accepted', 'application_rejected'].includes(notification.type);
    if (filter === 'interviews') return ['interview_scheduled', 'interview_reminder'].includes(notification.type);
    if (filter === 'updates') return ['profile_view'].includes(notification.type);
    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconSize = 20;
    switch (type) {
      case 'application_accepted':
        return <CheckCircle size={iconSize} className="text-green-600" />;
      case 'application_rejected':
        return <XCircle size={iconSize} className="text-red-600" />;
      case 'interview_scheduled':
      case 'interview_reminder':
        return <Calendar size={iconSize} className="text-blue-600" />;
      case 'profile_view':
        return <Briefcase size={iconSize} className="text-purple-600" />;
      default:
        return <Bell size={iconSize} className="text-muted-foreground" />;
    }
  };
  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800';
      case 'low':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Check if interview is upcoming (within 2 days)
  const isUpcomingInterview = (notification) => {
    if (!notification.interviewDate) return false;
    const now = new Date();
    const timeDiff = notification.interviewDate - now;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    return daysDiff <= 2 && daysDiff > 0;
  };  // Handle notification actions
  const markAsRead = async (id) => {
    try {
      // Add to removing set for animation
      setRemovingNotifications(prev => new Set(prev).add(id));
      
      // Wait for slide animation to complete
      setTimeout(async () => {
        // Make API call to mark as read
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          // Trigger callback to update notification count
          if (onNotificationRead) {
            onNotificationRead();
          }
        }
        
        // Remove the notification from the list entirely
        setNotifications(prev => prev.filter(notif => notif._id !== id));
        
        // Remove from removing set
        setRemovingNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 300); // Animation duration
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Remove from removing set on error
      setRemovingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const snoozeNotification = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, snoozed: true, snoozeUntil: new Date(Date.now() + 60 * 60 * 1000) } : notif
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif._id !== id));
  };
  const markAllAsRead = async () => {
    try {
      // Update UI immediately
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));

      // Make API call to mark all as read
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/notifications/mark-all-read', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Trigger callback to update notification count
        if (onNotificationRead) {
          onNotificationRead();
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;  // Render notification card
  const renderNotificationCard = (notification) => {
    const isRemoving = removingNotifications.has(notification._id);
    
    return (
      <div
        key={notification._id}
        className={`p-4 border border-border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${
          !notification.read 
            ? 'bg-primary/10 border-primary/20 dark:bg-primary/5' 
            : 'bg-card/40 hover:bg-card/60 dark:bg-card/20 dark:hover:bg-card/30'
        } ${isUpcomingInterview(notification) ? 'border-l-4 border-l-red-500' : ''} ${
          isRemoving 
            ? 'opacity-0 transform translate-x-full scale-95 max-h-0 p-0 mb-0 border-transparent' 
            : 'opacity-100 transform translate-x-0 scale-100 hover:shadow-md max-h-96'
        }`}
        style={{
          marginBottom: isRemoving ? '0' : '0.25rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={() => !isRemoving && !notification.read && markAsRead(notification._id)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`text-sm font-semibold text-foreground ${!notification.read ? 'font-bold' : ''}`}>
                {notification.title}
              </h3>
              <div className="flex items-center gap-2">
                {/* Priority Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </span>
                {/* Actions Menu */}
                <div className="relative group">
                  <button className="p-1 hover:bg-accent rounded transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={14} className="text-muted-foreground" />
                  </button>
                  <div className="absolute right-0 top-6 bg-card border border-border rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        snoozeNotification(notification._id);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent w-full text-left"
                    >
                      <Timer size={12} />
                      Snooze 1hr
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full text-left"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Company and Position */}
            {notification.company && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-foreground">{notification.company}</span>
                {notification.position && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{notification.position}</span>
                  </>
                )}
              </div>
            )}

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {notification.message}
            </p>

            {/* Interview Date Warning */}
            {isUpcomingInterview(notification) && (              <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                <Clock size={14} className="text-red-600" />
                <span className="text-xs font-medium text-red-800 dark:text-red-200">
                  Interview in {Math.ceil((notification.interviewDate - new Date()) / (1000 * 60 * 60 * 24))} day(s)
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(notification.timestamp)}
              </span>
              {/* Action Button - Show different text based on read status */}
              {!notification.read ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification._id);
                  }}
                  disabled={isRemoving}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    isRemoving 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/80'
                  }`}
                >
                  {isRemoving ? 'Marking...' : 'Mark as Read'}
                </button>
              ) : notification.actionRequired ? (
                <button className="text-xs bg-foreground text-background px-3 py-1 rounded-full hover:bg-foreground/80 transition-colors">
                  Take Action
                </button>
              ) : null}
            </div>
          </div>

          {/* Unread Indicator */}
          {!notification.read && (
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
          )}
        </div>
      </div>
    );
  };
  // Render empty state for each tab
  const renderEmptyState = (type) => {
    const emptyStates = {
      all: {
        icon: <Bell size={48} className="text-muted-foreground mb-4" />,
        title: "No notifications",
        message: "You're all caught up!"
      },
      applications: {
        icon: <Briefcase size={48} className="text-muted-foreground mb-4" />,
        title: "No application updates",
        message: "Your applications will appear here"
      },
      interviews: {
        icon: <Calendar size={48} className="text-muted-foreground mb-4" />,
        title: "No interview updates",
        message: "Your interviews will appear here"
      },
      updates: {
        icon: <Bell size={48} className="text-muted-foreground mb-4" />,
        title: "No updates",
        message: "Profile views and other updates will appear here"
      }
    };

    const state = emptyStates[type] || emptyStates.all;

    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        {state.icon}
        <p className="text-lg font-medium">{state.title}</p>
        <p className="text-sm">{state.message}</p>
      </div>
    );
  };return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm dark:backdrop-blur-md" onClick={onClose} />
      
      {/* Notification Panel */}
      <div 
        ref={panelRef}        className="absolute top-0 right-0 h-full w-96 shadow-2xl border-l border-border transform transition-transform duration-300 ease-in-out rounded-l-3xl overflow-hidden flex flex-col bg-background/85 backdrop-blur-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0 bg-background/70">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-foreground" />
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>        {/* Actions Bar */}
        {unreadCount > 0 && (
          <div className="p-4 border-b border-border flex-shrink-0 bg-background/50">
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Tabs and Content - This is the main scrollable area */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="h-full flex flex-col">
            {/* Tabs List */}            <div className="flex-shrink-0 p-4 pb-2 bg-background/50">
              <TabsList className="grid w-full grid-cols-4 bg-muted">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="applications" className="text-xs">Apps</TabsTrigger>
                <TabsTrigger value="interviews" className="text-xs">Interviews</TabsTrigger>
                <TabsTrigger value="updates" className="text-xs">Updates</TabsTrigger>
              </TabsList>
            </div>            {/* Tab Content - Scrollable */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* All Tab */}
              <TabsContent value="all" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('all')
                  ) : (
                    <div className="space-y-1 p-2 transition-all duration-300">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('applications')
                  ) : (
                    <div className="space-y-1 p-2 transition-all duration-300">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Interviews Tab */}
              <TabsContent value="interviews" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('interviews')
                  ) : (
                    <div className="space-y-1 p-2 transition-all duration-300">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Updates Tab */}
              <TabsContent value="updates" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('updates')
                  ) : (
                    <div className="space-y-1 p-2 transition-all duration-300">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
