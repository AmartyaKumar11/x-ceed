'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the loading page when the site is first loaded
    const redirectTimer = setTimeout(() => {
      router.push('/loading');
    }, 100);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    // This is just a placeholder while the redirect happens
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
