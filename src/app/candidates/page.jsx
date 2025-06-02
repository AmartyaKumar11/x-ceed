"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Download, Eye } from "lucide-react";
import { ViewApplicationDialog } from "@/components/ViewApplicationDialog";
import { applicationsAPI, resumeAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Fetch applications data on component mount
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getApplications();
      
      if (response.success) {
        // Transform the API data to match the component's expected format
        const transformedApplications = response.data.map(app => ({
          id: app._id,
          userId: app.applicantId, // Store userId for resume download
          name: app.applicantDetails?.personal?.name || app.applicantDetails?.email || 'Unknown',
          position: app.jobDetails?.title || 'Unknown Position',
          dateOfApplication: app.appliedAt,
          resumeUrl: app.resumePath || app.applicantDetails?.resume,
          email: app.applicantDetails?.email || '',
          phone: app.applicantDetails?.contact?.phone || '',
          address: app.applicantDetails?.personal?.address || '',
          experience: app.applicantDetails?.workExperience?.length 
            ? `${app.applicantDetails.workExperience.length} positions`
            : 'Not specified',
          education: app.applicantDetails?.education?.length > 0 
            ? app.applicantDetails.education[0].degree || 'Not specified'
            : 'Not specified',
          skills: app.applicantDetails?.skills || [],
          message: app.coverLetter || 'No cover letter provided',
          company: app.jobDetails?.company || 'Unknown Company'
        }));
        
        setApplications(transformedApplications);
      } else {
        setError(response.error || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (candidateId) => {
    const candidate = applications.find((c) => c.id === candidateId);
    setSelectedCandidate(candidate);
    setIsDialogOpen(true);
  };

  const handleDownloadResume = async (candidate) => {
    try {
      if (!candidate.userId) {
        toast({
          title: "Download Failed",
          description: "Unable to download resume: User ID not found",
          variant: "destructive",
        });
        return;
      }

      // Generate a user-friendly filename
      const fileName = `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`;
      
      await resumeAPI.downloadResumeAsFile(candidate.userId, fileName);
      
      toast({
        title: "Resume Downloaded",
        description: `Resume for ${candidate.name} has been downloaded successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Download Failed", 
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Candidates</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Candidates</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchApplications}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Candidates</h1>
      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {applications.map((candidate) => (
                  <Card key={candidate.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{candidate.name}</h3>
                        <p className="text-sm font-medium text-primary">{candidate.position}</p>
                        <p className="text-sm text-gray-500">
                          Applied on {format(new Date(candidate.dateOfApplication), "MMMM d, yyyy")}
                        </p>
                        {candidate.company && (
                          <p className="text-sm text-gray-600">Company: {candidate.company}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-black hover:bg-gray-800 text-white"
                          onClick={() => handleViewApplication(candidate.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Application
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-black hover:bg-gray-800 text-white"
                          onClick={() => handleDownloadResume(candidate)}
                          disabled={!candidate.userId || !candidate.resumeUrl}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Resume
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ViewApplicationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        candidate={selectedCandidate}
      />
    </div>
  );
} 