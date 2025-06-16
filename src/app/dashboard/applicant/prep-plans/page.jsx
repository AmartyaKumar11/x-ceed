'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap,
  Clock,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Play,
  Trash2,
  MoreVertical,
  CheckCircle,
  Target,
  Briefcase,
  FileText,
  Loader2,
  Plus,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export default function PrepPlansPage() {
  const router = useRouter();
  const [prepPlans, setPrepPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  useEffect(() => {
    fetchPrepPlans();
  }, []);

  const fetchPrepPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/prep-plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPrepPlans(result.data || []);
      } else {
        console.error('Failed to fetch prep plans');
      }
    } catch (error) {
      console.error('Error fetching prep plans:', error);
    } finally {
      setLoading(false);
    }
  };
  const deletePrepPlan = async (planId) => {
    try {
      setDeletingPlan(planId);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/prep-plans?id=${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPrepPlans(prev => prev.filter(plan => plan._id !== planId));
      } else {
        console.error('Failed to delete prep plan');
      }
    } catch (error) {
      console.error('Error deleting prep plan:', error);
    } finally {
      setDeletingPlan(null);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleDeleteClick = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const openPrepPlan = (plan) => {
    const jobData = {
      _id: plan.jobId,
      title: plan.jobTitle,
      companyName: plan.companyName,
      description: plan.jobDescription,
      requirements: plan.requirements,
      location: plan.location,
      salaryRange: plan.salaryRange,
      jobType: plan.jobType,
      ...(plan.jobDetails || {})
    };

    const jobParam = encodeURIComponent(JSON.stringify(jobData));
    router.push(`/dashboard/applicant/prep-plan?job=${jobParam}`);
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'active': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your prep plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <GraduationCap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              My Prep Plans
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your learning progress for different job opportunities
            </p>
          </div>
            <Button 
            onClick={() => router.push('/dashboard/applicant/jobs')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Prep Plans Grid */}
      {prepPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prepPlans.map((plan) => (
            <Card key={plan._id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {plan.jobTitle}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4" />
                      {plan.companyName}
                    </CardDescription>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openPrepPlan(plan)}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </DropdownMenuItem>                      <DropdownMenuItem onClick={() => handleDeleteClick(plan)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{plan.progress || 0}%</span>
                  </div>
                  <Progress 
                    value={plan.progress || 0} 
                    className="h-2"
                  />
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(plan.status)}
                  >
                    {plan.status === 'active' ? 'Ready to Start' :
                     plan.status === 'in-progress' ? 'In Progress' :
                     plan.status === 'completed' ? 'Completed' : 
                     plan.status}
                  </Badge>
                  
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(plan.createdAt)}
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {plan.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{plan.location}</span>
                    </div>
                  )}
                  
                  {plan.salaryRange && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{plan.salaryRange}</span>
                    </div>
                  )}
                  
                  {plan.jobType && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="capitalize">{plan.jobType.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>                {/* Action Button */}                <Button 
                  onClick={() => openPrepPlan(plan)}
                  className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {plan.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-purple-50 dark:bg-purple-950 rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">No Prep Plans Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Create your first prep plan by analyzing a job and clicking "Create Learning Plan" 
            in the AI Career Assistant, or browse jobs to get started.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">            <Button 
              onClick={() => router.push('/dashboard/applicant/jobs')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
              <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/applicant/resume-match')}
              className="border-border hover:bg-accent hover:text-accent-foreground"
            >
              <Target className="h-4 w-4 mr-2" />
              Analyze Resume
            </Button>
          </div>        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prep Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the prep plan for "{planToDelete?.jobTitle}" at {planToDelete?.companyName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingPlan === planToDelete?._id}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => deletePrepPlan(planToDelete?._id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingPlan === planToDelete?._id}
            >
              {deletingPlan === planToDelete?._id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
