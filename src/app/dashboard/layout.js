'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import CreateJobDialog from '@/components/CreateJobDialog';

export default function DashboardLayout({ children }) {
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const pathname = usePathname();
  const isApplicant = pathname.includes('/applicant');
  const isRecruiter = pathname.includes('/recruiter');
  const role = isApplicant ? 'applicant' : 'recruiter';

  const handleJobCreated = (newJob) => {
    // You can add logic here to update the job list in real-time
    console.log('New job created:', newJob);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar that appears on hover */}
      <Sidebar role={role} />
        {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground">X-CEED</h1>
          </div>
          <div className="flex items-center gap-4">
            {isRecruiter && (
              <button
                onClick={() => setIsCreateJobDialogOpen(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Job
              </button>
            )}
            <Link 
              href="/auth" 
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>
        {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>

      {/* Create Job Dialog */}
      {isRecruiter && (
        <CreateJobDialog
          isOpen={isCreateJobDialogOpen}
          onClose={() => setIsCreateJobDialogOpen(false)}
          onJobCreated={handleJobCreated}
        />
      )}
    </div>
  );
}
