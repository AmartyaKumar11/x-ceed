import { IncomingForm } from 'formidable';
import { authMiddleware } from '../../../lib/middleware';
import { validateFile, saveFile } from '../../../lib/fileUpload';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }
  
  try {
    // Check authentication
    const auth = await authMiddleware(req);
    
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ 
        success: false, 
        message: auth.error 
      });
    }

    // Only applicants can submit applications
    if (auth.user.userType !== 'applicant') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only applicants can submit job applications'
      });
    }

    // Parse the multipart form data
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
      multiples: false
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });    // Extract form fields
    const jobId = Array.isArray(fields.jobId) ? fields.jobId[0] : fields.jobId;
    const coverLetter = Array.isArray(fields.coverLetter) ? fields.coverLetter[0] : fields.coverLetter;
    const additionalMessage = Array.isArray(fields.additionalMessage) ? fields.additionalMessage[0] : fields.additionalMessage;
    const contactEmail = Array.isArray(fields.contactEmail) ? fields.contactEmail[0] : fields.contactEmail;

    // Validate required fields
    if (!jobId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Job ID is required' 
      });
    }

    if (!ObjectId.isValid(jobId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid job ID format' 
      });
    }

    // Get the resume file
    let resumeFile;
    if (files.resume && files.resume.length > 0) {
      resumeFile = files.resume[0];
    } else if (files.resume && !Array.isArray(files.resume)) {
      resumeFile = files.resume;
    }
    
    if (!resumeFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Resume file is required' 
      });
    }

    // Validate resume file
    const allowedTypes = ['application/pdf'];
    const validation = validateFile(resumeFile, allowedTypes);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.error 
      });
    }

    // Connect to database
    const client = await clientPromise;
    
    // Use consistent database name
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    const db = client.db(dbName);

    // Check if the job exists and is active
    const job = await db.collection('jobs').findOne({ 
      _id: new ObjectId(jobId),
      status: 'active'
    });

    if (!job) {
      // Check if job exists with different status
      const jobExists = await db.collection('jobs').findOne({ 
        _id: new ObjectId(jobId)
      });
      
      if (jobExists) {
        return res.status(404).json({ 
          success: false, 
          message: `Job found but status is '${jobExists.status}'. Only active jobs accept applications.` 
        });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: 'Job not found' 
        });
      }
    }

    // Check if the user has already applied for this job
    const existingApplication = await db.collection('applications').findOne({
      applicantId: auth.user.userId,
      jobId: jobId
    });

    if (existingApplication) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already applied for this job' 
      });
    }

    // Get the applicant details
    const applicant = await db.collection('users').findOne({ 
      _id: new ObjectId(auth.user.userId) 
    });

    if (!applicant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Applicant not found' 
      });
    }

    // Save the resume file
    let resumePath;
    try {
      // Create unique filename with timestamp and user ID
      const timestamp = Date.now();
      const fileExtension = path.extname(resumeFile.originalFilename || '.pdf');
      const safeJobTitle = job.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
      const filename = `${auth.user.userId}_${safeJobTitle}_${timestamp}${fileExtension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'application-resumes');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file
      const filePath = path.join(uploadDir, filename);
      
      // Check if source file exists
      if (!fs.existsSync(resumeFile.filepath)) {
        throw new Error(`Source file does not exist: ${resumeFile.filepath}`);
      }
      
      const fileBuffer = fs.readFileSync(resumeFile.filepath);
      fs.writeFileSync(filePath, fileBuffer);
      
      // Verify the file was written
      if (!fs.existsSync(filePath)) {
        throw new Error(`Failed to write file: ${filePath}`);
      }
      
      // Store relative path for database
      resumePath = `/uploads/application-resumes/${filename}`;
      
    } catch (error) {
      console.error('Error saving resume file:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error during resume upload' 
      });
    }    // Create the application
    const application = {
      jobId: jobId,
      applicantId: auth.user.userId,
      userId: auth.user.userId, // Add userId field for consistency
      resumePath: resumePath,
      coverLetter: coverLetter || '',
      additionalMessage: additionalMessage || '',
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date(),      // Include key applicant details for easier querying
      applicantDetails: {
        name: applicant.personal?.name || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim(),
        email: applicant.email,
        contactEmail: contactEmail && contactEmail.trim() ? contactEmail.trim() : null, // Optional contact email for notifications
        phone: applicant.contact?.phone || applicant.phone || ''
      },
      // Include key job details
      jobDetails: {
        title: job.title,
        company: job.companyName || job.company || '',
        location: job.location || '',
        department: job.department || ''
      }
    };

    const result = await db.collection('applications').insertOne(application);

    return res.status(201).json({ 
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.insertedId,
        jobTitle: job.title,
        company: job.companyName || job.company || '',
        appliedAt: application.appliedAt
      }
    });
  } catch (error) {
    console.error('Error in application submission:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error. Please try again.';
    
    if (error.message.includes('file') || error.message.includes('upload')) {
      errorMessage = 'Internal server error during resume upload';
    } else if (error.message.includes('database') || error.message.includes('mongo')) {
      errorMessage = 'Database error. Please try again.';
    } else if (error.message.includes('auth')) {
      errorMessage = 'Authentication error. Please login again.';
    }
    
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    });
  }
}
