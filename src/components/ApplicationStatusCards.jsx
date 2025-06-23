'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { 
  Clock, 
  Eye, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const ApplicationStatusCards = () => {
  const { refreshTrigger } = useAnalytics();
  const [statusData, setStatusData] = useState({
    pending: 0,
    reviewing: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());  useEffect(() => {
    fetchApplicationStats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchApplicationStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);
  // Listen for external refresh triggers from context
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchApplicationStats();
    }
  }, [refreshTrigger]);

  const fetchApplicationStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get all applications for the recruiter
      const response = await fetch('/api/applications/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();        if (data.success) {
          setStatusData(data.stats);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching application stats:', error);
    } finally {
      setLoading(false);
    }  };

  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchApplicationStats();
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastUpdated) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  const statusConfig = [
    {
      key: 'pending',
      label: 'Pending Review',
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-600',
      iconColor: 'text-yellow-600',
      description: 'New applications'
    },
    {
      key: 'reviewing',
      label: 'Under Review',
      icon: Eye,
      color: 'bg-blue-500/10 text-blue-600',
      iconColor: 'text-blue-600',
      description: 'Being evaluated'
    },
    {
      key: 'interview',
      label: 'Interview Stage',
      icon: Calendar,
      color: 'bg-purple-500/10 text-purple-600',
      iconColor: 'text-purple-600',
      description: 'Scheduled interviews'
    },
    {
      key: 'accepted',
      label: 'Accepted',
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-600',
      iconColor: 'text-green-600',
      description: 'Successful hires'
    },
    {
      key: 'rejected',
      label: 'Rejected',      icon: XCircle,
      color: 'bg-red-500/10 text-red-600',
      iconColor: 'text-red-600',
      description: 'Not selected'
    }
  ];

  const calculatePercentage = (value) => {
    if (statusData.total === 0) return 0;
    return Math.round((value / statusData.total) * 100);
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewing': return 'bg-blue-500';
      case 'interview': return 'bg-purple-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card p-4 rounded-lg border shadow animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="bg-card p-6 rounded-lg border shadow-md">        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">Application Analytics</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{statusData.total} Total Applications</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Updated {formatLastUpdated()}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="p-1.5 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusConfig.map((status) => {
            const count = statusData[status.key];
            const percentage = calculatePercentage(count);
            const Icon = status.icon;

            return (
              <div
                key={status.key}
                className="bg-background p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-full ${status.color}`}>
                    <Icon className={`h-4 w-4 ${status.iconColor}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{count}</div>
                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{status.label}</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(status.key)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{status.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Insights */}
        {statusData.total > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">Quick Insights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Success Rate: </span>
                <span className="text-green-600">
                  {statusData.total > 0 ? Math.round((statusData.accepted / statusData.total) * 100) : 0}%
                </span>
              </div>
              <div>
                <span className="font-medium">Interview Rate: </span>
                <span className="text-purple-600">
                  {statusData.total > 0 ? Math.round(((statusData.interview + statusData.accepted) / statusData.total) * 100) : 0}%
                </span>
              </div>
              <div>
                <span className="font-medium">Pending Review: </span>
                <span className="text-yellow-600">{statusData.pending} applications</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatusCards;
