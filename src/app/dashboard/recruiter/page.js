'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Users, 
  FileCheck, 
  PieChart,
  LineChart,
  CheckCheck,
  Edit,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  Plus
} from 'lucide-react';
import { apiClient, authAPI } from '@/lib/api';
import CreateJobDialog from '@/components/CreateJobDialog';

export default function RecruiterDashboardPage() {
  const router = useRouter();  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    totalCandidates: 0,
    interviews: 0
  });
  useEffect(() => {
    checkAuthAndFetchData();
  }, []);
  
  // Check URL hash for #create-job
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        if (window.location.hash === '#create-job') {
          setIsCreateJobDialogOpen(true);
        }
      };
      
      // Check hash on initial load
      handleHashChange();
      
      // Listen for hash changes
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check if user is authenticated
      if (!authAPI.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        router.push('/auth');
        return;
      }

      // Check if user is a recruiter
      const userRole = authAPI.getUserRole();
      if (userRole !== 'recruiter') {
        console.log('User is not a recruiter, redirecting to appropriate dashboard');
        if (userRole === 'applicant') {
          router.push('/dashboard/applicant');
        } else {
          router.push('/auth');
        }
        return;
      }

      setAuthLoading(false);
      await fetchJobs();
    } catch (error) {
      console.error('Error during auth check:', error);
      router.push('/auth');
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await apiClient.get('/api/jobs');
      if (response.success) {
        setJobs(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback to mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockJobs = [
      {
        _id: '1',
        title: 'Senior Frontend Developer',
        department: 'engineering',
        level: 'senior',
        workMode: 'remote',
        jobType: 'full-time',
        salaryMin: 120000,
        salaryMax: 150000,
        currency: 'USD',
        status: 'active',
        applicationsCount: 12,
        viewsCount: 45,
        createdAt: new Date('2025-05-15'),
        applicationEnd: new Date('2025-06-15')
      },
      {
        _id: '2',
        title: 'UI/UX Designer',
        department: 'design',
        level: 'mid',
        workMode: 'onsite',
        location: 'New York, NY',
        jobType: 'full-time',
        salaryMin: 90000,
        salaryMax: 110000,
        currency: 'USD',
        status: 'active',
        applicationsCount: 8,
        viewsCount: 32,
        createdAt: new Date('2025-05-18'),
        applicationEnd: new Date('2025-06-18')
      },
      {
        _id: '3',
        title: 'Product Manager',
        department: 'product',
        level: 'senior',
        workMode: 'hybrid',
        location: 'San Francisco, CA',
        jobType: 'full-time',
        salaryMin: 130000,
        salaryMax: 160000,
        currency: 'USD',
        status: 'active',
        applicationsCount: 5,
        viewsCount: 28,
        createdAt: new Date('2025-05-20'),
        applicationEnd: new Date('2025-06-20')
      }
    ];
    setJobs(mockJobs);
    calculateStats(mockJobs);
  };
  const calculateStats = (jobsData) => {
    const activeJobs = jobsData.filter(job => job.status === 'active').length;
    const totalApplications = jobsData.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
    
    setStats({
      activeJobs,
      totalApplications,
      totalCandidates: Math.floor(totalApplications * 0.7), // Estimate unique candidates
      interviews: Math.floor(totalApplications * 0.3) // Estimate interviews
    });
  };

  const handleJobCreated = (newJob) => {
    console.log('✅ New job created:', newJob);
    setJobs(prevJobs => [newJob, ...prevJobs]);
    calculateStats([newJob, ...jobs]);
    setIsCreateJobDialogOpen(false);
  };

  const formatSalary = (min, max, currency = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const getWorkModeIcon = (mode) => {
    switch (mode) {
      case 'remote':
        return 'Remote';
      case 'onsite':
        return 'On-site';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'Location';
    }
  };  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Recruitment Overview</h2>
      
      {/* Stats Cards */}      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">        
        <div 
          className="bg-white p-4 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => router.push('/dashboard/recruiter/jobs')}
        >
          <div className="p-2 rounded-full bg-indigo-50 mr-3">
            <Briefcase className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Active Jobs</p>
            <h3 className="text-xl font-bold">{stats.activeJobs}</h3>
          </div>
        </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-2 rounded-full bg-purple-50 mr-3">
            <FileCheck className="h-5 w-5 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Applications</p>
            <h3 className="text-xl font-bold">{stats.totalApplications}</h3>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-2 rounded-full bg-cyan-50 mr-3">
            <Users className="h-5 w-5 text-cyan-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Candidates</p>
            <h3 className="text-xl font-bold">{stats.totalCandidates}</h3>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-2 rounded-full bg-rose-50 mr-3">
            <PieChart className="h-5 w-5 text-rose-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Interviews</p>
            <h3 className="text-xl font-bold">{stats.interviews}</h3>
          </div>
        </div>
      </div>
        {/* Main Content Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Active Job Postings */}        <div className="xl:col-span-3 bg-white p-4 rounded-lg border border-gray-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-gray-600" />
              Active Job Postings
            </h3>            <div className="flex items-center gap-2">
              {jobs.length > 0 && (
                <span className="text-sm text-gray-500">
                  {jobs.filter(job => job.status === 'active').length} active
                </span>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No jobs posted yet</p>
              <p className="text-sm text-gray-400 mb-4">Create your first job posting to get started</p>
              <button
                onClick={() => setIsCreateJobDialogOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Create Your First Job
              </button>
            </div>) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {jobs.filter(job => job.status === 'active').map((job) => (
                <div 
                  key={job._id} 
                  className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getWorkModeIcon(job.workMode)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Posted {formatDate(job.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        {job.applicationsCount || 0} applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.viewsCount || 0} views
                      </span>
                    </div>
                    <button className="text-xs text-blue-600 flex items-center hover:text-blue-800">
                      <Edit className="h-3 w-3 mr-1" /> 
                      Edit
                    </button>
                  </div>
                  
                  {job.applicationEnd && (
                    <div className="mt-2 text-xs text-gray-400">
                      Applications close on {formatDate(job.applicationEnd)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          {/* Upcoming Interviews */}        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-gray-600" />
            Upcoming Interviews
          </h3>
            <div className="space-y-3">
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">John Smith</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Frontend Developer • Today, 2:00 PM</p>
            </div>
            
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">Sarah Johnson</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">UI Designer • Today, 4:30 PM</p>
            </div>
            
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">David Lee</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Product Manager • Tomorrow, 10:00 AM</p>
            </div>
            
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">Emily Chen</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Backend Developer • Tomorrow, 1:30 PM</p>
            </div>
          </div>        </div>
      </div>
      
      <CreateJobDialog
        isOpen={isCreateJobDialogOpen}
        onClose={() => setIsCreateJobDialogOpen(false)}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
}
