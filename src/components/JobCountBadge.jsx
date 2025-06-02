'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function JobCountBadge() {
  const [count, setCount] = useState('...');
    useEffect(() => {
    const fetchJobCount = async () => {
      try {
        const response = await apiClient.get('/api/jobs?public=true');
        if (response && response.success) {
          setCount(response.data.length);
        } else {
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
