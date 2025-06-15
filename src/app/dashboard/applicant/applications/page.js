'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Search, 
  Filter,
  Calendar,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { clientAuth } from '@/lib/auth';

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token && clientAuth.isAuthenticated()) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let url = `/api/applications?page=${page}&limit=10`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApplications(data.applications || []);
          setPagination(data.pagination || {});
        }
      } else {
        console.error('Failed to fetch applications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return <Clock className="h-4 w-4" />;
      case 'interview':
      case 'interviewing':
        return <CheckCircle className="h-4 w-4" />;
      case 'reviewing':
      case 'under review':
        return <Eye className="h-4 w-4" />;
      case 'accepted':
      case 'hired':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'declined':
        return <XCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
              <p className="text-muted-foreground mt-1">
                Track your job application status and history
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="relative">
              <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="reviewing">Reviewing</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
            <span className="text-muted-foreground">Loading applications...</span>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application._id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (application.jobId) {
                    router.push(`/dashboard/applicant/jobs/${application.jobId}`);
                  }
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {application.jobTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>{application.company}</span>
                          </div>
                          {application.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{application.location}</span>
                            </div>
                          )}
                          {application.jobType && (
                            <span className="bg-muted px-2 py-1 rounded text-xs">
                              {application.jobType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Applied {application.appliedDateRelative}</span>
                      </div>
                      <span>•</span>
                      <span>{application.appliedDateFormatted}</span>
                    </div>

                    {application.notes && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {application.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${application.statusStyling}`}>
                      {getStatusIcon(application.status)}
                      <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (application.jobId) {
                            router.push(`/dashboard/applicant/jobs/${application.jobId}`);
                          }
                        }}
                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Job
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => fetchApplications(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchApplications(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No applications found' : 'No applications yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start applying to jobs to track your applications here'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => router.push('/dashboard/applicant/jobs')}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Jobs
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
