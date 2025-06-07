import { IncomingForm } from 'formidable';
import { authMiddleware } from '../../../lib/middleware';
import { validateFile, saveFile } from '../../../lib/fileUpload';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Handler for file upload API endpoint
 */
export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ message: auth.error });
    }
    
    // Parse the multipart form data
    const form = new IncomingForm();
    form.keepExtensions = true;
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });
    
    // Get the file type and user ID from the form data
    const fileType = fields.fileType[0];
    const file = files.file[0];
    
    // Validate file type and determine upload directory
    let allowedTypes = [];
    let subdir = '';
    
    switch (fileType) {
      case 'resume':
        allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        subdir = 'resumes';
        break;
      case 'profile-image':
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        subdir = 'profile-images';
        break;
      case 'job-description':
        allowedTypes = ['application/pdf'];
        subdir = 'job-descriptions';
        break;
      default:
        return res.status(400).json({ message: 'Invalid file type' });
    }
    
    // Validate file
    const validation = validateFile(file, allowedTypes);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
    
    // Save the file
    const filePath = await saveFile(file, subdir);
    
    // Return the file path
    return res.status(200).json({ 
      message: 'File uploaded successfully',
      file: {
        path: filePath,
        name: file.originalFilename,
        type: file.mimetype,
        size: file.size
      } 
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
