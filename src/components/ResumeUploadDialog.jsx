'use client';

import { useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export default function ResumeUploadDialog({ isOpen, onClose, onUploadSuccess, jobId }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };
  const handleFile = async (file) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      console.log('🔄 Starting file upload:', file.name, file.size, 'bytes');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file);

      console.log('📤 Sending upload request to /api/upload/resume');

      // Upload the resume
      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Upload response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful, result:', result);
        
        // Close dialog and navigate to resume match page with uploaded file data
        onClose();
        onUploadSuccess(result.resumeData, jobId);
      } else {
        const error = await response.json();
        console.error('❌ Upload failed:', error);
        setUploadError(error.message || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      setUploadError('An error occurred while uploading your resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Your Resume
          </DialogTitle>
          <DialogDescription>
            Upload your resume to see how well it matches this job position.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 border-dashed">
          <CardContent className="p-6">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              
              <div className="flex flex-col items-center gap-3">
                <Upload className={`h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <p className="text-lg font-medium">
                    {dragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or <span className="text-blue-500 font-medium">browse files</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  PDF files only, max 5MB
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}

            {uploading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Uploading resume...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
