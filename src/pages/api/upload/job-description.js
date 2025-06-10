import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../../../lib/middleware';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ message: auth.error });
    }

    // Verify user is a recruiter
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can upload job descriptions' });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'job-descriptions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse the form data
    const form = new IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          return res.status(400).json({ message: 'File upload failed', error: err.message });
        }

        const file = files.file;
        if (!file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        // Handle array or single file
        const uploadedFile = Array.isArray(file) ? file[0] : file;

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];

        if (!allowedTypes.includes(uploadedFile.mimetype)) {
          return res.status(400).json({ 
            message: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' 
          });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = uploadedFile.originalFilename || uploadedFile.newFilename;
        const extension = path.extname(originalName);
        const filename = `${auth.user.userId}_job_description_${timestamp}${extension}`;
        const finalPath = path.join(uploadDir, filename);

        // Move file to final location
        fs.renameSync(uploadedFile.filepath, finalPath);

        // Return success response with file URL
        const fileUrl = `/uploads/job-descriptions/${filename}`;

        res.status(200).json({
          message: 'Job description uploaded successfully',
          fileUrl,
          filename,
          originalName: originalName
        });

        resolve();
      });
    });

  } catch (error) {
    console.error('Job description upload error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}
