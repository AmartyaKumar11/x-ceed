'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  FileText, 
  User, 
  Star, 
  Bell, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import JobCountBadge from '@/components/JobCountBadge';
import { clientAuth } from '@/lib/auth';

export default function ApplicantDashboardPage() {
  const router = useRouter();
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);

  useEffect(() => {
    fetchSavedJobsCount();
  }, []);

  const fetchSavedJobsCount = async () => {
    try {
      if (!clientAuth.isAuthenticated()) {
        setLoadingSavedJobs(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/saved-jobs/count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedJobsCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching saved jobs count:', error);
    } finally {
      setLoadingSavedJobs(false);
    }
  };

  const handleSavedJobsClick = () => {
    router.push('/dashboard/applicant/saved-jobs');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6 text-foreground">Welcome back</h2>
      
      {/* Stats Cards */}      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">        <div className="bg-card p-6 rounded-lg border border-border flex items-start shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/applicant/jobs'}>
          <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950 mr-4">
            <Briefcase className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available Jobs</p>
            <JobCountBadge />
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-border flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-green-50 dark:bg-green-950 mr-4">
            <FileText className="h-6 w-6 text-green-500 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Applications</p>
            <h3 className="text-2xl font-bold text-foreground">3</h3>
          </div>
        </div>
          <div className="bg-card p-6 rounded-lg border border-border flex items-start shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleSavedJobsClick}>
          <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-950 mr-4">
            <Star className="h-6 w-6 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saved Jobs</p>
            {loadingSavedJobs ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <h3 className="text-2xl font-bold text-foreground">{savedJobsCount}</h3>
            )}
          </div>
        </div>
      </div>
        {/* Main Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
            <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
            Recent Applications
          </h3>
          <div className="space-y-4">            <div className="p-4 border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => console.log('Application clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium text-foreground">Senior Frontend Developer</h4>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Applied</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">TechCorp Inc.</p>
              <p className="text-xs text-muted-foreground/70 mt-2">Applied on May 28, 2025</p>
            </div>
            
            <div className="p-4 border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => console.log('Application clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium text-foreground">UI/UX Designer</h4>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Interview</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">DesignHub</p>
              <p className="text-xs text-muted-foreground/70 mt-2">Applied on May 25, 2025</p>
            </div>
            
            <div className="p-4 border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => console.log('Application clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium text-foreground">React Developer</h4>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Reviewing</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">AppWorks Solutions</p>
              <p className="text-xs text-muted-foreground/70 mt-2">Applied on May 22, 2025</p>
            </div>
          </div>
        </div>        
        {/* Profile Completion */}        <div className="bg-card p-6 rounded-lg border border-border shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
            <User className="h-5 w-5 mr-2 text-muted-foreground" />
            Profile Completion
          </h3><div className="mb-4 bg-muted rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Your profile is 70% complete</p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              <span className="text-sm text-foreground">Personal information</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              <span className="text-sm text-foreground">Education</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
              <span className="text-sm text-foreground">Work experience</span>
            </div>
            <div className="flex items-center opacity-50">
              <Bell className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Add your skills</span>
            </div>            <div className="flex items-center opacity-50">
              <Bell className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Upload your resume</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
