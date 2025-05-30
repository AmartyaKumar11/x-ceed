'use client';

import { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Mock job data
const jobsData = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "Remote",
    type: "Full-time",
    salary: "$120K - $150K",
    postedDate: "May 15, 2025",
    description: "We're looking for an experienced Frontend Developer to join our team. You'll be responsible for building responsive web applications, implementing UI/UX designs, and collaborating with backend developers.",
    requirements: [
      "5+ years of experience with React, Next.js",
      "Strong knowledge of JavaScript, HTML, CSS",
      "Experience with state management (Redux, Context API)",
      "Familiarity with CSS frameworks (Tailwind, Bootstrap)",
      "Good understanding of responsive design and cross-browser compatibility"
    ],
    category: "tech",
    skill: "frontend"
  },
  {
    id: 2,
    title: "UI/UX Designer",
    company: "DesignHub",
    location: "On-site",
    type: "Full-time",
    salary: "$90K - $110K",
    postedDate: "May 18, 2025",
    description: "Join our creative team as a UI/UX Designer and help create beautiful, intuitive interfaces for our products. You'll work closely with product managers and developers to deliver exceptional user experiences.",
    requirements: [
      "3+ years of UI/UX design experience",
      "Proficiency in design tools like Figma, Sketch",
      "Portfolio demonstrating strong visual design skills",
      "Experience conducting user research and usability testing",
      "Knowledge of design systems and component libraries"
    ],
    category: "tech",
    skill: "design"
  },
  {
    id: 3,
    title: "Product Manager",
    company: "InnovateTech",
    location: "Hybrid",
    type: "Full-time",
    salary: "$130K - $160K",
    postedDate: "May 20, 2025",
    description: "As a Product Manager, you'll be responsible for defining product strategy, gathering user requirements, and working with engineering teams to deliver high-quality products that meet business objectives.",
    requirements: [
      "4+ years of product management experience",
      "Strong analytical and problem-solving skills",
      "Experience with agile development methodologies",
      "Excellent communication and stakeholder management",
      "Technical background preferred"
    ],
    category: "non-tech",
    skill: "management"
  },
  {
    id: 4,
    title: "Backend Developer",
    company: "ServerStack",
    location: "Remote",
    type: "Full-time",
    salary: "$110K - $140K",
    postedDate: "May 22, 2025",
    description: "We're seeking a skilled Backend Developer to design and build scalable server-side applications. You'll be working with microservices architecture and cloud technologies to deliver robust solutions.",
    requirements: [
      "4+ years of backend development experience",
      "Proficiency in Node.js, Python, or Java",
      "Experience with databases (SQL and NoSQL)",
      "Knowledge of cloud platforms (AWS, Azure, GCP)",
      "Understanding of RESTful APIs and microservices"
    ],
    category: "tech",
    skill: "backend"
  },
  {
    id: 5,
    title: "Data Analyst",
    company: "DataInsights",
    location: "On-site",
    type: "Full-time",
    salary: "$85K - $110K",
    postedDate: "May 25, 2025",
    description: "As a Data Analyst, you'll be responsible for interpreting data, analyzing results, and providing ongoing reports to help our company make better business decisions.",
    requirements: [
      "3+ years of experience in data analysis",
      "Proficiency in SQL, Excel, and data visualization tools",
      "Experience with business intelligence tools (Tableau, Power BI)",
      "Strong analytical and statistical skills",
      "Ability to present complex findings in an understandable way"
    ],
    category: "tech",
    skill: "data"
  },
  {
    id: 6,
    title: "Marketing Manager",
    company: "BrandBoost",
    location: "Hybrid",
    type: "Full-time",
    salary: "$95K - $120K",
    postedDate: "May 26, 2025",
    description: "We're looking for a Marketing Manager to lead our marketing efforts. You'll be responsible for developing and implementing marketing strategies to promote our products and services.",
    requirements: [
      "5+ years of marketing experience",
      "Experience with digital marketing channels",
      "Strong project management skills",
      "Excellent written and verbal communication",
      "Analytical mindset with experience in campaign measurement"
    ],
    category: "non-tech",
    skill: "marketing"
  },
  {
    id: 7,
    title: "DevOps Engineer",
    company: "CloudNative",
    location: "Remote",
    type: "Full-time",
    salary: "$115K - $145K",
    postedDate: "May 27, 2025",
    description: "Join our team as a DevOps Engineer to build and maintain our cloud infrastructure. You'll be responsible for CI/CD pipelines, infrastructure as code, and ensuring high availability of our services.",
    requirements: [
      "4+ years of DevOps experience",
      "Strong knowledge of cloud platforms (AWS, Azure, GCP)",
      "Experience with containerization (Docker, Kubernetes)",
      "Proficiency with IaC tools (Terraform, CloudFormation)",
      "Understanding of CI/CD concepts and tools"
    ],
    category: "tech",
    skill: "devops"
  },
  {
    id: 8,
    title: "HR Specialist",
    company: "PeopleFirst",
    location: "On-site",
    type: "Full-time",
    salary: "$70K - $90K",
    postedDate: "May 28, 2025",
    description: "As an HR Specialist, you'll handle various aspects of human resources including recruitment, employee relations, benefits administration, and policy implementation.",
    requirements: [
      "3+ years of HR experience",
      "Knowledge of HR best practices and labor laws",
      "Experience with HRIS systems",
      "Strong interpersonal and communication skills",
      "Bachelor's degree in HR or related field"
    ],
    category: "non-tech",
    skill: "hr"
  }
];

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [filters, setFilters] = useState({
    category: [],
    skill: [],
    location: [],
    salaryRange: [50000, 200000],
    type: [],
    internshipDuration: ""
  });  const [filteredJobs, setFilteredJobs] = useState(jobsData);
  const [message, setMessage] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  
  // Define available skills
  const allSkills = ["frontend", "backend", "design", "data", "management", "marketing", "devops", "hr"];
  
  // Filter skills based on search input
  const filteredSkills = searchSkill
    ? allSkills.filter(skill => skill.toLowerCase().includes(searchSkill.toLowerCase()))
    : allSkills;

  // Handle job card click
  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (key === "category" || key === "location" || key === "type" || key === "skill") {
        // Initialize the array if it doesn't exist
        if (!newFilters[key]) {
          newFilters[key] = [];
        }
        
        if (newFilters[key].includes(value)) {
          newFilters[key] = newFilters[key].filter(item => item !== value);
        } else {
          newFilters[key] = [...newFilters[key], value];
        }
      } else {
        newFilters[key] = value;
      }
      
      return newFilters;
    });
  };  // Apply filters
  const applyFilters = () => {
    let results = jobsData;
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filters
    if (filters.category && filters.category.length > 0) {
      results = results.filter(job => filters.category.includes(job.category));
    }
    
    // Apply skill filters
    if (filters.skill && filters.skill.length > 0) {
      results = results.filter(job => filters.skill.includes(job.skill));
    }
    
    // Apply location filters
    if (filters.location && filters.location.length > 0) {
      results = results.filter(job => filters.location.includes(job.location));
    }
    
    // Apply type filters
    if (filters.type && filters.type.length > 0) {
      results = results.filter(job => filters.type.includes(job.type));
      
      // Apply internship duration filter only if Internship is selected
      if (filters.type.includes("Internship") && filters.internshipDuration) {
        // This is a placeholder since we don't have internshipDuration in the data
        // In a real app, you would filter by the actual duration field
        console.log(`Filtering for internship duration: ${filters.internshipDuration}`);
        // For demonstration, we'll just keep the existing results
      }
    }
    
    // Apply salary range filter
    results = results.filter(job => {
      const salaryText = job.salary;
      const averageSalary = calculateAverageSalary(salaryText);
      return averageSalary >= filters.salaryRange[0] && averageSalary <= filters.salaryRange[1];
    });
    
    setFilteredJobs(results);
    setIsFilterOpen(false);
  };

  // Helper to calculate average salary from salary range string
  const calculateAverageSalary = (salaryText) => {
    // Extract numbers from salary range (e.g. "$120K - $150K" -> 135000)
    const matches = salaryText.match(/\$(\d+)K\s*-\s*\$(\d+)K/);
    if (matches && matches.length === 3) {
      const min = parseInt(matches[1]) * 1000;
      const max = parseInt(matches[2]) * 1000;
      return (min + max) / 2;
    }
    return 0;
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  // Submit application
  const handleSubmitApplication = () => {
    // Here you would handle the application submission
    console.log("Submitting application for:", selectedJob.title);
    console.log("Resume:", resumeFile);
    console.log("Message:", message);
    
    // Close dialog and show success message
    setIsDialogOpen(false);
    setResumeFile(null);
    setMessage("");
    
    // You would typically show a success notification here
    alert("Application submitted successfully!");
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filter button */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>Narrow down your job search</SheetDescription>
              </SheetHeader>
                <div className="py-6 space-y-6">
                {/* Category filter */}
                <div className="space-y-2">
                  <h3 className="font-medium">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {["tech", "non-tech"].map(category => (
                      <Badge
                        key={category}
                        variant={filters.category.includes(category) ? "active" : "inactive"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => handleFilterChange("category", category)}
                      >
                        {category === "tech" ? "Technology" : "Non-Technology"}
                      </Badge>
                    ))}
                  </div>
                </div>
                  {/* Job Skills filter */}
                <div className="space-y-2">
                  <h3 className="font-medium">Skills</h3>
                  <div className="space-y-2">
                    <Input 
                      placeholder="Search for skills..." 
                      className="w-full mb-2"
                      onChange={(e) => setSearchSkill(e.target.value)}
                      value={searchSkill}
                    />
                    <div className="flex flex-wrap gap-2">
                      {filteredSkills.map(skill => (
                        <Badge
                          key={skill}
                          variant={filters.skill?.includes(skill) ? "active" : "inactive"}
                          className="cursor-pointer px-3 py-1"
                          onClick={() => handleFilterChange("skill", skill)}
                        >
                          {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Location filter */}
                <div className="space-y-2">
                  <h3 className="font-medium">Location</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Remote", "On-site", "Hybrid"].map(location => (
                      <Badge
                        key={location}
                        variant={filters.location.includes(location) ? "active" : "inactive"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => handleFilterChange("location", location)}
                      >
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
                  {/* Job Type filter */}
                <div className="space-y-2">
                  <h3 className="font-medium">Job Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Full-time", "Part-time", "Contract", "Internship"].map(type => (
                      <Badge
                        key={type}
                        variant={filters.type.includes(type) ? "active" : "inactive"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => handleFilterChange("type", type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Internship Duration - only shown when Internship is selected */}
                  {filters.type?.includes("Internship") && (
                    <div className="mt-3 space-y-2">
                      <h4 className="text-sm font-medium">Internship Duration</h4>
                      <div className="flex flex-wrap gap-2">                        {["3 Months", "6 Months", "1 Year"].map(duration => (
                          <Badge
                            key={duration}
                            variant={filters.internshipDuration === duration ? "active" : "inactive"}
                            className="cursor-pointer px-3 py-1"
                            onClick={() => {
                              // Toggle duration if already selected, otherwise set it
                              const newDuration = filters.internshipDuration === duration ? "" : duration;
                              setFilters({...filters, internshipDuration: newDuration});
                            }}
                          >
                            {duration}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Salary Range slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Salary Range</h3>
                    <span className="text-sm text-gray-500">
                      ${Math.floor(filters.salaryRange[0]/1000)}K - ${Math.floor(filters.salaryRange[1]/1000)}K
                    </span>
                  </div>
                  <Slider
                    value={filters.salaryRange}
                    min={40000}
                    max={200000}
                    step={5000}
                    onValueChange={(value) => setFilters(prev => ({...prev, salaryRange: value}))}
                    className="py-4"
                  />
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
        {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 job-cards-container">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card 
              key={job.id} 
              className="job-card hover:shadow-lg transition-all cursor-pointer border-gray-200"
              onClick={() => handleJobClick(job)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Building className="h-3 w-3 mr-1" />
                      {job.company}
                    </CardDescription>
                  </div>                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = e.currentTarget;
                      const icon = target.querySelector('svg');
                      if (icon) {
                        const isSaved = icon.classList.toggle('text-black');
                        console.log('Save job:', job.id, isSaved ? 'saved' : 'unsaved');
                      }
                    }}
                  >
                    <Bookmark className="h-4 w-4 transition-colors" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-500 mr-4">
                    <MapPin className="h-3 w-3 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mr-4">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {job.salary}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Posted {job.postedDate}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="font-normal">
                    {job.type}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {job.category}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {job.skill}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto">View Details</Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No matching jobs found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms</p>            <Button variant="outline" className="mt-4" onClick={() => {
              setSearchQuery("");
              setSearchSkill("");
              setFilters({
                category: [],
                skill: [],
                location: [],
                salaryRange: [50000, 200000],
                type: [],
                internshipDuration: ""
              });
              setFilteredJobs(jobsData);
            }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>      {/* Job Details Dialog */}
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
                      {selectedJob.company}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedJob.location}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {selectedJob.salary}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Posted {selectedJob.postedDate}
                    </span>
                  </DialogDescription>
                </div>                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const target = e.currentTarget;
                    const icon = target.querySelector('svg');
                    if (icon) {
                      const isSaved = icon.classList.toggle('text-black');
                      target.classList.toggle('bg-black');
                      target.classList.toggle('text-white');
                      console.log('Save job:', selectedJob.id, isSaved ? 'saved' : 'unsaved');
                    }
                  }}
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
                    <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                    <ul className="list-disc list-outside ml-5 text-gray-700 space-y-1">
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index} className="leading-relaxed">{req}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Job Type</span>
                        <span className="font-medium">{selectedJob.type}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Category</span>
                        <span className="font-medium">{selectedJob.category}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Location</span>
                        <span className="font-medium">{selectedJob.location}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-500 block">Salary Range</span>
                        <span className="font-medium">{selectedJob.salary}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <Button className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download JD
                  </Button>
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
                      onFileChange={setResumeFile}
                      label="Click to upload your resume or drag and drop"
                    />
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start mb-4">
                      <div className="bg-black p-2 rounded-full mr-3">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Resume Match</h3>
                        <p className="text-sm text-gray-500">Match your resume with job requirements</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center w-full justify-center py-6 match-button"
                      disabled={!resumeFile}
                      onClick={() => {
                        // In a real app, this would analyze the resume
                        alert("Analyzing resume for match... (This is a demo)")
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Match my resume with job description
                    </Button>
                    
                    {!resumeFile && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Please upload your resume first
                      </p>
                    )}
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
                
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">
                    By submitting your application, you agree to our Terms of Service and Privacy Policy. Your information will be shared with the employer.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
              <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                disabled={!resumeFile || message.trim().length < 10} 
                onClick={handleSubmitApplication}
              >
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
