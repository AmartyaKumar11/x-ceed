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
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium border-0 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <Brain className="h-4 w-4" />
        {isAnalyzing ? (
          <>
            <Clock className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            AI Shortlist
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/90 ml-1">
              Gemini
            </span>
          </>
        )}
      </Button>
      
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
    </div>  );
};

export default AIShortlistButton;
