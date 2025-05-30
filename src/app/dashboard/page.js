'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a placeholder page that will redirect users to appropriate dashboard
// In a real application, you would check the user's role in a database/session
export default function DashboardPage() {
  const router = useRouter();
    useEffect(() => {
    // For demo, redirect to applicant dashboard by default
    // In a real app, you would check the user's role from authentication state
    const checkUserRole = () => {
      // Simulate checking user role
      let userRole = 'applicant';  // Default role
      
      if (typeof window !== 'undefined') {
        userRole = localStorage.getItem('userRole') || 'applicant';
      }
      
      if (userRole === 'recruiter') {
        router.replace('/dashboard/recruiter');
      } else {
        router.replace('/dashboard/applicant');
      }
    };
    
    checkUserRole();
  }, [router]);
  
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-pulse">Loading your dashboard...</div>
    </div>
  );
}
