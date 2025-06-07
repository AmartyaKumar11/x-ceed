import { IncomingForm } from 'formidable';
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
    console.log("Profile image upload API called");
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
    // Log headers for debugging
    console.log("Request headers:", {
      contentType: req.headers['content-type'],
      authorization: req.headers['authorization'] ? 'Bearer token present' : 'No Bearer token',
      cookie: req.headers['cookie'] ? 'Cookies present' : 'No cookies'
    });
    
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      console.error("Authentication failed:", auth.error, "Status:", auth.status);
      return res.status(auth.status).json({ message: auth.error });
    }
    
    console.log("Authentication successful for user:", auth.user.userId);
    
    // Parse the multipart form data
    const options = {
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB for images
      allowEmptyFiles: true,
      multiples: true,
    };
    
    console.log("Starting to parse form data...");
    
    // Use a custom promisified version of formidable.parse to catch errors better
    const parseFormData = () => {
      return new Promise((resolve, reject) => {
        const form = formidable(options);
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error("Error parsing form data:", err);
            return reject(err);
          }
          resolve({ fields, files });
        });
      });
    };
    
    // Parse the form data
    const { fields, files } = await parseFormData();
    
    console.log("Form data parsed:", { 
      fieldKeys: Object.keys(fields),
      fileKeys: Object.keys(files),
    });
    
    // Log the actual file keys received to help debug
    console.log("Received files with keys:", Object.keys(files));
    
    // Check if file was uploaded - try different key names
    let file;
    if (files.file && files.file.length > 0) {
      file = files.file[0];
    } else if (files.profileImage && files.profileImage.length > 0) {
      file = files.profileImage[0]; 
    } else {
      // Check if there's any file at all by examining all keys
      for (const key in files) {
        if (files[key] && files[key].length > 0) {
          file = files[key][0];
          console.log(`Found file using key: ${key}`);
          break;
        }
      }
      
      if (!file) {
        console.error("No file was uploaded or file field name was incorrect");
        return res.status(400).json({ message: 'No profile image file uploaded' });
      }
    }
    
    console.log("Processing file:", file.originalFilename, "Type:", file.mimetype);
    
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
    // Provide more specific error details to help debug
    return res.status(500).json({ 
      message: 'Internal server error during profile image upload',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
