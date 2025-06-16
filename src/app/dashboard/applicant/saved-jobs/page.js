'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Bookmark,
  BookmarkX,
  AlertCircle,
  Loader2,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clientAuth } from '@/lib/auth';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  const [removingJobId, setRemovingJobId] = useState(null);
  const [jobsWithPrepPlans, setJobsWithPrepPlans] = useState(new Set());useEffect(() => {
    checkAuthAndFetchSavedJobs();
    loadPrepPlanStatus();
  }, []);

  const loadPrepPlanStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/prep-plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const prepPlans = result.data || [];
        
        // Create a set of job identifiers that have prep plans
        const jobsWithPlans = new Set();
        prepPlans.forEach(plan => {
          if (plan.jobId) {
            jobsWithPlans.add(plan.jobId);
          }
          // Also add by title-company combination for matching
          const jobKey = `${plan.jobTitle}-${plan.companyName}`.replace(/\s+/g, '-').toLowerCase();
          jobsWithPlans.add(jobKey);
        });
        
        setJobsWithPrepPlans(jobsWithPlans);
      }
    } catch (error) {
      console.error('Error loading prep plan status:', error);
    }
  };

  const markPrepPlanCreated = (jobId) => {
    try {
      const currentStatus = new Set(jobsWithPrepPlans);
      currentStatus.add(jobId);
      setJobsWithPrepPlans(currentStatus);
      
      // Save to localStorage
      localStorage.setItem('prepPlanStatus', JSON.stringify([...currentStatus]));
    } catch (error) {
      console.error('Error saving prep plan status:', error);
    }
  };

  const checkAuthAndFetchSavedJobs = async () => {
    try {
      // Check if user is authenticated
      if (!clientAuth.isAuthenticated()) {
        router.push('/auth');
        return;
      }

      // Check if user is an applicant
      const userRole = clientAuth.getUserRole();
      if (userRole !== 'applicant') {
        router.push('/dashboard/recruiter');
        return;
      }

      await fetchSavedJobs();
    } catch (error) {
      console.error('Error during auth check:', error);
      router.push('/auth');
    }
  };

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/saved-jobs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedJobs(data.data || []);
        } else {
          setError('Failed to load saved jobs');
        }
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        clientAuth.logout();
        router.push('/auth');
        return;
      } else {
        setError('Failed to load saved jobs');
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      setError('An error occurred while loading saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId) => {
    setRemovingJobId(jobId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/saved-jobs?jobId=${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the job from local state
        setSavedJobs(prev => prev.filter(saved => saved.jobId !== jobId));
      } else {
        alert('Failed to remove job from saved jobs');
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      alert('An error occurred while removing the job');
    } finally {
      setRemovingJobId(null);
    }
  };
  const handleJobClick = (job) => {
    // Navigate to job details or open application dialog
    // For now, we'll just log it
    console.log('Job clicked:', job);
  };  const handleCreatePrepPlan = async (e, job) => {
    e.stopPropagation(); // Prevent card click event
    
    try {
      // Create prep plan record in database
      const prepPlanData = await createPrepPlanRecord(job);
      
      if (prepPlanData) {
        // Navigate to prep plan page with job data
        const jobData = encodeURIComponent(JSON.stringify({
          _id: job._id,
          title: job.title,
          companyName: job.companyName,
          description: job.description,
          requirements: job.requirements || [],
          location: job.location,
          salaryRange: job.salaryRange,
          jobType: job.jobType
        }));
        router.push(`/dashboard/applicant/prep-plan?job=${jobData}`);
      }
    } catch (error) {
      console.error('Error creating prep plan:', error);
    }
  };

  const createPrepPlanRecord = async (jobData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token available');
        return null;
      }

      const response = await fetch('/api/prep-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },        body: JSON.stringify({
          jobId: jobData._id,
          jobTitle: jobData.title,
          companyName: jobData.companyName || jobData.company || 'Company Not Specified',
          jobDescription: jobData.description || jobData.jobDescriptionText,
          requirements: jobData.requirements,
          location: jobData.location,
          salaryRange: jobData.salaryRange || `${jobData.salaryMin || 0}-${jobData.salaryMax || 0} ${jobData.currency || 'USD'}`,
          jobType: jobData.jobType,
          department: jobData.department,
          level: jobData.level,
          workMode: jobData.workMode,
          source: 'saved-jobs'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Prep plan created successfully');
        return result.data;
      } else if (response.status === 409) {
        // Prep plan already exists
        console.log('ℹ️ Prep plan already exists for this job');
        return { existing: true };
      } else {
        console.log('⚠️ Failed to create prep plan');
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating prep plan record:', error);
      return null;
    }
  };

  // Format the posted date as a relative time
  const formatPostedDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  // Format salary range
  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(0)}M`;
      }
      return `${(num / 1000).toFixed(0)}K`;
    };
    
    const currencySymbol = currency === 'USD' ? '$' : currency;
    
    if (min && max) {
      return `${currencySymbol}${formatNumber(min)} - ${currencySymbol}${formatNumber(max)}`;
    } else if (min) {
      return `From ${currencySymbol}${formatNumber(min)}`;
    } else if (max) {
      return `Up to ${currencySymbol}${formatNumber(max)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading saved jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load saved jobs</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchSavedJobs}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saved Jobs</h1>
          <p className="text-muted-foreground mt-1">
            {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Saved Jobs Grid */}
      {savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No saved jobs yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Start saving jobs that interest you to keep track of them here.
          </p>
          <Button 
            onClick={() => router.push('/dashboard/applicant/jobs')}
            className="bg-primary text-primary-foreground"
          >
            Browse Jobs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedJobs.map((savedJob) => {
            const job = savedJob.jobDetails;
            if (!job) return null;

            return (
              <Card 
                key={savedJob._id} 
                className="hover:shadow-lg transition-all cursor-pointer border-border"
                onClick={() => handleJobClick(job)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Building className="h-3 w-3 mr-1" />
                        {job.companyName || savedJob.companyName || 'Company Name'}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={removingJobId === savedJob.jobId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveJob(savedJob.jobId);
                      }}
                    >
                      {removingJobId === savedJob.jobId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BookmarkX className="h-4 w-4 text-red-500 hover:text-red-600" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-y-2 mb-3">
                    <div className="flex items-center text-sm text-muted-foreground mr-4">
                      <MapPin className="h-3 w-3 mr-1" />
                      {job.workMode} {job.location ? `(${job.location})` : ''}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mr-4">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Posted {formatPostedDate(job.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {job.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {job.jobType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {job.department}
                    </Badge>
                  </div>

                  {job.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                  )}                </CardContent>
                <CardFooter className="pt-4 flex-col gap-3">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span>Saved {formatPostedDate(savedJob.savedAt)}</span>
                    <span>{job.numberOfOpenings} opening{job.numberOfOpenings !== 1 ? 's' : ''}</span>                  </div>                  {(() => {
                    const jobId = job._id;
                    const jobKey = `${job.title}-${job.companyName}`.replace(/\s+/g, '-').toLowerCase();
                    const hasPrepPlan = jobsWithPrepPlans.has(jobId) || jobsWithPrepPlans.has(jobKey);
                    
                    return (
                      <Button
                        onClick={(e) => handleCreatePrepPlan(e, job)}
                        className={`w-full transition-colors ${
                          hasPrepPlan 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        }`}
                        size="sm"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        {hasPrepPlan ? 'View Prep Plan' : 'Create Prep Plan'}
                      </Button>
                    );
                  })()}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
