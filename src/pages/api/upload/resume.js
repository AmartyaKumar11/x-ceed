import { IncomingForm } from 'formidable';
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
    const options = {
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowEmptyFiles: true,
      multiples: true,
    };
    
    // Use a custom promisified version of formidable.parse
    const parseFormData = () => {
      return new Promise((resolve, reject) => {
        const form = new IncomingForm(options);
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return reject(err);
          }
          resolve({ fields, files });
        });
      });
    };
    
    // Parse the form data
    const { fields, files } = await parseFormData();
    
    // Check if file was uploaded - try both 'file' and 'resume' key names
    let file;
    if (files.file && files.file.length > 0) {
      file = files.file[0];
    } else if (files.resume && files.resume.length > 0) {
      file = files.resume[0]; 
    } else {
      // Check if there's any file at all by examining all keys
      for (const key in files) {
        if (files[key] && files[key].length > 0) {
          file = files[key][0];
          break;
        }
      }
      
      if (!file) {
        return res.status(400).json({ message: 'No resume file uploaded' });
      }
    }
    
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
    const db = client.db('x-ceed-db');
    
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
    return res.status(500).json({ 
      message: 'Internal server error during resume upload',
      error: error.message
    });
  }
}
