import { authMiddleware } from '@/lib/authMiddleware';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
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

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get the user's resume information
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resume) {
      return res.status(404).json({ message: 'No resume found for this user' });
    }

    // Construct the file path
    const resumePath = path.join(process.cwd(), 'public', user.resume);

    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    // Get file stats
    const stats = fs.statSync(resumePath);
    const fileSizeInBytes = stats.size;

    // Get file extension and set appropriate content type
    const fileExtension = path.extname(user.resume).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    // Create a filename for download
    const userName = user.personal?.name || user.email.split('@')[0];
    const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadFilename = `${safeUserName}_resume${fileExtension}`;

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSizeInBytes);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(resumePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
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
