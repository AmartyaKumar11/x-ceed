'use client';

import { useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function JobDescriptionUpload({ onJobDescriptionSet }) {
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const { toast } = useToast();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or text file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-job-description', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse job description');
      }

      const data = await response.json();
      // Try to extract text from the correct field in the backend response
      let extractedText = data.text || data.description || '';
      if (!extractedText && data.data) {
        extractedText = data.data.text || data.data.description || '';
        // If still not found, fallback to stringified data for display
        if (!extractedText && typeof data.data === 'object') {
          extractedText = JSON.stringify(data.data, null, 2);
        }
      }

      if (extractedText.trim()) {
        setJobDescription(extractedText);
        localStorage.setItem('mockInterviewJobDescription', extractedText);
        onJobDescriptionSet(extractedText);
        
        toast({
          title: "Job description uploaded!",
          description: "You can now start your mock interview.",
        });
      } else {
        throw new Error('No text extracted from file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Could not extract text from the file. Please try again or enter manually.",
        variant: "destructive",
      });
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualInput = () => {
    if (jobDescription.trim()) {
      localStorage.setItem('mockInterviewJobDescription', jobDescription);
      onJobDescriptionSet(jobDescription);
      
      toast({
        title: "Job description saved!",
        description: "You can now start your mock interview.",
      });
    }
  };

  const clearJobDescription = () => {
    setJobDescription('');
    setUploadedFile(null);
    localStorage.removeItem('mockInterviewJobDescription');
    onJobDescriptionSet('');
    
    toast({
      title: "Job description cleared",
      description: "Please upload or enter a new job description.",
    });
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Job Description
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!jobDescription ? (
          <>
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Job Description (PDF/TXT)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="job-description-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="job-description-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">PDF or TXT files only</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Manual Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Or enter manually</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste or type the job description here..."
                className="w-full min-h-[120px] p-3 border rounded-md bg-background resize-none"
              />
              <Button
                onClick={handleManualInput}
                disabled={!jobDescription.trim()}
                className="w-full"
              >
                Save Job Description
              </Button>
            </div>
          </>
        ) : (
          /* Display uploaded job description */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Job Description Loaded</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearJobDescription}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto p-3 bg-muted rounded-md">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {jobDescription.length > 500 
                  ? `${jobDescription.substring(0, 500)}...` 
                  : jobDescription
                }
              </p>
              {jobDescription.length > 500 && (
                <p className="text-xs text-muted-foreground mt-2">
                  (Showing first 500 characters)
                </p>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {uploadedFile && (
                <p>Uploaded: {uploadedFile.name}</p>
              )}
              <p>Characters: {jobDescription.length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 