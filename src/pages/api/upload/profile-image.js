import formidable from 'formidable';
import { authMiddleware } from '../../../lib/middleware';
import { validateFile, saveFile, deleteFile } from '../../../lib/fileUpload';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Handler for profile image upload API endpoint
 * This endpoint handles profile image upload and updates the user's profile
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validation = validateFile(file, allowedTypes);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the user to check if they already have a profile image
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(auth.user.userId)
    });
    
    // If the user already has a profile image, delete it
    if (user?.personal?.profileImage) {
      await deleteFile(user.personal.profileImage);
    }
    
    // Save the new profile image
    const filePath = await saveFile(file, 'profile-images');
    
    // Update path in database based on user type
    let updateQuery = {};
    if (auth.user.userType === 'applicant') {
      updateQuery = { 'personal.profileImage': filePath };
    } else if (auth.user.userType === 'recruiter') {
      updateQuery = { 'recruiter.profileImage': filePath };
    }
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.user.userId) },
      { 
        $set: {
          ...updateQuery,
          updatedAt: new Date()
        } 
      }
    );
    
    // Return the file path
    return res.status(200).json({ 
      message: 'Profile image uploaded successfully',
      file: {
        path: filePath,
        name: file.originalFilename,
        type: file.mimetype,
        size: file.size
      } 
    });
    
  } catch (error) {
    console.error('Profile image upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
