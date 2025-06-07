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
    console.log("🔥🔥🔥 RESUME UPLOAD API CALLED!");
    console.log("🔥 Method:", req.method);
    console.log("🔥 URL:", req.url);
    console.log("🔥 Headers:", req.headers);
    console.log("🔥 Timestamp:", new Date().toISOString());
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log("❌ Invalid method, returning 405");
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
    
    // Ensure the user is an applicant
    if (auth.user.userType !== 'applicant') {
      console.error("User is not an applicant:", auth.user.userType);
      return res.status(403).json({ message: 'Only applicants can upload resumes' });
    }
    
    console.log("User is an applicant, proceeding with file upload");    // Parse the multipart form data
    const options = {
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowEmptyFiles: true, // Allow empty files to be processed
      multiples: true, // Allow multiple files with the same name
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
      filesData: files.file ? `Found ${files.file.length} files` : "No files found"
    });
      // Log the actual file keys received to help debug
    console.log("Received files with keys:", Object.keys(files));
    
    // Check if file was uploaded - try both 'file' and possibly other key names
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
          console.log(`Found file using key: ${key}`);
          break;
        }
      }
      
      if (!file) {
        console.error("No file was uploaded or file field name was incorrect");
        return res.status(400).json({ message: 'No resume file uploaded' });
      }
    }
    
    console.log("Processing file:", file.originalFilename, "Type:", file.mimetype);
    
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
    // Provide more specific error details to help debug
    return res.status(500).json({ 
      message: 'Internal server error during resume upload',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
