import formidable from 'formidable';
import { authMiddleware } from '../../../lib/middleware';
import { validateFile, saveFile } from '../../../lib/fileUpload';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Handler for resume upload API endpoint
 * This endpoint handles resume upload and updates the user's profile
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
    
    // Ensure the user is an applicant
    if (auth.user.userType !== 'applicant') {
      return res.status(403).json({ message: 'Only applicants can upload resumes' });
    }
    
    // Parse the multipart form data
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });
    
    const file = files.file[0];
    
    // Validate file
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validation = validateFile(file, allowedTypes);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
    
    // Save the file
    const filePath = await saveFile(file, 'resumes');
    
    // Update the user's resume path in the database
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.user.userId) },
      { 
        $set: { 
          resume: filePath,
          updatedAt: new Date()
        } 
      }
    );
    
    // Return the file path
    return res.status(200).json({ 
      message: 'Resume uploaded successfully',
      file: {
        path: filePath,
        name: file.originalFilename,
        type: file.mimetype,
        size: file.size
      } 
    });
    
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
