'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the loading page when the site is first loaded
    router.replace('/loading');
  }, [router]);

  return (
    // This is just a placeholder while the redirect happens
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}