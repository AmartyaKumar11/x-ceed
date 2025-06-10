import { authMiddleware } from '../../../../lib/middleware';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ message: auth.error });
    }

    // Only recruiters can download resumes
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can download resumes' });
    }

    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    // Ensure filename has valid resume extension
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'application-resumes', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;

    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    const ext = path.extname(filename).toLowerCase();
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.doc') {
      contentType = 'application/msword';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Create a user-friendly filename for download
    const timestamp = Date.now();
    const downloadFilename = `resume-${timestamp}${ext}`;

    // Set response headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSizeInBytes);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('Error streaming resume file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('Resume download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
