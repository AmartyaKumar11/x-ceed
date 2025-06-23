'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const AIShortlistButton = ({ job, onShortlistComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleAIShortlist = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Navigate to the shortlist page immediately
      // The shortlist page will handle the AI analysis
      router.push(`/dashboard/recruiter/jobs/${job._id}/shortlist`);
      
      // Call completion callback if provided
      if (onShortlistComplete) {
        onShortlistComplete({ redirected: true });
      }
    } catch (error) {
      console.error('❌ Navigation Error:', error);
      setError('Failed to navigate to shortlist page');
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleAIShortlist}
        disabled={isAnalyzing}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border border-blue-200 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:hover:from-blue-800/40 dark:hover:to-purple-800/40 dark:border-blue-800 dark:text-blue-300"
      >
        <Brain className="h-4 w-4" />
        {isAnalyzing ? (
          <>
            <Clock className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'AI Shortlist'
        )}
      </Button>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>  );
};

export default AIShortlistButton;
