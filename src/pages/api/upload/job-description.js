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
    console.log('🔍 Job description upload request received');

    // Verify authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      console.log('❌ Authentication failed:', auth.error);
      return res.status(auth.status).json({ message: auth.error });
    }

    // Verify user is a recruiter
    if (auth.user.userType !== 'recruiter') {
      console.log('❌ User is not a recruiter:', auth.user.userType);
      return res.status(403).json({ message: 'Only recruiters can upload job descriptions' });
    }

    console.log('✅ User authenticated as recruiter:', auth.user.email);

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'job-descriptions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Created upload directory:', uploadDir);
    }

    // Configure formidable
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('pdf');
      },
    });

    console.log('📄 Processing file upload...');

    const [fields, files] = await form.parse(req);
    console.log('📄 Form parsed. Files:', Object.keys(files));

    if (!files.file || files.file.length === 0) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    console.log('📄 File details:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      filepath: file.filepath
    });

    // Validate file type
    if (!file.mimetype || !file.mimetype.includes('pdf')) {
      console.log('❌ Invalid file type:', file.mimetype);
      // Clean up uploaded file
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `job_desc_${timestamp}_${randomString}.pdf`;
    const finalPath = path.join(uploadDir, fileName);

    // Move file to final location
    fs.renameSync(file.filepath, finalPath);
    console.log('✅ File saved to:', finalPath);

    // Return file URL
    const fileUrl = `/uploads/job-descriptions/${fileName}`;
    
    console.log('✅ Job description upload successful:', fileUrl);

    return res.status(200).json({
      success: true,
      message: 'Job description uploaded successfully',
      data: {
        filename: fileName,
        originalName: file.originalFilename,
        size: file.size,
        url: fileUrl
      }
    });

  } catch (error) {
    console.error('❌ Job description upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload job description',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
