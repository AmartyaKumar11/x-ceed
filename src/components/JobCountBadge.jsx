'use client';

import { useState, useEffect } from 'react';

export default function JobCountBadge() {
  const [count, setCount] = useState('...');
    useEffect(() => {
    const fetchJobCount = async () => {
      try {
        const response = await fetch('/api/jobs?public=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.success) {
            setCount(data.data.length);
          } else {
            setCount('?');
          }
        } else {
          console.error('Failed to fetch job count:', response.status);
          setCount('?');
        }
      } catch (error) {
        console.error("Error fetching job count:", error);
        setCount('?');
      }
    };
    
    fetchJobCount();
  }, []);
  
  return (
    <h3 className="text-2xl font-bold">{count}</h3>
  );
}
