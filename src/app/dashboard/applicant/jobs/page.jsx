'use client';

import { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  Filter, 
  Search,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Bookmark
} from 'lucide-react';
import RealJobsComponent from '@/components/RealJobsComponent';
import { apiClient } from '@/lib/api';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ApplicantJobsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle job card click
  const handleJobClick = (job) => {
    console.log('Selected job:', job);
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  // Handle file upload
  const handleFileChange = (file) => {
    setResumeFile(file);
  };  // Submit application
  const handleSubmitApplication = async () => {
    if (!resumeFile || !message.trim()) {
      alert('Please upload a resume and provide a message before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🚀 Starting application submission process...');
      console.log('🚀 Resume file:', resumeFile);
      console.log('🚀 Token exists:', !!localStorage.getItem('token'));

      // Step 1: Upload the resume file first
      console.log('📄 Step 1: Uploading resume file...');
      const formData = new FormData();
      formData.append('file', resumeFile);

      console.log('📄 Making request to /api/upload/resume');
      const uploadResponse = await fetch('/api/upload/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      console.log('📄 Upload response status:', uploadResponse.status);
      console.log('📄 Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        console.error('📄 Upload failed with status:', uploadResponse.status);
        let errorData;
        try {
          errorData = await uploadResponse.json();
          console.error('📄 Upload error data:', errorData);
        } catch (parseError) {
          console.error('📄 Could not parse error response:', parseError);
          const errorText = await uploadResponse.text();
          console.error('📄 Error response text:', errorText);
          throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
        }
        throw new Error(errorData.message || 'Failed to upload resume');
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Resume uploaded successfully:', uploadResult);

      // Step 2: Submit the job application
      console.log('📝 Step 2: Submitting job application...');
      console.log('📝 Selected job:', selectedJob);
      console.log('📝 Job ID:', selectedJob._id);
      console.log('📝 Job ID type:', typeof selectedJob._id);      
      console.log('📝 Making request to /api/applications');
      const applicationResponse = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          jobId: selectedJob._id,
          coverLetter: message.trim(),
        }),
      });

      console.log('📝 Application response status:', applicationResponse.status);
      console.log('📝 Application response headers:', Object.fromEntries(applicationResponse.headers.entries()));

      if (!applicationResponse.ok) {
        console.error('📝 Application failed with status:', applicationResponse.status);
        let errorData;
        try {
          errorData = await applicationResponse.json();
          console.error('📝 Application error data:', errorData);
        } catch (parseError) {
          console.error('📝 Could not parse error response:', parseError);
          const errorText = await applicationResponse.text();
          console.error('📝 Error response text:', errorText);
          throw new Error(`Application failed with status ${applicationResponse.status}: ${errorText}`);
        }
        throw new Error(errorData.message || 'Failed to submit application');
      }

      const applicationResult = await applicationResponse.json();
      console.log('✅ Application submitted successfully:', applicationResult);

      // Success! Close dialog and reset form
      setIsDialogOpen(false);
      setResumeFile(null);
      setMessage("");
      
      // Show success message
      alert("Application submitted successfully!");

    } catch (error) {
      console.error('Error submitting application:', error);
      alert(`Error submitting application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format requirements as an array if it's not already one
  const getRequirements = (job) => {
    if (!job) return [];
    if (Array.isArray(job.requirements)) return job.requirements;
    if (typeof job.description === 'string') {
      return job.description
        .split('\n')
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^[•-]\s*/, ''));
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Available Jobs</h2>
        
        <div className="flex items-center space-x-4">
          {/* Search input */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              className="pl-9 w-64"
            />
          </div>
          
          {/* Filter button */}
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
      
      {/* Real Job Cards */}
      <RealJobsComponent onJobClick={handleJobClick} />

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto job-dialog-content">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl font-bold">{selectedJob.title}</DialogTitle>
                  <DialogDescription className="flex flex-wrap gap-4 items-center pt-2">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {selectedJob.companyName || 'Company Name'}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedJob.workMode} {selectedJob.location ? `(${selectedJob.location})` : ''}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(selectedJob.createdAt).toLocaleDateString()}
                    </span>
                  </DialogDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Bookmark className="h-4 w-4 transition-colors" />
                  Save Job
                </Button>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="description" className="mt-6">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="apply">Apply Now</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedJob.description || 'No detailed description available.'}
                    </p>
                  </div>
                  
                  {getRequirements(selectedJob).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                      <ul className="list-disc list-outside ml-5 text-gray-700 space-y-1">
                        {getRequirements(selectedJob).map((req, index) => (
                          <li key={index} className="leading-relaxed">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Job Type</span>
                        <span className="font-medium">{selectedJob.jobType || 'Full-time'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Department</span>
                        <span className="font-medium">{selectedJob.department || 'General'}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Location</span>
                        <span className="font-medium">
                          {selectedJob.workMode} {selectedJob.location ? `(${selectedJob.location})` : ''}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Level</span>
                        <span className="font-medium">{selectedJob.level || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
                
              <TabsContent value="apply" className="space-y-6">
                <div className="space-y-5">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start mb-4">
                      <div className="bg-black p-2 rounded-full mr-3">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Upload Your Resume</h3>
                        <p className="text-sm text-gray-500">Upload your latest resume for this position</p>
                      </div>
                    </div>
                    
                    <FileUpload
                      accept=".pdf,.doc,.docx"
                      maxSize={5}
                      onFileChange={handleFileChange}
                      label="Click to upload your resume or drag and drop"
                    />
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start mb-4">
                      <div className="bg-black p-2 rounded-full mr-3">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Message to Recruiter</h3>
                        <p className="text-sm text-gray-500">Tell them why you're a good fit for this role</p>
                      </div>
                    </div>
                    
                    <textarea
                      id="message"
                      className="w-full p-3 border border-gray-300 rounded-lg min-h-[150px] focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Briefly describe your relevant experience and why you're interested in this position..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {message.length}/500 characters
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
                <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                disabled={!resumeFile || message.trim().length < 10 || isSubmitting} 
                onClick={handleSubmitApplication}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
