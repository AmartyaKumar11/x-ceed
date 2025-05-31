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
import { apiClient } from '../lib/api';

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, applications, interviews, updates
  const panelRef = useRef(null);

  // Load notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/api/notifications');
        if (response.success) {
          setNotifications(response.data);
        } else {
          // Fallback to mock data if API fails
          console.warn('Failed to fetch notifications, using mock data');
          loadMockNotifications();
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to mock data
        loadMockNotifications();
      }
    };

    const loadMockNotifications = () => {
      const mockNotifications = [
        {
          _id: '1',
          type: 'application_accepted',
          title: 'Application Accepted!',
          message: 'Your application for Senior Frontend Developer at TechCorp has been accepted. They want to schedule an interview.',
          company: 'TechCorp',
          position: 'Senior Frontend Developer',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: false,
          priority: 'high',
          actionRequired: true
        },
        {
          _id: '2',
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          message: 'Your interview with DataFlow Inc. is scheduled for tomorrow at 2:00 PM. Please join the video call using the link provided.',
          company: 'DataFlow Inc.',
          position: 'Full Stack Developer',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          isRead: false,
          priority: 'urgent',
          interviewDate: new Date(Date.now() + 22 * 60 * 60 * 1000), // tomorrow
          actionRequired: true
        },
        {
          _id: '3',
          type: 'application_rejected',
          title: 'Application Update',
          message: 'Thank you for your interest in the UI/UX Designer position at CreativeStudio. After careful consideration, we have decided to move forward with other candidates.',
          company: 'CreativeStudio',
          position: 'UI/UX Designer',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          isRead: true,
          priority: 'low',
          actionRequired: false
        },
        {
          _id: '4',
          type: 'interview_reminder',
          title: 'Interview Reminder',
          message: 'Reminder: You have an interview with StartupXYZ in 2 hours. Make sure you have prepared your portfolio and tested your camera/microphone.',
          company: 'StartupXYZ',
          position: 'Product Designer',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isRead: false,
          priority: 'urgent',
          interviewDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // in 2 hours
          actionRequired: true
        },
        {
          _id: '5',
          type: 'profile_view',
          title: 'Profile Viewed',
          message: 'A recruiter from InnovateTech viewed your profile and showed interest in your background.',
          company: 'InnovateTech',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          isRead: true,
          priority: 'medium',
          actionRequired: false
        },
        {
          _id: '6',
          type: 'application_accepted',
          title: 'Great News!',
          message: 'CloudTech Solutions loved your portfolio and wants to move forward with your application for the React Developer position.',
          company: 'CloudTech Solutions',
          position: 'React Developer',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          isRead: false,
          priority: 'high',
          actionRequired: true
        },
        {
          _id: '7',
          type: 'interview_scheduled',
          title: 'Final Round Interview',
          message: 'Congratulations! You\'ve been selected for the final round interview with TechGiant Corp. The interview is scheduled for next week.',
          company: 'TechGiant Corp',
          position: 'Senior Software Engineer',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          isRead: true,
          priority: 'high',
          interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
          actionRequired: true
        },
        {
          _id: '8',
          type: 'profile_view',
          title: 'Profile Interest',
          message: 'Multiple recruiters from top tech companies have viewed your profile this week. Consider updating your skills section.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          isRead: false,
          priority: 'medium',
          actionRequired: false
        }
      ];
      setNotifications(mockNotifications);
    };

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
        return <Bell size={iconSize} className="text-gray-600" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
  };

  // Handle notification actions
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, isRead: true } : notif
      )
    );
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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Render notification card
  const renderNotificationCard = (notification) => (
    <div
      key={notification._id}
      className={`p-4 border border-gray-100 rounded-xl transition-all hover:shadow-md cursor-pointer ${
        !notification.isRead ? 'bg-blue-50 bg-opacity-60 border-blue-200' : 'bg-white bg-opacity-40'
      } ${isUpcomingInterview(notification) ? 'border-l-4 border-l-red-500' : ''}`}
      onClick={() => markAsRead(notification._id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`text-sm font-semibold text-black ${!notification.isRead ? 'font-bold' : ''}`}>
              {notification.title}
            </h3>
            <div className="flex items-center gap-2">
              {/* Priority Badge */}
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
                {notification.priority}
              </span>
              {/* Actions Menu */}
              <div className="relative group">
                <button className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical size={14} className="text-gray-600" />
                </button>
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      snoozeNotification(notification._id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Timer size={12} />
                    Snooze 1hr
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left"
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
              <span className="text-xs font-medium text-gray-900">{notification.company}</span>
              {notification.position && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">{notification.position}</span>
                </>
              )}
            </div>
          )}

          {/* Message */}
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {notification.message}
          </p>

          {/* Interview Date Warning */}
          {isUpcomingInterview(notification) && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <Clock size={14} className="text-red-600" />
              <span className="text-xs font-medium text-red-800">
                Interview in {Math.ceil((notification.interviewDate - new Date()) / (1000 * 60 * 60 * 24))} day(s)
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.timestamp)}
            </span>
            {notification.actionRequired && (
              <button className="text-xs bg-black text-white px-3 py-1 rounded-full hover:bg-gray-800 transition-colors">
                Take Action
              </button>
            )}
          </div>
        </div>

        {/* Unread Indicator */}
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );

  // Render empty state for each tab
  const renderEmptyState = (type) => {
    const emptyStates = {
      all: {
        icon: <Bell size={48} className="text-gray-300 mb-4" />,
        title: "No notifications",
        message: "You're all caught up!"
      },
      applications: {
        icon: <Briefcase size={48} className="text-gray-300 mb-4" />,
        title: "No application updates",
        message: "Your applications will appear here"
      },
      interviews: {
        icon: <Calendar size={48} className="text-gray-300 mb-4" />,
        title: "No interview updates",
        message: "Your interviews will appear here"
      },
      updates: {
        icon: <Bell size={48} className="text-gray-300 mb-4" />,
        title: "No updates",
        message: "Profile views and other updates will appear here"
      }
    };

    const state = emptyStates[type] || emptyStates.all;

    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        {state.icon}
        <p className="text-lg font-medium">{state.title}</p>
        <p className="text-sm">{state.message}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-10 backdrop-blur-sm" onClick={onClose} />
      
      {/* Notification Panel */}
      <div 
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-96 shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out rounded-l-3xl overflow-hidden flex flex-col"
        style={{ 
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0" 
             style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-black" />
            <h2 className="text-xl font-bold text-black">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Actions Bar */}
        {unreadCount > 0 && (
          <div className="p-4 border-b border-gray-200 flex-shrink-0" 
               style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Tabs and Content - This is the main scrollable area */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="h-full flex flex-col">
            {/* Tabs List */}
            <div className="flex-shrink-0 p-4 pb-2" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="applications" className="text-xs">Apps</TabsTrigger>
                <TabsTrigger value="interviews" className="text-xs">Interviews</TabsTrigger>
                <TabsTrigger value="updates" className="text-xs">Updates</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* All Tab */}
              <TabsContent value="all" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('all')
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('applications')
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Interviews Tab */}
              <TabsContent value="interviews" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('interviews')
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredNotifications.map(renderNotificationCard)}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Updates Tab */}
              <TabsContent value="updates" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                  {filteredNotifications.length === 0 ? (
                    renderEmptyState('updates')
                  ) : (
                    <div className="space-y-1 p-2">
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
