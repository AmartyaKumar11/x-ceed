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

    // Only authenticated users (both applicants and recruiters) can download job descriptions
    if (!['applicant', 'recruiter'].includes(auth.user.userType)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    // Ensure filename has .pdf extension
    if (!filename.endsWith('.pdf')) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'job-descriptions', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Job description file not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;

    // Create a user-friendly filename for download
    const timestamp = Date.now();
    const downloadFilename = `job-description-${timestamp}.pdf`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', fileSizeInBytes);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('Error streaming job description file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('Job description download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
