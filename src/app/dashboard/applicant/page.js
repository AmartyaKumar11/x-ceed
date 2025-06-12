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
  Loader2,
  Edit,
  TrendingUp,
  Target
} from 'lucide-react';
import JobCountBadge from '@/components/JobCountBadge';
import { clientAuth } from '@/lib/auth';
import ProfileSettingsDialog from '@/components/ProfileSettingsDialog';
import { useToast } from '@/components/ui/use-toast';

export default function ApplicantDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [completionAnimation, setCompletionAnimation] = useState('');
  const [lastCompletionPercentage, setLastCompletionPercentage] = useState(0);
  useEffect(() => {
    fetchSavedJobsCount();
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      if (!clientAuth.isAuthenticated()) {
        setLoadingProfile(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/applicant/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfileData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

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
      console.error('Error fetching saved jobs count:', error);    } finally {
      setLoadingSavedJobs(false);
    }
  };

  const calculateProfileCompletion = () => {
    if (!profileData) return { percentage: 0, completed: [], pending: [] };

    // Only include fields that were part of the original registration process
    const fields = [
      { 
        key: 'personal', 
        label: 'Personal Information', 
        check: () => profileData.firstName && profileData.lastName && profileData.email 
      },
      { 
        key: 'education', 
        label: 'Education', 
        check: () => profileData.education && profileData.education.length > 0 && 
                    profileData.education.some(edu => edu.institution && edu.degree)
      },
      { 
        key: 'contact', 
        label: 'Contact Information', 
        check: () => profileData.phone && (profileData.city || profileData.address)
      },
      { 
        key: 'experience', 
        label: 'Work Experience',        check: () => profileData.workExperience && profileData.workExperience.length > 0 && 
                    profileData.workExperience.some(exp => exp.company && exp.position)
      }
    ];

    const completed = fields.filter(field => field.check());
    const pending = fields.filter(field => !field.check());
    const percentage = Math.round((completed.length / fields.length) * 100);

    return { percentage, completed, pending };  };

  const profileCompletion = calculateProfileCompletion();

  const handleProfileDialogClose = async () => {
    setProfileDialogOpen(false);
    const oldPercentage = profileCompletion.percentage;
    
    // Refresh profile data after dialog closes and wait for it to complete
    await fetchProfileData();
    
    // Show animation if profile was completed - with a small delay to ensure state update
    setTimeout(() => {
      const newCompletion = calculateProfileCompletion();
      console.log('🔍 Profile completion check after dialog close:', {
        oldPercentage,
        newPercentage: newCompletion.percentage,
        profileData: {
          hasEducation: profileData?.education?.length > 0,
          hasExperience: profileData?.workExperience?.length > 0,
          hasPersonal: !!(profileData?.firstName && profileData?.lastName && profileData?.email),
          hasContact: !!(profileData?.phone && (profileData?.city || profileData?.address))
        }
      });
      
      if (newCompletion.percentage === 100 && oldPercentage < 100) {
        setCompletionAnimation('animate-pulse');
        setTimeout(() => setCompletionAnimation(''), 2000);
        
        // Show toast notification
        toast({
          title: "Profile Complete! 🎉",
          description: "Your profile is now 100% complete. You're ready to apply for jobs and get noticed by recruiters!",
          variant: "success",
        });      }
    }, 500); // Reduced timeout to be more responsive
  };

  // Real-time profile completion check (called when sections are saved)
  const handleProfileUpdate = async () => {
    console.log('🔔 Profile update notification received');
    const oldPercentage = profileCompletion.percentage;
    
    // Refresh profile data and check completion
    await fetchProfileData();
    
    // Check completion status after a brief delay to ensure state updates
    setTimeout(() => {
      const newCompletion = calculateProfileCompletion();
      console.log('🔍 Real-time profile completion check:', {
        oldPercentage,
        newPercentage: newCompletion.percentage,
        wasComplete: oldPercentage === 100,
        isComplete: newCompletion.percentage === 100
      });
      
      if (newCompletion.percentage === 100 && oldPercentage < 100) {
        setCompletionAnimation('animate-pulse');
        setTimeout(() => setCompletionAnimation(''), 2000);
        
        // Show toast notification
        toast({
          title: "Profile Complete! 🎉",
          description: "Your profile is now 100% complete. You're ready to apply for jobs and get noticed by recruiters!",
          variant: "success",
        });
        
        console.log('🎉 Profile completion toast triggered!');
      }
    }, 500);
  };

  const handleSavedJobsClick = () => {
    router.push('/dashboard/applicant/saved-jobs');
  };

  // Don't render profile completion card if 100% complete
  const shouldShowProfileCompletion = profileCompletion.percentage < 100;

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
        </div>          {/* Profile Completion - Only show if not 100% complete */}
        {shouldShowProfileCompletion && (
          <div 
            className={`bg-card p-6 rounded-lg border border-border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${completionAnimation}`}
            onClick={() => setProfileDialogOpen(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                Profile Completion
              </h3>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{profileCompletion.percentage}%</span>
              </div>
            </div>            {/* Dynamic Progress Bar */}
            <div className="mb-4 bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-white dark:to-gray-100 h-3 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${profileCompletion.percentage}%` }}
              >
                {profileCompletion.percentage > 0 && (
                  <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 animate-pulse rounded-full"></div>
                )}
              </div>
            </div>

            {loadingProfile ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Loading profile...</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your profile to get better job matches
                </p>
                
                <div className="space-y-3">
                  {/* Completed Fields */}
                  {profileCompletion.completed.map((field, index) => (
                    <div key={field.key} className="flex items-center animate-fade-in">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-foreground">{field.label}</span>
                    </div>
                  ))}
                  
                  {/* Pending Fields */}
                  {profileCompletion.pending.slice(0, 3).map((field, index) => (
                    <div key={field.key} className="flex items-center opacity-60">
                      <Bell className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Add {field.label.toLowerCase()}</span>
                    </div>
                  ))}
                  
                  {profileCompletion.pending.length > 3 && (
                    <div className="flex items-center opacity-60">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        +{profileCompletion.pending.length - 3} more sections
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Click to continue</span>
                    <Edit className="h-4 w-4 text-primary" />
                  </div>                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog 
        isOpen={profileDialogOpen}
        onClose={handleProfileDialogClose}
        onProfileUpdate={handleProfileUpdate}
        userRole="applicant"
      />
    </div>
  );
}
