'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign,
  Users,
  XCircle,
  FileText,
  Eye,
  ArrowLeftCircle,
  Download,
  Loader2,
  AlertCircle,
  Check,
  XIcon,
  Clock,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Filter,
  Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InterviewSchedulingDialog from "@/components/InterviewSchedulingDialog";

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidatesDialogOpen, setCandidatesDialogOpen] = useState(false);
  const [candidateDetailsDialogOpen, setCandidateDetailsDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [jobCandidates, setJobCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
    // New state for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  // New state for toggling between update status and communicate sections
  const [activeDetailsSection, setActiveDetailsSection] = useState('status'); // 'status' or 'communicate'
  const [totalCandidates, setTotalCandidates] = useState(0);
  const candidatesPerPage = 10;
  const [isConfirmCloseJobDialogOpen, setIsConfirmCloseJobDialogOpen] = useState(false);
  const [jobToClose, setJobToClose] = useState(null);
  const [updatingApplication, setUpdatingApplication] = useState(false);
  const [updateStatusMessage, setUpdateStatusMessage] = useState('');  const [updateStatusSuccess, setUpdateStatusSuccess] = useState(false);  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Interview scheduling dialog state
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [candidateForInterview, setCandidateForInterview] = useState(null);
  
  // Resume viewer dialog state
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [loadingResume, setLoadingResume] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);
  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // Call the jobs API to get recruiter's jobs using direct fetch
      const response = await fetch('/api/jobs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          console.log('Fetched recruiter jobs:', data.data);
          setJobs(data.data || []);
        } else {
          console.error('Failed to fetch jobs:', data);
          setError('Failed to load jobs. Please try again later.');
        }
      } else {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        setError('Failed to load jobs. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('An error occurred while loading jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCloseJob = (jobId) => {
    setJobToClose(jobId);
    setIsConfirmCloseJobDialogOpen(true);
  };
  const handleCloseJob = async () => {
    if (!jobToClose) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch('/api/jobs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: jobToClose,
          status: 'closed'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          // Update the jobs list
          setJobs(jobs.map(job => 
            job._id === jobToClose ? { ...job, status: 'closed' } : job
          ));
          setIsConfirmCloseJobDialogOpen(false);
          setJobToClose(null);
        } else {
          alert('Failed to close job. Please try again.');
        }
      } else {
        alert('Failed to close job. Please try again.');
      }
    } catch (error) {
      console.error('Error closing job:', error);
      alert('An error occurred. Please try again.');
    }
  };
  const fetchJobCandidates = async (jobId) => {
    setLoadingCandidates(true);
    try {
      // Call the applications API to get candidates with filters
      let url = `/api/applications?jobId=${jobId}`;

      // Add pagination
      url += `&page=${currentPage}&limit=${candidatesPerPage}`;

      // Add sorting
      if (sortOption === 'newest') {
        url += '&sort=date&order=desc';
      } else if (sortOption === 'oldest') {
        url += '&sort=date&order=asc';
      } else if (sortOption === 'name') {
        url += '&sort=name';
      }

      // Add status filter if not 'all'
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;      }
      
      try {
        // Ensure we have a valid token before making the API call
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ No authentication token found');
          setJobCandidates([]);
          setTotalCandidates(0);
          return;
        }
        
        console.log(`🔍 Fetching candidates for job ${jobId}...`);
        console.log(`📡 URL: ${url}`);
        
        // Use direct fetch instead of broken apiClient
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`📊 Response status: ${response.status}`);
          if (response.ok) {
          const data = await response.json();
          console.log('✅ Fetched job candidates:', data);
          console.log('🔍 Data structure received:', Object.keys(data));
          console.log('🔍 Applications array:', data.applications?.length || 0);
          
          if (data.success) {
            // Fix: API returns 'applications' not 'data'
            setJobCandidates(data.applications || []);
            setTotalCandidates(data.pagination ? data.pagination.total : (data.applications?.length || 0));
          } else {
            console.error('❌ API returned error:', data.message);
            setJobCandidates([]);
            setTotalCandidates(0);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ API request failed:', response.status, errorText);
          setJobCandidates([]);
          setTotalCandidates(0);
        }
      } catch (apiError) {
        console.error('❌ API error:', apiError);
        setJobCandidates([]);
        setTotalCandidates(0);
      }
    } catch (error) {
      console.error('❌ Error in fetchJobCandidates:', error);
      setJobCandidates([]);
      setTotalCandidates(0);
    } finally {
      setLoadingCandidates(false);
    }
  };
  
  useEffect(() => {
    if (selectedJob && candidatesDialogOpen) {
      fetchJobCandidates(selectedJob._id);
    }
  }, [selectedJob, candidatesDialogOpen, filterStatus, sortOption, currentPage]);
  
  // Generate mock candidates for demonstration purposes
  const generateMockCandidates = (jobId) => {
    return [
      {
        _id: '1',
        jobId: jobId,
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'pending',
        message: "I believe my experience in frontend development and my passion for creating user-friendly interfaces makes me an ideal candidate for this role. I've worked extensively with React and have built several projects that showcase my skills.",
        resumeUrl: 'https://example.com/resume1.pdf',
        applicant: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '(123) 456-7890',
          city: 'New York',
          state: 'NY',
          skills: [
            { name: 'React' },
            { name: 'JavaScript' },
            { name: 'HTML/CSS' },
            { name: 'Node.js' },
            { name: 'TypeScript' }
          ]
        }
      },
      {
        _id: '2',
        jobId: jobId,
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'reviewing',
        message: "I have 5+ years of experience in full stack development with a focus on React, Node.js, and MongoDB. I've led teams in building scalable web applications and I'm excited about the opportunity to join your company.",
        resumeUrl: 'https://example.com/resume2.pdf',
        applicant: {
          _id: 'user2',
          firstName: 'Emily',
          lastName: 'Johnson',
          email: 'emily.johnson@example.com',
          phone: '(234) 567-8901',
          city: 'Chicago',
          state: 'IL',
          skills: [
            { name: 'MongoDB' },
            { name: 'Express' },
            { name: 'React' },
            { name: 'Node.js' },
            { name: 'AWS' }
          ]
        }
      },
      {
        _id: '3',
        jobId: jobId,
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'interview',
        message: "I'm a recent CS graduate with a strong foundation in software engineering principles. During my studies, I completed several internships that gave me hands-on experience with React and Node.js development. I'm eager to apply my skills in a professional setting.",
        resumeUrl: 'https://example.com/resume3.pdf',
        applicant: {
          _id: 'user3',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@example.com',
          phone: '(345) 678-9012',
          city: 'San Francisco',
          state: 'CA',
          skills: [
            { name: 'JavaScript' },
            { name: 'React' },
            { name: 'Python' },
            { name: 'SQL' },
            { name: 'Git' }
          ]
        }
      },
      {
        _id: '4',
        jobId: jobId,
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'accepted',
        message: "With my extensive experience in frontend development and UI/UX design, I believe I would be a valuable addition to your team. I've worked on several large-scale applications and am passionate about creating beautiful, functional interfaces.",
        resumeUrl: 'https://example.com/resume4.pdf',
        applicant: {
          _id: 'user4',
          firstName: 'Sarah',
          lastName: 'Williams',
          email: 'sarah.williams@example.com',
          phone: '(456) 789-0123',
          city: 'Boston',
          state: 'MA',
          skills: [
            { name: 'UI/UX Design' },
            { name: 'Figma' },
            { name: 'React' },
            { name: 'CSS' },
            { name: 'User Testing' }
          ]
        }
      },
      {
        _id: '5',
        jobId: jobId,
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'rejected',
        message: "I'm very interested in this position and believe my skills in software development and project management make me a strong candidate. I've been following your company's growth and am excited about the possibility of contributing to your innovative products.",
        resumeUrl: 'https://example.com/resume5.pdf',
        applicant: {
          _id: 'user5',
          firstName: 'David',
          lastName: 'Brown',
          email: 'david.brown@example.com',
          phone: '(567) 890-1234',
          city: 'Austin',
          state: 'TX',
          skills: [
            { name: 'JavaScript' },
            { name: 'Angular' },
            { name: 'Node.js' },
            { name: 'Project Management' },
            { name: 'Agile' }
          ]
        }
      }
    ];
  };

  const handleViewCandidates = async (job) => {
    setSelectedJob(job);
    setCurrentPage(1);
    setCandidatesDialogOpen(true);
  };
  const handleViewCandidateDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateDetailsDialogOpen(true);
  };

  const handleViewResume = async (candidate) => {
    setLoadingResume(true);
    try {
      // Get the resume path from the candidate data
      const resumePath = candidate.resumeUsed || candidate.resumePath || candidate.resumeUrl;
      
      if (!resumePath) {
        alert('No resume found for this candidate.');
        return;
      }

      // Extract filename from resumePath
      const filename = resumePath.split('/').pop();
      
      // Use the secure download API to get the resume
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/download/resume/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Get the blob and create object URL for viewing
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setResumeUrl(url);
        setResumeViewerOpen(true);
      } else {
        console.error('Failed to load resume');
        alert('Failed to load resume. Please try again.');
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      alert('An error occurred while loading the resume.');
    } finally {
      setLoadingResume(false);
    }
  };const handleUpdateApplicationStatus = async (applicationId, status) => {
    // If status is interview, open the interview scheduling dialog instead
    if (status === 'interview') {
      const candidate = jobCandidates.find(c => c._id === applicationId) || selectedCandidate;
      console.log('🔍 Found candidate for interview:', candidate);
      console.log('🔍 Candidate _id:', candidate?._id);
      console.log('🔍 Application ID passed:', applicationId);
      if (candidate) {
        setCandidateForInterview(candidate);
        setInterviewDialogOpen(true);
      }
      return;
    }

    setUpdatingApplication(true);
    setUpdateStatusMessage('');
    setUpdateStatusSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUpdateStatusMessage('Authentication required. Please log in again.');
        setUpdateStatusSuccess(false);
        return;
      }

      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          // Update the candidate in the local state
          setJobCandidates(prev => 
            prev.map(candidate => 
              candidate._id === applicationId ? { ...candidate, status } : candidate
            )
          );
          
          // If we're viewing candidate details, update the selected candidate too
          if (selectedCandidate && selectedCandidate._id === applicationId) {
            setSelectedCandidate(prev => ({ ...prev, status }));
            
            // Show a success message in the UI
            setUpdateStatusMessage(`Status successfully updated to ${status}`);
            setUpdateStatusSuccess(true);
            
            // Clear the message after 5 seconds
            setTimeout(() => {
              setUpdateStatusMessage('');
              setUpdateStatusSuccess(false);
            }, 5000);
          }
        } else {
          console.error('Failed to update application status:', data);
          setUpdateStatusMessage('Failed to update application status. Please try again.');
          setUpdateStatusSuccess(false);
        }
      } else {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        setUpdateStatusMessage('Failed to update application status. Please try again.');
        setUpdateStatusSuccess(false);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setUpdateStatusMessage('An error occurred while updating application status.');
      setUpdateStatusSuccess(false);
    } finally {
      setUpdatingApplication(false);    }
  };
  // Handle interview scheduling
  const handleScheduleInterview = async (interviewData) => {
    try {
      console.log('🔍 handleScheduleInterview called with data:', interviewData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('🔍 Sending request to schedule-interview API...');

      // First, schedule the interview via API
      const response = await fetch('/api/applications/schedule-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(interviewData)
      });

      console.log('🔍 API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 API error response:', errorData);
        throw new Error(errorData.message || 'Failed to schedule interview');
      }

      const result = await response.json();

      // Update the application status to "interview" and local state
      setJobCandidates(prev => 
        prev.map(candidate => 
          candidate._id === interviewData.applicationId 
            ? { ...candidate, status: 'interview' } 
            : candidate
        )
      );

      // If viewing candidate details, update selected candidate
      if (selectedCandidate && selectedCandidate._id === interviewData.applicationId) {
        setSelectedCandidate(prev => ({ ...prev, status: 'interview' }));
      }

      // Show success message
      setUpdateStatusMessage('Interview scheduled successfully! The candidate has been notified.');
      setUpdateStatusSuccess(true);

      // Clear success message after delay
      setTimeout(() => {
        setUpdateStatusMessage('');
        setUpdateStatusSuccess(false);
      }, 5000);

      return result;
    } catch (error) {
      console.error('Error scheduling interview:', error);
      throw error;
    }
  };

  // Helper function to get applicant data consistently
  const getApplicantData = (candidate) => {
    return candidate?.applicant || candidate?.applicantDetails;
  };

  // Helper function to get applicant full name
  const getApplicantFullName = (candidate) => {
    const applicantData = getApplicantData(candidate);
    if (applicantData?.firstName && applicantData?.lastName) {
      return `${applicantData.firstName} ${applicantData.lastName}`;
    }
    return applicantData?.personal?.name || 'Candidate';
  };
  // Helper function to get applicant email
  const getApplicantEmail = (candidate) => {
    const applicantData = getApplicantData(candidate);
    return applicantData?.email || applicantData?.personal?.email || 'N/A';
  };

  // Helper function to get applicant phone
  const getApplicantPhone = (candidate) => {
    const applicantData = getApplicantData(candidate);
    return applicantData?.phone || applicantData?.personal?.phone || 'Not provided';
  };

  // Helper function to get applicant location
  const getApplicantLocation = (candidate) => {
    const applicantData = getApplicantData(candidate);
    if (applicantData?.city && applicantData?.state) {
      return `${applicantData.city}, ${applicantData.state}`;
    }
    if (applicantData?.personal?.address) {
      return applicantData.personal.address;
    }
    return 'Not provided';
  };

  // Helper function to get applicant skills
  const getApplicantSkills = (candidate) => {
    const applicantData = getApplicantData(candidate);
    return applicantData?.skills || applicantData?.professional?.skills || [];
  };
  const openEmailDialog = (type) => {
    let subject = '';
    let body = '';
    
    // Handle both mock data (applicant) and real API data (applicantDetails)
    const applicantData = selectedCandidate.applicant || selectedCandidate.applicantDetails;
    const applicantName = applicantData?.firstName || applicantData?.personal?.name || 'Candidate';
    
    if (type === 'interview') {
      subject = `Interview Invitation for ${selectedJob?.title} Position`;
      body = `Dear ${applicantName},\n\nWe are pleased to invite you for an interview for the ${selectedJob?.title} position at ${selectedJob?.companyName || 'our company'}.\n\nPlease let us know your availability for an interview in the coming week.\n\nBest regards,\nRecruitment Team`;
    } else if (type === 'accepted') {
      subject = `Congratulations! Your Application for ${selectedJob?.title} Position`;
      body = `Dear ${applicantName},\n\nCongratulations! We are pleased to inform you that we would like to move forward with your application for the ${selectedJob?.title} position at ${selectedJob?.companyName || 'our company'}.\n\nWe will be in touch shortly with the next steps.\n\nBest regards,\nRecruitment Team`;
    } else if (type === 'rejected') {
      subject = `Regarding Your Application for ${selectedJob?.title} Position`;
      body = `Dear ${applicantName},\n\nThank you for your interest in the ${selectedJob?.title} position at ${selectedJob?.companyName || 'our company'}.\n\nAfter careful consideration, we regret to inform you that we have decided to pursue other candidates whose qualifications more closely align with our current needs.\n\nWe appreciate your interest in our company and wish you success in your job search.\n\nBest regards,\nRecruitment Team`;
    }
      setEmailSubject(subject);
    setEmailBody(body);
    setEmailDialogOpen(true);
  };
  const handleSendEmailNotification = async () => {
    if (!selectedCandidate || !emailSubject.trim() || !emailBody.trim()) {
      setUpdateStatusMessage('Please fill in both subject and message fields.');
      setUpdateStatusSuccess(false);
      return;
    }

    setSendingEmail(true);
    setUpdateStatusMessage('');
    setUpdateStatusSuccess(false);
    
    try {
      // Handle both mock data (applicant) and real API data (applicantDetails)
      const applicantData = selectedCandidate.applicant || selectedCandidate.applicantDetails;
      const applicantEmail = applicantData?.email || 'no-email@example.com';
      
      const token = localStorage.getItem('token');
      if (!token) {
        setUpdateStatusMessage('Authentication required. Please log in again.');
        setUpdateStatusSuccess(false);
        return;
      }
      
      // Send email via API
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: applicantEmail,
          subject: emailSubject,
          body: emailBody
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          // Show success message
          setUpdateStatusMessage('Email sent successfully!');
          setUpdateStatusSuccess(true);
          
          // Update candidate status based on email type if it's a status notification
          let statusToUpdate = null;
          
          if (emailSubject.includes('Interview Invitation') && selectedCandidate.status !== 'interview') {
            statusToUpdate = 'interview';
          } else if (emailSubject.includes('Congratulations') && selectedCandidate.status !== 'accepted') {
            statusToUpdate = 'accepted';
          } else if (emailSubject.includes('Regarding Your Application') && !emailSubject.includes('Congratulations') && selectedCandidate.status !== 'rejected') {
            statusToUpdate = 'rejected';
          }
          
          // If status needs to be updated, do it after email is sent
          if (statusToUpdate) {
            // Update the status
            try {
              const statusResponse = await fetch(`/api/applications/${selectedCandidate._id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: statusToUpdate })
              });
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData && statusData.success) {
                  // Update local state
                  setJobCandidates(prev => 
                    prev.map(candidate => 
                      candidate._id === selectedCandidate._id ? { ...candidate, status: statusToUpdate } : candidate
                    )
                  );
                  setSelectedCandidate(prev => ({ ...prev, status: statusToUpdate }));
                  
                  setUpdateStatusMessage(`Email sent and status updated to ${statusToUpdate}!`);
                }
              } else {
                console.error('Failed to update status after email');
                setUpdateStatusMessage('Email sent successfully, but failed to update status. Please update manually.');
              }
            } catch (statusError) {
              console.error('Error updating status after email:', statusError);
              setUpdateStatusMessage('Email sent successfully, but failed to update status. Please update manually.');
            }
          }
          
          // Close dialog after delay
          setTimeout(() => {
            setEmailDialogOpen(false);
            setEmailSubject('');
            setEmailBody('');
            
            // Switch to status tab to show the status update
            if (statusToUpdate) {
              setActiveDetailsSection('status');
            }
            
            // Clear message after additional delay
            setTimeout(() => {
              setUpdateStatusMessage('');
              setUpdateStatusSuccess(false);
            }, 3000);
          }, 2000);
          
        } else {
          console.error('Failed to send email:', data);
          setUpdateStatusMessage(data?.message || 'Failed to send email. Please try again.');
          setUpdateStatusSuccess(false);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to send email:', response.status, errorText);
        setUpdateStatusMessage('Failed to send email. Please try again.');
        setUpdateStatusSuccess(false);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setUpdateStatusMessage('An error occurred while sending email. Please try again.');
      setUpdateStatusSuccess(false);
    } finally {
      setSendingEmail(false);
    }
  };

  const formatPostedDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

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
  
  const getStatusBadge = (status) => {
    switch (status) {      case 'pending':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Pending</Badge>;
      case 'reviewing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Reviewing</Badge>;
      case 'interview':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Interview</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };
  // Function to filter candidates based on search query
  const filteredCandidates = jobCandidates.filter(candidate => {
    // Handle different API response formats
    const applicantData = candidate.applicant || candidate.applicantDetails || candidate;
    
    console.log('🔍 Filtering candidate:', candidate);
    console.log('🔍 Applicant data:', applicantData);
    
    if (!applicantData) {
      console.log('❌ No applicant data found');
      return false; // Skip candidates without applicant data
    }
    
    // Get name - handle different structures
    let fullName = '';
    if (applicantData.firstName && applicantData.lastName) {
      // Mock data structure
      fullName = `${applicantData.firstName} ${applicantData.lastName}`.toLowerCase();
    } else if (applicantData.personal?.name) {
      // Real API data structure
      fullName = applicantData.personal.name.toLowerCase();
    } else if (applicantData.name) {
      // Alternative structure
      fullName = applicantData.name.toLowerCase();
    } else if (applicantData.applicantName) {
      // New API structure - use applicantName field
      fullName = applicantData.applicantName.toLowerCase();
    }
    
    const email = (applicantData.email || applicantData.applicantEmail || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    console.log('🔍 Full name:', fullName, 'Email:', email, 'Query:', query);
    
    return fullName.includes(query) || email.includes(query);
  });
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading job listings...</p>
      </div>
    );
  }

  if (error) {
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

  const activeJobs = jobs.filter(job => job.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold">Active Jobs</h2>
        </div>
        <Button onClick={() => router.push('/dashboard/recruiter#create-job')}>
          Create New Job
        </Button>
      </div>      {activeJobs.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No active jobs</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            You haven't posted any active jobs yet.
          </p>
          <Button onClick={() => router.push('/dashboard/recruiter')}>
            Create Your First Job
          </Button>
        </div>
      ) : (        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeJobs.map((job) => (
            <Card key={job._id} className="border-border hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Building className="h-3 w-3 mr-1" />
                    {job.companyName || 'Your Company'}
                  </CardDescription>
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
                </div>
                
                <div className="flex items-center mt-4 text-sm font-medium">
                  <Users className="h-4 w-4 mr-1 text-blue-600" />
                  <span>{job.applicationsCount || 0} applications</span>
                  {job.applicationsCount > 0 && job.applicationStats && (
                    <div className="flex ml-2 gap-1">
                      {job.applicationStats.reviewing > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 text-xs border-blue-200">
                          {job.applicationStats.reviewing} reviewing
                        </Badge>
                      )}
                      {job.applicationStats.interview > 0 && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-800 text-xs border-purple-200">
                          {job.applicationStats.interview} interview
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-end">
                <Button 
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => handleViewCandidates(job)}
                >
                  <Eye className="h-3 w-3" />
                  View Candidates
                </Button>
                <Button 
                  variant="destructive"
                  className="flex items-center gap-1"
                  onClick={() => handleConfirmCloseJob(job._id)}
                >
                  <XCircle className="h-3 w-3" />
                  Close Job
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Close Job Confirmation Dialog */}
      <Dialog open={isConfirmCloseJobDialogOpen} onOpenChange={setIsConfirmCloseJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Close Job Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this job? It will no longer accept new applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmCloseJobDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCloseJob}
            >
              Close Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidates Dialog */}
      {selectedJob && (
        <Dialog 
          open={candidatesDialogOpen} 
          onOpenChange={setCandidatesDialogOpen}
          className="w-full"
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Candidates for {selectedJob.title}
              </DialogTitle>
              <DialogDescription>
                Review candidates who applied for this position
              </DialogDescription>
            </DialogHeader>
            
            {/* Filters and controls */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 my-4">              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>              
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingCandidates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading candidates...</span>
              </div>
            ) : jobCandidates.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No applications yet</h3>
                <p className="text-muted-foreground mt-2">
                  There are no applications for this position yet.
                </p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No matching candidates</h3>
                <p className="text-muted-foreground mt-2">
                  No candidates match your search criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4 my-4">
                {filteredCandidates.map((candidate) => (                  <div 
                    key={candidate._id} 
                    className="bg-card p-4 rounded-lg border border-border hover:border-muted-foreground transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">                  <div>                    <div className="flex items-center gap-2">                      <h4 className="font-medium text-base text-foreground">
                        {(() => {
                          const applicantData = candidate.applicant || candidate.applicantDetails || candidate;
                          if (applicantData?.firstName && applicantData?.lastName) {
                            return `${applicantData.firstName} ${applicantData.lastName}`;
                          } else if (applicantData?.personal?.name) {
                            return applicantData.personal.name;
                          } else if (applicantData?.name) {
                            return applicantData.name;
                          } else if (applicantData?.applicantName) {
                            return applicantData.applicantName;
                          }
                          return 'Unnamed Candidate';
                        })()}
                      </h4>
                      {getStatusBadge(candidate.status)}
                    </div>                    <div className="text-muted-foreground text-sm">
                      {(() => {
                        const applicantData = candidate.applicant || candidate.applicantDetails || candidate;
                        return applicantData?.email || applicantData?.applicantEmail || 'No email provided';
                      })()}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      Applied {formatPostedDate(candidate.createdAt)}
                    </div>
                  </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">                        <DropdownMenu>
                          <DropdownMenuTrigger asChild disabled={updatingApplication}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              {updatingApplication && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {candidate.status} <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleUpdateApplicationStatus(candidate._id, 'pending')}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-3 w-3" /> Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateApplicationStatus(candidate._id, 'reviewing')}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-3 w-3" /> Reviewing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateApplicationStatus(candidate._id, 'interview')}
                              className="flex items-center gap-2"
                            >
                              <CalendarIcon className="h-3 w-3" /> Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateApplicationStatus(candidate._id, 'accepted')}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-3 w-3" /> Accept
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateApplicationStatus(candidate._id, 'rejected')}
                              className="flex items-center gap-2"
                            >
                              <XIcon className="h-3 w-3" /> Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {candidate.resumeUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(candidate.resumeUrl, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Resume
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => handleViewCandidateDetails(candidate)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalCandidates > candidatesPerPage && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(totalCandidates / candidatesPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= Math.ceil(totalCandidates / candidatesPerPage)}
                >
                  Next
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Candidate Details Dialog */}
      {selectedCandidate && (
        <Dialog open={candidateDetailsDialogOpen} onOpenChange={setCandidateDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">            <DialogHeader>
              <DialogTitle className="text-xl">
                {getApplicantFullName(selectedCandidate)}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <DialogDescription>
                  Application for {selectedJob?.title}
                </DialogDescription>
                {getStatusBadge(selectedCandidate.status)}
              </div>
            </DialogHeader>

            <div className="space-y-6 my-4">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                  <div>
                    <h4 className="text-sm text-muted-foreground">Email</h4>
                    <p>{getApplicantEmail(selectedCandidate)}</p>
                  </div>                  <div>
                    <h4 className="text-sm text-muted-foreground">Phone</h4>
                    <p>{getApplicantPhone(selectedCandidate)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Location</h4>
                    <p>{getApplicantLocation(selectedCandidate)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Application Date</h4>
                    <p>{new Date(selectedCandidate.appliedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>              {/* Skills */}
              {(() => {
                const skills = getApplicantSkills(selectedCandidate);
                return skills && skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill.name || skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}              {/* Cover Letter */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Cover Letter</h3>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="whitespace-pre-wrap">
                    {selectedCandidate.coverLetter || 'No cover letter provided.'}
                  </p>
                </div>
              </div>

              {/* Additional Message (if provided) */}
              {selectedCandidate.additionalMessage && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Additional Message</h3>
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <p className="whitespace-pre-wrap">
                      {selectedCandidate.additionalMessage}
                    </p>
                  </div>
                </div>
              )}              {/* Resume */}
              {(selectedCandidate.resumePath || selectedCandidate.resumeUrl || selectedCandidate.resumeUsed) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Resume</h3>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleViewResume(selectedCandidate)}
                      disabled={loadingResume}
                      className="flex items-center gap-2"
                    >
                      {loadingResume ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          View Resume
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          // Extract filename from resumePath
                          const resumePath = selectedCandidate.resumePath || selectedCandidate.resumeUrl || selectedCandidate.resumeUsed;
                          const filename = resumePath.split('/').pop();
                          
                          // Use the new secure download API
                          const token = localStorage.getItem('token');
                          const response = await fetch(`/api/download/resume/${filename}`, {
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
                            a.download = `${getApplicantFullName(selectedCandidate).replace(' ', '-')}-resume.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } else {
                            console.error('Failed to download resume');
                            alert('Failed to download resume. Please try again.');
                          }
                        } catch (error) {
                          console.error('Error downloading resume:', error);
                          alert('An error occurred while downloading the resume.');
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Resume
                    </Button>
                  </div>
                </div>
              )}{/* Action Tabs */}              <div className="border-t border-border pt-4 mt-4">
                {/* Tab Navigation */}
                <div className="flex border-b border-border mb-4">
                  <button
                    onClick={() => setActiveDetailsSection('status')}
                    className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-md ${
                      activeDetailsSection === 'status'
                        ? 'bg-black text-white'
                        : 'text-muted-foreground hover:text-foreground bg-muted'
                    }`}
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => setActiveDetailsSection('communicate')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-md ${
                      activeDetailsSection === 'communicate'
                        ? 'bg-black text-white'
                        : 'text-muted-foreground hover:text-foreground bg-muted'
                    }`}
                  >
                    Communicate
                  </button>
                </div>{/* Update Status Tab */}
                {activeDetailsSection === 'status' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Update Application Status</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant={selectedCandidate.status === 'pending' ? 'default' : 'outline'}
                        disabled={updatingApplication}
                        onClick={() => handleUpdateApplicationStatus(selectedCandidate._id, 'pending')}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-3 w-3" />
                        Pending
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedCandidate.status === 'reviewing' ? 'default' : 'outline'}
                        disabled={updatingApplication}
                        onClick={() => handleUpdateApplicationStatus(selectedCandidate._id, 'reviewing')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        Reviewing
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedCandidate.status === 'interview' ? 'default' : 'outline'}
                        disabled={updatingApplication}
                        onClick={() => handleUpdateApplicationStatus(selectedCandidate._id, 'interview')}
                        className="flex items-center gap-2"
                      >
                        <CalendarIcon className="h-3 w-3" />
                        Interview
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedCandidate.status === 'accepted' ? 'default' : 'outline'}
                        disabled={updatingApplication}
                        onClick={() => handleUpdateApplicationStatus(selectedCandidate._id, 'accepted')}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-3 w-3" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedCandidate.status === 'rejected' ? 'default' : 'outline'}
                        disabled={updatingApplication}
                        onClick={() => handleUpdateApplicationStatus(selectedCandidate._id, 'rejected')}
                        className="flex items-center gap-2"
                      >
                        <XIcon className="h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                    {updatingApplication && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating status...
                      </div>
                    )}
                      {/* Improved status feedback message */}
                    {updateStatusMessage && (
                      <div className={`mt-3 p-3 rounded-md text-sm ${!updateStatusSuccess
                        ? 'bg-red-50 text-red-800 border border-red-100' 
                        : 'bg-green-50 text-green-800 border border-green-100'}`}>
                        {!updateStatusSuccess ? (
                          <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                            <div>{updateStatusMessage}</div>
                          </div>
                        ) : (
                          <div className="flex items-start">
                            <Check className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <div className="font-medium mb-1">{updateStatusMessage}</div>
                              {(selectedCandidate.status === 'interview' || 
                                selectedCandidate.status === 'accepted' || 
                                selectedCandidate.status === 'rejected') && (
                                <div className="flex items-center mt-2">
                                  <Mail className="h-4 w-4 mr-2" />
                                  <span>Would you like to notify the candidate?</span>
                                  <Button 
                                    variant="link" 
                                    className="px-2 h-auto text-sm font-medium underline" 
                                    onClick={() => {
                                      setActiveDetailsSection('communicate');
                                      openEmailDialog(selectedCandidate.status);
                                    }}
                                  >
                                    Send email notification
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Contextual help based on current status */}
                    {!updatingApplication && !updateStatusMessage && (
                      <>
                        {selectedCandidate.status === 'accepted' && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                            <h4 className="text-sm font-medium text-blue-800 mb-1">Next Steps</h4>
                            <p className="text-sm text-blue-700 flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              This candidate was accepted. 
                              <Button 
                                variant="link" 
                                className="px-1 h-auto text-sm font-medium text-blue-800 underline" 
                                onClick={() => {
                                  setActiveDetailsSection('communicate');
                                  openEmailDialog('accepted');
                                }}
                              >
                                Send acceptance email
                              </Button>
                            </p>
                          </div>
                        )}
                        
                        {selectedCandidate.status === 'rejected' && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                            <h4 className="text-sm font-medium text-amber-800 mb-1">Candidate Rejected</h4>
                            <p className="text-sm text-amber-700 flex items-center">
                              <XIcon className="h-4 w-4 mr-2 text-red-600" />
                              This candidate was rejected. 
                              <Button 
                                variant="link" 
                                className="px-1 h-auto text-sm font-medium text-amber-800 underline" 
                                onClick={() => {
                                  setActiveDetailsSection('communicate');
                                  openEmailDialog('rejected');
                                }}
                              >
                                Send rejection email
                              </Button>
                            </p>
                          </div>
                        )}
                        
                        {selectedCandidate.status === 'interview' && (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-md">
                            <h4 className="text-sm font-medium text-purple-800 mb-1">Interview Scheduled</h4>
                            <p className="text-sm text-purple-700 flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2 text-purple-600" />
                              This candidate is scheduled for an interview. 
                              <Button 
                                variant="link" 
                                className="px-1 h-auto text-sm font-medium text-purple-800 underline" 
                                onClick={() => {
                                  setActiveDetailsSection('communicate');
                                  openEmailDialog('interview');
                                }}
                              >
                                Send interview details
                              </Button>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}                  {/* Communication Tab */}
                {activeDetailsSection === 'communicate' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Communicate with Candidate</h3>
                      {/* Status-aware communication options */}
                    <div className="mb-3 p-3 bg-muted border border-border rounded-md">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                        Current Status: {getStatusBadge(selectedCandidate.status)}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Sending emails may update the candidate's status if indicated below.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {/* Interview card with contextual UI based on current status */}                      <div 
                        className={`border rounded-lg p-4 transition-all cursor-pointer
                          ${selectedCandidate.status === 'interview' 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-border hover:border-blue-300 hover:bg-blue-50'}`}
                        onClick={() => openEmailDialog('interview')}
                      >                        <div className="flex items-center mb-2">
                          <CalendarIcon className={`h-5 w-5 mr-2 ${selectedCandidate.status === 'interview' ? 'text-blue-800' : 'text-blue-600'}`} />
                          <h4 className="font-medium">Interview Invitation</h4>
                          {selectedCandidate.status === 'interview' && (
                            <Badge className="ml-auto text-xs bg-blue-100 text-blue-800 border border-blue-200">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Send an interview request with details about the next steps</p>
                        {selectedCandidate.status !== 'interview' && (
                          <div className="flex items-center mt-2 text-xs text-blue-600">
                            <ArrowLeftCircle className="h-3 w-3 mr-1" />
                            Will update status to "Interview"
                          </div>
                        )}
                      </div>
                      
                      {/* Acceptance card with contextual UI */}                      <div 
                        className={`border rounded-lg p-4 transition-all cursor-pointer
                          ${selectedCandidate.status === 'accepted' 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-border hover:border-green-300 hover:bg-green-50'}`}
                        onClick={() => openEmailDialog('accepted')}
                      >
                        <div className="flex items-center mb-2">
                          <Check className={`h-5 w-5 mr-2 ${selectedCandidate.status === 'accepted' ? 'text-green-800' : 'text-green-600'}`} />
                          <h4 className="font-medium">Acceptance Notification</h4>
                          {selectedCandidate.status === 'accepted' && (
                            <Badge className="ml-auto text-xs bg-green-100 text-green-800 border border-green-200">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Inform the candidate that they've been accepted for the position</p>
                        {selectedCandidate.status !== 'accepted' && (
                          <div className="flex items-center mt-2 text-xs text-green-600">
                            <ArrowLeftCircle className="h-3 w-3 mr-1" />
                            Will update status to "Accepted"
                          </div>
                        )}
                      </div>
                      
                      {/* Rejection card with contextual UI */}                      <div 
                        className={`border rounded-lg p-4 transition-all cursor-pointer
                          ${selectedCandidate.status === 'rejected' 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-border hover:border-red-300 hover:bg-red-50'}`}
                        onClick={() => openEmailDialog('rejected')}
                      >
                        <div className="flex items-center mb-2">
                          <XIcon className={`h-5 w-5 mr-2 ${selectedCandidate.status === 'rejected' ? 'text-red-800' : 'text-red-600'}`} />
                          <h4 className="font-medium">Rejection Notification</h4>
                          {selectedCandidate.status === 'rejected' && (
                            <Badge className="ml-auto text-xs bg-red-100 text-red-800 border border-red-200">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Inform the candidate that they haven't been selected</p>
                        {selectedCandidate.status !== 'rejected' && (
                          <div className="flex items-center mt-2 text-xs text-red-600">
                            <ArrowLeftCircle className="h-3 w-3 mr-1" />
                            Will update status to "Rejected"
                          </div>
                        )}
                      </div>
                        {/* Custom Email option */}
                      <div 
                        className="border border-border rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer"
                        onClick={() => openEmailDialog('')}
                      >
                        <div className="flex items-center mb-2">
                          <Mail className="h-5 w-5 text-purple-600 mr-2" />
                          <h4 className="font-medium">Custom Email</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Send a personalized message to this candidate</p>
                        <p className="flex items-center mt-2 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          No status change
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveDetailsSection('status')}
                        className="flex items-center gap-1"
                      >
                        <ArrowLeftCircle className="h-4 w-4" />
                        Back to Status Update
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCandidateDetailsDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}      {/* Email Notification Dialog */}
      {selectedCandidate && (
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Send Email to Candidate
              </DialogTitle>
              <DialogDescription>                {selectedCandidate && (
                  <span>Sending to {getApplicantFullName(selectedCandidate)} ({getApplicantEmail(selectedCandidate)})</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Email information panel with improved UI */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-700">Email Details</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Recipient</span>
                    <span className="font-medium text-blue-900">
                      {getApplicantFullName(selectedCandidate)}
                    </span>
                    <span className="text-blue-700">{getApplicantEmail(selectedCandidate)}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-muted-foreground mb-1">Position</span>
                    <span className="font-medium text-blue-900">{selectedJob?.title}</span>
                    <div className="flex items-center mt-1">
                      <span className="mr-2">Current Status:</span>
                      {getStatusBadge(selectedCandidate.status)}
                    </div>
                  </div>
                </div>
                
                {/* Show status change information if applicable */}
                {(emailSubject.includes('Interview') || 
                  emailSubject.includes('Congratulations') || 
                  (emailSubject.includes('Regarding') && !emailSubject.includes('Congratulations'))) && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-amber-800">
                        Status Change Notice
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Sending this email will {emailSubject.includes('Interview') ? 'update' : 'change'} the candidate's status to{' '}
                      {emailSubject.includes('Interview') ? (
                        <Badge className="ml-1 bg-purple-100 text-purple-800 border-purple-200">Interview</Badge>
                      ) : emailSubject.includes('Congratulations') ? (
                        <Badge className="ml-1 bg-green-100 text-green-800 border-green-200">Accepted</Badge>
                      ) : (
                        <Badge className="ml-1 bg-red-100 text-red-800 border-red-200">Rejected</Badge>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Email subject with improved UI */}              <div>
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-foreground" /> 
                  <label htmlFor="email-subject" className="text-sm font-medium">Subject</label>
                </div>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject..."
                />
              </div>

              {/* Email body with improved UI */}
              <div>
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 mr-2 text-foreground" /> 
                  <label htmlFor="email-body" className="text-sm font-medium">Message</label>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <textarea
                    id="email-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={10}
                    className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your message here..."
                  />
                </div>
                
                {/* Character counter and email tips */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{emailBody.length} characters</span>
                  <span>Markdown formatting is not supported</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between mt-6">
              <div>
                {emailSubject.includes('Interview') && selectedCandidate.status !== 'interview' && (
                  <div className="text-sm text-purple-700 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Will update to "Interview"
                  </div>
                )}
                {emailSubject.includes('Congratulations') && selectedCandidate.status !== 'accepted' && (
                  <div className="text-sm text-green-700 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Will update to "Accepted" 
                  </div>
                )}
                {emailSubject.includes('Regarding') && !emailSubject.includes('Congratulations') && selectedCandidate.status !== 'rejected' && (
                  <div className="text-sm text-red-700 flex items-center">
                    <XIcon className="h-4 w-4 mr-1" />
                    Will update to "Rejected"
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEmailDialogOpen(false)}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendEmailNotification}
                  disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                  className="flex items-center gap-2"
                >
                  {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send Email
                </Button>
              </div>
            </DialogFooter>          </DialogContent>        </Dialog>
      )}
      
      {/* Resume Viewer Dialog */}
      {resumeViewerOpen && (
        <Dialog open={resumeViewerOpen} onOpenChange={(open) => {
          setResumeViewerOpen(open);
          if (!open) {
            // Clean up the object URL when closing
            if (resumeUrl) {
              URL.revokeObjectURL(resumeUrl);
              setResumeUrl('');
            }
          }
        }}>
          <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume - {selectedCandidate ? getApplicantFullName(selectedCandidate) : 'Candidate'}
              </DialogTitle>
              <DialogDescription>
                View the candidate's resume
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full h-full min-h-0">
              {resumeUrl ? (
                <iframe
                  src={resumeUrl}
                  className="w-full h-full border rounded-lg"
                  title="Resume Viewer"
                  onError={() => {
                    alert('Unable to display the resume. Please try downloading it instead.');
                    setResumeViewerOpen(false);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading resume...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => setResumeViewerOpen(false)}
              >
                Close
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    // Download the resume
                    const resumePath = selectedCandidate?.resumePath || selectedCandidate?.resumeUrl || selectedCandidate?.resumeUsed;
                    const filename = resumePath.split('/').pop();
                    
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/download/resume/${filename}`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });

                    if (response.ok) {
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${getApplicantFullName(selectedCandidate).replace(' ', '-')}-resume.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } else {
                      alert('Failed to download resume. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error downloading resume:', error);
                    alert('An error occurred while downloading the resume.');
                  }
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Interview Scheduling Dialog */}
      <InterviewSchedulingDialog
        isOpen={interviewDialogOpen}
        onClose={() => {
          setInterviewDialogOpen(false);
          setCandidateForInterview(null);
        }}
        candidate={candidateForInterview}
        job={selectedJob}
        onScheduleInterview={handleScheduleInterview}
      />
    </div>
  );
}
