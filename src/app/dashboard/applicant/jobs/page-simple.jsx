'use client';

import { useState } from 'react';
import { 
  Filter, 
  Search,
  X,
  MapPin,
  DollarSign,
  Building,
  Calendar,
  ChevronDown
} from 'lucide-react';
import RealJobsComponent from '@/components/RealJobsComponent';
import JobApplicationDialog from '@/components/JobApplicationDialog';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ApplicantJobsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: [],
    workMode: [],
    department: [],
    level: [],
    location: '',
    salaryRange: [0, 200000],
    postedWithin: '',
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Handle job card click
  const handleJobClick = (job) => {
    console.log('Selected job:', job);
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  // Handle successful application submission
  const handleApplicationSubmitted = (applicationData, recommendedJob) => {
    console.log('Application submitted successfully!');
    setIsDialogOpen(false);
    setSelectedJob(null);
    
    if (recommendedJob) {
      console.log('Opening recommended job:', recommendedJob);
      setSelectedJob(recommendedJob);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card claymorphism p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold text-foreground">Available Jobs</h2>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-9 w-full sm:w-64 bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>

            {/* Saved Jobs Toggle */}
            <Button 
              variant={showSavedOnly ? "default" : "outline"}
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
            >
              {showSavedOnly ? 'All Jobs' : 'Saved Jobs'}
            </Button>
          </div>
        </div>
      </div>

      {/* Real Job Cards with claymorphism container */}
      <div className="card claymorphism p-6">
        <RealJobsComponent 
          onJobClick={handleJobClick} 
          searchQuery={searchQuery}
          filters={filters}
          showSavedOnly={showSavedOnly}
        />
      </div>

      {/* Job Application Dialog */}
      <JobApplicationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        job={selectedJob}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </div>
  );
}
