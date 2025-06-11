'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Bookmark,
  FileText,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export default function RealJobsComponent({ onJobClick }) {
  const { resolvedTheme } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);
  const [applicationDialog, setApplicationDialog] = useState({
    isOpen: false,
    selectedJob: null
  });
  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, []);const fetchJobs = async () => {
    setLoading(true);
    try {
      console.log('🔍 RealJobsComponent: Starting fetchJobs...');
      // Call the jobs API to get public jobs from the database using direct fetch
      const response = await fetch('/api/jobs?public=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 RealJobsComponent: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ RealJobsComponent: Received data:', data);
        if (data && data.success) {
          console.log('📊 RealJobsComponent: Setting jobs:', data.data?.length, 'jobs');
          setJobs(data.data || []);
        } else {
          console.error('❌ RealJobsComponent: API returned unsuccessful response:', data);
          setError('Failed to load jobs. Please try again later.');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ RealJobsComponent: API request failed:', response.status, errorText);
        setError('Failed to load jobs. Please try again later.');
      }    } catch (error) {
      console.error('❌ RealJobsComponent: Error fetching jobs:', error);
      setError('An error occurred while loading jobs.');
    } finally {
      console.log('🏁 RealJobsComponent: Finished fetchJobs, setting loading to false');
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // User not logged in

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
          const savedJobIds = new Set(data.data.map(saved => saved.jobId));
          setSavedJobs(savedJobIds);
        }
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleSaveJob = async (jobId, e) => {
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to save jobs');
      return;
    }

    setSavingJobId(jobId);
    const isSaved = savedJobs.has(jobId);

    try {
      if (isSaved) {
        // Remove from saved jobs
        const response = await fetch(`/api/saved-jobs?jobId=${jobId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setSavedJobs(prev => {
            const newSaved = new Set(prev);
            newSaved.delete(jobId);
            return newSaved;
          });
        } else {
          alert('Failed to remove job from saved jobs');
        }
      } else {
        // Add to saved jobs
        const response = await fetch('/api/saved-jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ jobId })
        });

        if (response.ok) {
          setSavedJobs(prev => new Set(prev).add(jobId));
        } else if (response.status === 409) {
          // Job already saved
          setSavedJobs(prev => new Set(prev).add(jobId));
        } else {
          alert('Failed to save job');
        }
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSavingJobId(null);
    }
  };
  // Format the posted date as a relative time (e.g., "2 days ago")
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
    }  };

  const handleApplyJob = (job) => {
    setApplicationDialog({
      isOpen: true,
      selectedJob: job
    });  };

  const handleCloseApplicationDialog = () => {
    setApplicationDialog({
      isOpen: false,
      selectedJob: null
    });
  };
  if (loading) {
    console.log('🔄 RealJobsComponent: Currently loading...');
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading job listings...</p>
      </div>
    );
  }

  if (error) {
    console.log('❌ RealJobsComponent: Error state:', error);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load jobs</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchJobs}>
          Try Again
        </Button>
      </div>
    );
  }
  if (jobs.length === 0) {
    console.log('📭 RealJobsComponent: No jobs to display');
    return (      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No jobs available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are currently no job postings available. Please check back later.
        </p>
      </div>
    );
  }

  console.log('🎯 RealJobsComponent: About to render', jobs.length, 'jobs');
  console.log('📋 RealJobsComponent: Jobs array:', jobs.map(job => ({ id: job._id, title: job.title })));return (
    <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 job-cards-container pr-2">
        {jobs.map((job) => (<Card 
          key={job._id} 
          className="job-card hover:shadow-lg transition-all cursor-pointer border-border"
          onClick={() => onJobClick(job)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Building className="h-3 w-3 mr-1" />
                  {job.companyName || 'Company Name'}
                </CardDescription>
              </div>              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                disabled={savingJobId === job._id}
                onClick={(e) => handleSaveJob(job._id, e)}
              >
                {savingJobId === job._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bookmark 
                    className={`h-4 w-4 transition-colors ${
                      savedJobs.has(job._id) 
                        ? resolvedTheme === 'dark' 
                          ? 'fill-white text-white' 
                          : 'fill-black text-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`} 
                  />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>            <div className="flex flex-wrap gap-y-2 mb-3">
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
                Posted {formatPostedDate(job.createdAt || new Date())}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="font-normal">
                {job.jobType || 'Full-time'}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {job.department || 'General'}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {job.level || 'Entry Level'}
              </Badge>
            </div>          </CardContent>          <CardFooter className="flex flex-wrap gap-2 justify-end">            <Button 
              variant="outline" 
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                if (job.jobDescriptionFile) {
                  try {
                    // Extract filename from the URL (e.g., "/uploads/job-descriptions/file.pdf")
                    const filename = job.jobDescriptionFile.split('/').pop();
                    
                    // Use the new download API
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/download/job-description/${filename}`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });

                    if (response.ok) {
                      // Get the blob and create download link
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${job.title.replace(/\s+/g, '-')}-job-description.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } else {
                      console.error('Failed to download job description');
                      // Fallback to opening in new tab
                      window.open(job.jobDescriptionFile, '_blank');
                    }
                  } catch (error) {
                    console.error('Error downloading job description:', error);
                    // Fallback to opening in new tab
                    window.open(job.jobDescriptionFile, '_blank');
                  }
                } else {
                  // Generate a text file with job details if no file is available
                  const jobDetails = `
Job Title: ${job.title}
Company: ${job.companyName || 'Not specified'}
Department: ${job.department || 'Not specified'}
Level: ${job.level || 'Not specified'}
Work Mode: ${job.workMode || 'Not specified'}
Location: ${job.location || 'Not specified'}
Salary: ${formatSalary(job.salaryMin, job.salaryMax, job.currency)}
Job Type: ${job.jobType || 'Not specified'}
Description: ${job.description || 'No description provided.'}
                  `;
                  
                  const blob = new Blob([jobDetails], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${job.title.replace(/\s+/g, '-')}-job-description.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download JD
            </Button>            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Match resume with job:', job._id);
                // You would implement the resume matching functionality here
                alert('Resume matching feature will be available soon!');
              }}
              className="flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              Match Resume
            </Button>
            <Button variant="outline" size="sm">View Details</Button>
          </CardFooter>
        </Card>      ))}      </div>
    </div>
  );
}
