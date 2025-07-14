'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import FloatingNotificationBell from '@/components/FloatingNotificationBell';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isApplicant = pathname.includes('/applicant');
  const isRecruiter = pathname.includes('/recruiter');
  const role = isApplicant ? 'applicant' : 'recruiter';  return (
    <div className="min-h-screen bg-background transition-all duration-300">
      {/* Sidebar that appears on hover */}
      <Sidebar role={role} />
        {/* Header with claymorphism effect */}
      <header className="border-b border-border bg-card/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href={`/dashboard/${role}`} className="text-2xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
              X-CEED
            </Link>
          </div><div className="flex items-center gap-4">
            <Link 
              href="/auth" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-1.5 rounded-md hover:bg-muted/50"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>      {/* Main content with claymorphism background */}
      <main className="container mx-auto py-8 px-4 min-h-[calc(100vh-4rem)]">
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Floating Notification Bell - Only show for applicants */}
      {isApplicant && <FloatingNotificationBell />}
    </div>
  );
}
