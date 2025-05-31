"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Download, Eye } from "lucide-react";
import { ViewApplicationDialog } from "@/components/ViewApplicationDialog";

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // This would typically come from your API/database
  const [candidates] = useState([
    {
      id: 1,
      name: "John Doe",
      position: "Senior Frontend Developer",
      dateOfApplication: "2025-04-20",
      resumeUrl: "/resumes/john-doe.pdf",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, San Francisco, CA 94105",
      experience: "5 years",
      education: "Master's in Computer Science, Stanford University",
      skills: ["React", "TypeScript", "Next.js", "TailwindCSS"],
      message: "I am very interested in this position and believe my skills align perfectly with your requirements. I have 5 years of experience in the field and am excited about the opportunity to contribute to your team.",
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "Full Stack Developer",
      dateOfApplication: "2025-04-19",
      resumeUrl: "/resumes/jane-smith.pdf",
      email: "jane.smith@example.com",
      phone: "+1 (555) 987-6543",
      address: "456 Market St, San Francisco, CA 94105",
      experience: "3 years",
      education: "Bachelor's in Software Engineering, UC Berkeley",
      skills: ["JavaScript", "Python", "Node.js", "MongoDB"],
      message: "I am writing to express my strong interest in the position. My background in software development and passion for innovation make me an ideal candidate for this role.",
    },
    {
      id: 3,
      name: "Robert Johnson",
      position: "UX/UI Designer",
      dateOfApplication: "2025-04-22",
      resumeUrl: "/resumes/robert-johnson.pdf",
      email: "robert.johnson@example.com",
      phone: "+1 (555) 456-7890",
      address: "789 Mission St, San Francisco, CA 94103",
      experience: "4 years",
      education: "Bachelor's in Design, Rhode Island School of Design",
      skills: ["Figma", "Adobe XD", "Sketch", "User Research"],
      message: "I'm excited about the opportunity to join your team as a UX/UI Designer. My portfolio demonstrates my ability to create intuitive and visually appealing designs that enhance user experience.",
    },
    {
      id: 4,
      name: "Emily Chen",
      position: "Backend Developer",
      dateOfApplication: "2025-04-25",
      resumeUrl: "/resumes/emily-chen.pdf",
      email: "emily.chen@example.com",
      phone: "+1 (555) 234-5678",
      address: "567 Howard St, San Francisco, CA 94105",
      experience: "6 years",
      education: "Ph.D. in Computer Science, MIT",
      skills: ["Java", "Spring Boot", "AWS", "Docker", "Kubernetes"],
      message: "I've been following your company's growth for several years and am impressed by your innovative approach. I believe my backend expertise would be a valuable addition to your engineering team.",
    },
    {
      id: 5,
      name: "Michael Rodriguez",
      position: "DevOps Engineer",
      dateOfApplication: "2025-04-26",
      resumeUrl: "/resumes/michael-rodriguez.pdf",
      email: "michael.rodriguez@example.com",
      phone: "+1 (555) 876-5432",
      address: "890 Folsom St, San Francisco, CA 94107",
      experience: "4 years",
      education: "Bachelor's in Computer Engineering, Georgia Tech",
      skills: ["AWS", "Terraform", "Jenkins", "Docker", "Kubernetes"],
      message: "With my experience in building robust CI/CD pipelines and managing cloud infrastructure, I'm confident I can help streamline your development processes and improve deployment efficiency.",
    },
    {
      id: 6,
      name: "Sarah Wilson",
      position: "Data Scientist",
      dateOfApplication: "2025-04-27",
      resumeUrl: "/resumes/sarah-wilson.pdf",
      email: "sarah.wilson@example.com",
      phone: "+1 (555) 345-6789",
      address: "234 Bryant St, San Francisco, CA 94107",
      experience: "3 years",
      education: "Master's in Data Science, UC San Diego",
      skills: ["Python", "Pandas", "TensorFlow", "SQL", "Data Visualization"],
      message: "I'm particularly drawn to the data challenges your company is solving. I've worked on similar problems in my previous role and would love to bring my analytical skills to your team.",
    },
    {
      id: 7,
      name: "David Kim",
      position: "Mobile Developer",
      dateOfApplication: "2025-04-28",
      resumeUrl: "/resumes/david-kim.pdf",
      email: "david.kim@example.com",
      phone: "+1 (555) 567-8901",
      address: "456 Brannan St, San Francisco, CA 94107",
      experience: "5 years",
      education: "Bachelor's in Computer Science, UCLA",
      skills: ["Swift", "Kotlin", "React Native", "Firebase"],
      message: "I've built and published several mobile applications with millions of downloads. I'm excited about the opportunity to help develop and improve your mobile experience.",
    },
    {
      id: 8,
      name: "Priya Patel",
      position: "QA Engineer",
      dateOfApplication: "2025-04-29",
      resumeUrl: "/resumes/priya-patel.pdf",
      email: "priya.patel@example.com",
      phone: "+1 (555) 678-9012",
      address: "789 Townsend St, San Francisco, CA 94107",
      experience: "4 years",
      education: "Bachelor's in Information Technology, Purdue University",
      skills: ["Selenium", "Cypress", "Jest", "Test Planning", "JIRA"],
      message: "I'm a detail-oriented QA engineer with a passion for ensuring software quality. I have experience in both manual and automated testing and would love to help ensure your products meet the highest standards.",
    },
    {
      id: 9,
      name: "Thomas Wright",
      position: "Product Manager",
      dateOfApplication: "2025-04-30",
      resumeUrl: "/resumes/thomas-wright.pdf",
      email: "thomas.wright@example.com",
      phone: "+1 (555) 789-0123",
      address: "123 Berry St, San Francisco, CA 94107",
      experience: "7 years",
      education: "MBA, Harvard Business School",
      skills: ["Product Strategy", "User Research", "Agile", "Roadmapping"],
      message: "As a product manager with experience in both startups and enterprise companies, I've led teams to launch successful products that users love. I'm excited about the possibility of bringing my expertise to your team.",
    },
    {
      id: 10,
      name: "Olivia Martinez",
      position: "Marketing Specialist",
      dateOfApplication: "2025-05-01",
      resumeUrl: "/resumes/olivia-martinez.pdf",
      email: "olivia.martinez@example.com",
      phone: "+1 (555) 890-1234",
      address: "567 4th St, San Francisco, CA 94107",
      experience: "5 years",
      education: "Bachelor's in Marketing, NYU",
      skills: ["Digital Marketing", "SEO", "Social Media", "Content Strategy"],
      message: "I've helped companies increase their online presence and user acquisition through strategic marketing campaigns. I'd love to apply my skills to help grow your user base.",
    },
  ]);

  const handleViewApplication = (candidateId) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    setSelectedCandidate(candidate);
    setIsDialogOpen(true);
  };

  const handleDownloadResume = (resumeUrl) => {
    window.open(resumeUrl, "_blank");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Candidates</h1>
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{candidate.name}</h3>
                      <p className="text-sm font-medium text-primary">{candidate.position}</p>
                      <p className="text-sm text-gray-500">
                        Applied on {format(new Date(candidate.dateOfApplication), "MMMM d, yyyy")}
                      </p>
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
                        onClick={() => handleDownloadResume(candidate.resumeUrl)}
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