'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isApplicant = pathname.includes('/applicant');
  const isRecruiter = pathname.includes('/recruiter');
  const role = isApplicant ? 'applicant' : 'recruiter';
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar that appears on hover */}
      <Sidebar role={role} />
        {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground">X-CEED</h1>
          </div>          <div className="flex items-center gap-4">
            <Link 
              href="/auth" 
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>      {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}
