"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { resumeAPI } from "@/lib/api";

export function ViewApplicationDialog({ isOpen, onClose, candidate }) {
  const { toast } = useToast();
  
  if (!candidate) return null;
  
  const handleSendAcceptanceLetter = () => {
    // Here you would implement the API call to send an acceptance letter
    toast({
      title: "Sent Interview Notification",
      description: `An interview invitation has been sent to ${candidate.name}`,
      variant: "default",
    });
  };

  const handleDownloadResume = async () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[600px] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{candidate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position Applied For</p>
                  <p className="font-medium">{candidate.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Application</p>
                  <p className="font-medium">
                    {format(new Date(candidate.dateOfApplication), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{candidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{candidate.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{candidate.address}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Professional Background</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{candidate.experience}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Education</p>
                  <p className="font-medium">{candidate.education}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills && candidate.skills.map((skill, index) => (
                  <span key={index} className="bg-primary-50 text-primary-700 px-2 py-1 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Cover Letter</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground whitespace-pre-wrap">
                  {candidate.coverLetter || 'No cover letter provided.'}
                </p>
              </div>
            </div>

            {candidate.additionalMessage && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Message</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">
                    {candidate.additionalMessage}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Resume</h3>
              <div className="bg-muted p-4 rounded-lg">
                {candidate.resumeUrl ? (
                  <p className="text-foreground">
                    Resume available for download
                  </p>
                ) : (
                  <p className="text-muted-foreground">No resume uploaded</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Button 
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleDownloadResume}
                disabled={!candidate.userId || !candidate.resumeUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
              <Button 
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSendAcceptanceLetter}
              >
                Send Acceptance Letter for Interview
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 