"use client"

import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from "./button";

export function FileUpload({ 
  onFileChange, 
  label = "Click to upload or drag and drop", 
  accept = ".pdf,.doc,.docx",
  maxSize = 5, // in MB
  className = ""
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    // Reset error
    setError("");
    
    // Validate file
    if (!selectedFile) return;
    
    // Check file type
    const fileType = selectedFile.type;
    const validTypes = accept.split(',').map(type => {
      // Convert .pdf to application/pdf, etc.
      return type.trim().replace('.', 'application/');
    });
    
    if (!validTypes.some(type => fileType.includes(type.replace('application/', '')))) {
      setError(`Invalid file type. Accepted formats: ${accept}`);
      return;
    }
    
    // Check file size
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }
    
    // Set the file
    setFile(selectedFile);
    
    // Call onFileChange callback if provided
    if (onFileChange) {
      onFileChange(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
    
    // Call onFileChange with null to indicate file removal
    if (onFileChange) {
      onFileChange(null);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-black bg-gray-50' 
              : error 
                ? 'border-red-300' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xs text-gray-400 mt-1">Max size: {maxSize}MB</p>
          
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-gray-500 mr-3" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
