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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function ApplicantJobsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    jobType: [],
    workMode: [],
    department: [],
    level: [],
    location: '',
    salaryRange: [0, 200000],
    postedWithin: '',
  });
    // Available filter options - comprehensive list to handle variations
  const filterOptions = {
    jobType: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Temporary'],
    workMode: ['Remote', 'On-site', 'Hybrid', 'Onsite', 'Work from home'],
    department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design', 'Product', 'Operations', 'Customer Success', 'Data Science', 'DevOps'],
    level: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'],
    postedWithin: [
      { label: 'Last 24 hours', value: '1d' },
      { label: 'Last 3 days', value: '3d' },
      { label: 'Last week', value: '7d' },
      { label: 'Last 2 weeks', value: '14d' },
      { label: 'Last month', value: '30d' }
    ]
  };
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
    
    // If a recommended job was clicked, open it in the dialog
    if (recommendedJob) {
      console.log('Opening recommended job:', recommendedJob);
      setSelectedJob(recommendedJob);
      setIsDialogOpen(true);
    }
    // You could add a toast notification here or refresh the jobs list
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      if (Array.isArray(prev[filterType])) {
        // For array filters (checkboxes)
        const currentValues = prev[filterType];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterType]: newValues };
      } else {
        // For single value filters
        return { ...prev, [filterType]: value };
      }
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      jobType: [],
      workMode: [],
      department: [],
      level: [],
      location: '',
      salaryRange: [0, 200000],
      postedWithin: '',
    });
    setSearchQuery('');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.jobType.length > 0) count++;
    if (filters.workMode.length > 0) count++;
    if (filters.department.length > 0) count++;
    if (filters.level.length > 0) count++;
    if (filters.location) count++;
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200000) count++;
    if (filters.postedWithin) count++;
    if (searchQuery) count++;
    return count;
  };

  // Get active filter badges
  const getActiveFilterBadges = () => {
    const badges = [];
    
    if (searchQuery) {
      badges.push({ key: 'search', label: `Search: "${searchQuery}"`, type: 'search' });
    }
    
    filters.jobType.forEach(type => {
      badges.push({ key: `jobType-${type}`, label: type, type: 'jobType' });
    });
    
    filters.workMode.forEach(mode => {
      badges.push({ key: `workMode-${mode}`, label: mode, type: 'workMode' });
    });
    
    filters.department.forEach(dept => {
      badges.push({ key: `department-${dept}`, label: dept, type: 'department' });
    });
    
    filters.level.forEach(level => {
      badges.push({ key: `level-${level}`, label: level, type: 'level' });
    });
    
    if (filters.location) {
      badges.push({ key: 'location', label: `Location: ${filters.location}`, type: 'location' });
    }
    
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200000) {
      badges.push({ 
        key: 'salary', 
        label: `Salary: $${filters.salaryRange[0]/1000}K - $${filters.salaryRange[1]/1000}K`, 
        type: 'salaryRange' 
      });
    }
    
    if (filters.postedWithin) {
      const timeLabel = filterOptions.postedWithin.find(opt => opt.value === filters.postedWithin)?.label;
      badges.push({ key: 'posted', label: `Posted: ${timeLabel}`, type: 'postedWithin' });
    }
    
    return badges;
  };

  // Remove specific filter
  const removeFilter = (badge) => {
    if (badge.type === 'search') {
      setSearchQuery('');
    } else if (Array.isArray(filters[badge.type])) {
      const value = badge.label;
      setFilters(prev => ({
        ...prev,
        [badge.type]: prev[badge.type].filter(v => v !== value)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [badge.type]: badge.type === 'salaryRange' ? [0, 200000] : ''
      }));
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold">Available Jobs</h2>
        
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
          
          {/* Filter button */}
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs"
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Jobs
                </DialogTitle>
                <DialogDescription>
                  Refine your job search with these filters
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Job Type */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Job Type
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.jobType.map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.jobType.includes(type)}
                          onChange={() => handleFilterChange('jobType', type)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Mode */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Work Mode
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.workMode.map((mode) => (
                      <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.workMode.includes(mode)}
                          onChange={() => handleFilterChange('workMode', mode)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <h4 className="font-medium mb-3">Department</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.department.map((dept) => (
                      <label key={dept} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.department.includes(dept)}
                          onChange={() => handleFilterChange('department', dept)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <h4 className="font-medium mb-3">Experience Level</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.level.map((level) => (
                      <label key={level} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.level.includes(level)}
                          onChange={() => handleFilterChange('level', level)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="font-medium mb-3">Location</h4>
                  <Input
                    placeholder="Enter city, state, or country"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>

                {/* Salary Range */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salary Range
                  </h4>
                  <div className="space-y-3">
                    <Slider
                      value={filters.salaryRange}
                      onValueChange={(value) => handleFilterChange('salaryRange', value)}
                      max={200000}
                      min={0}
                      step={5000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${filters.salaryRange[0].toLocaleString()}</span>
                      <span>${filters.salaryRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Posted Within */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Posted Within
                  </h4>                  <Select value={filters.postedWithin || 'any'} onValueChange={(value) => handleFilterChange('postedWithin', value === 'any' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any time</SelectItem>
                      {filterOptions.postedWithin.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All
                </Button>
                <Button onClick={() => setIsFilterDialogOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFilterBadges().length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {getActiveFilterBadges().map((badge) => (
            <Badge 
              key={badge.key} 
              variant="secondary" 
              className="flex items-center gap-1 pr-1"
            >
              {badge.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter(badge)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Real Job Cards */}
      <RealJobsComponent 
        onJobClick={handleJobClick} 
        searchQuery={searchQuery}
        filters={filters}
      />

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
