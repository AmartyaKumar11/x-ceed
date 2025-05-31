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

export function ViewApplicationDialog({ isOpen, onClose, candidate }) {
  const { toast } = useToast();
  
  if (!candidate) return null;
  
  const handleSendAcceptanceLetter = () => {
    // Here you would implement the API call to send an acceptance letter
    toast({
      title: "Sent Interview Notification",
      description: `An interview invitation has been sent to ${candidate.name}`,
      variant: "default", // Using our new black translucent style
    });
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
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{candidate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position Applied For</p>
                  <p className="font-medium">{candidate.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Application</p>
                  <p className="font-medium">
                    {format(new Date(candidate.dateOfApplication), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{candidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{candidate.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{candidate.address}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Professional Background</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{candidate.experience}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Education</p>
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
              <h3 className="text-lg font-semibold mb-2">Message to Recruiter</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{candidate.message}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Resume</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Resume
                  </a>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Button 
                variant="default"
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => window.open(candidate.resumeUrl, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
              <Button 
                variant="default"
                className="bg-black hover:bg-gray-800 text-white"
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