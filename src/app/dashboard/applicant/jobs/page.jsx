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
  ChevronDown,
  Globe,
  Briefcase
} from 'lucide-react';
import RealJobsComponent from '@/components/RealJobsComponent';
import JobicyJobsComponent from '@/components/JobicyJobsComponent';
import JobApplicationDialog from '@/components/JobApplicationDialog';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      {/* Page Header */}
      <div className="card p-6">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-foreground">Job Opportunities</h1>
          <p className="text-muted-foreground">
            Explore job opportunities from multiple sources and find your perfect match
          </p>
        </div>

        {/* Job Sources Tabs */}
        <Tabs defaultValue="remote" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="remote" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Remote Jobs
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Local Jobs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="remote" className="mt-6">
            <JobicyJobsComponent />
          </TabsContent>
          
          <TabsContent value="local" className="mt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Button */}
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>

                {/* Saved Jobs Toggle */}
                <Button 
                  variant={showSavedOnly ? "default" : "outline"}
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                >
                  {showSavedOnly ? 'All Jobs' : 'Saved Jobs'}
                </Button>
              </div>

              <RealJobsComponent 
                onJobClick={handleJobClick} 
                searchQuery={searchQuery}
                filters={filters}
                showSavedOnly={showSavedOnly}
              />
            </div>
          </TabsContent>
        </Tabs>
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
