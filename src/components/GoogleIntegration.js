'use client';

import { useState } from 'react';
import { FileText, FolderPlus, Upload, Search, ExternalLink, CheckCircle, AlertCircle, PenTool } from 'lucide-react';

export default function GoogleIntegration({ videoTitle, videoChannel, videoId, notes }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const handleCreateDoc = async () => {
    setIsLoading(true);
    setError('');
    setStatus('Creating Google Doc...');

    try {
      const response = await fetch('/api/google-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_doc_for_video',
          data: { 
            videoTitle, 
            videoChannel, 
            videoId,
            userEmail: 'kumaramartya11@gmail.com' // Your email address
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentDoc(result.doc);
        setStatus(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create Google Doc');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNotesToDoc = async () => {
    if (!currentDoc || !notes) return;

    setIsLoading(true);
    setError('');
    setStatus('Writing notes to Google Doc...');

    try {
      const response = await fetch('/api/google-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_notes_to_doc',
          data: { 
            documentId: currentDoc.documentId,
            notes,
            videoTitle,
            videoId,
            videoChannel
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to write notes to Google Doc');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    setIsLoading(true);
    setError('');
    setStatus('Creating Google Drive folder...');

    try {
      const response = await fetch('/api/google-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_project_folder',
          data: { videoTitle }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentFolder(result.folder);
        setStatus(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create Google Drive folder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotesToDrive = async (format = 'txt') => {
    if (!currentFolder || !notes) return;

    setIsLoading(true);
    setError('');
    setStatus(`Saving notes as ${format.toUpperCase()} to Google Drive...`);

    try {
      const response = await fetch('/api/google-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_notes_to_drive',
          data: { 
            folderId: currentFolder.folderId,
            notes,
            videoTitle,
            videoId,
            format
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to save notes to Drive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 border border-border rounded-lg">      <div className="flex items-center gap-2">
        <PenTool className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Google Docs Integration</h3>
      </div>

      {/* Status Messages */}
      {status && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          <CheckCircle className="h-4 w-4" />
          {status}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Google Docs Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileText className="h-3 w-3" />
          Google Docs
        </h4>
        
        <div className="flex gap-2">
          {!currentDoc ? (
            <button
              onClick={handleCreateDoc}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <FileText className="h-3 w-3" />
              Create Doc
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href={currentDoc.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
                Open Doc
              </a>
              {notes && (
                <button
                  onClick={handleAddNotesToDoc}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <PenTool className="h-3 w-3" />
                  Write Notes
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FolderPlus className="h-3 w-3" />
          Google Drive
        </h4>
        
        <div className="flex gap-2 flex-wrap">
          {!currentFolder ? (
            <button
              onClick={handleCreateFolder}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <FolderPlus className="h-3 w-3" />
              Create Folder
            </button>
          ) : (
            <>
              <a
                href={currentFolder.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
                Open Folder
              </a>
              {notes && (
                <>
                  <button
                    onClick={() => handleSaveNotesToDrive('txt')}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    Save as TXT
                  </button>
                  <button
                    onClick={() => handleSaveNotesToDrive('md')}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    Save as MD
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-xs text-muted-foreground">
          Processing... Please wait.
        </div>
      )}
    </div>
  );
}
