import clientPromise from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Check authentication first
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }
  
  // Connect to the database
  const client = await clientPromise;
  const db = client.db();
  
  // Handle different request methods
  switch (req.method) {
    case 'GET':
      try {
        // Check if this is a recruiter querying all applications or an applicant querying their own
        let query = {};
        let sortOptions = { appliedAt: -1 }; // Sort by application date, newest first
        
        if (auth.user.userType === 'applicant') {
          // Applicant can only view their own applications
          query = { applicantId: auth.user.userId };
        } else if (auth.user.userType === 'recruiter') {
          // Recruiters can filter applications
          const { jobId, status } = req.query;
          
          if (jobId) {
            query.jobId = jobId;
          }
          
          if (status) {
            query.status = status;
          }
          
          // Add sort options if provided
          if (req.query.sort) {
            if (req.query.sort === 'name') {
              sortOptions = { 'applicantDetails.name': 1 };
            } else if (req.query.sort === 'date') {
              sortOptions = { appliedAt: req.query.order === 'asc' ? 1 : -1 };
            }
          }
        } else {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
        
        // Get paginated results
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Get applications
        const applications = await db.collection('applications')
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .toArray();
          
        // Get total count for pagination
        const totalApplications = await db.collection('applications').countDocuments(query);
        
        return res.status(200).json({ 
          applications,
          pagination: {
            total: totalApplications,
            page,
            limit,
            pages: Math.ceil(totalApplications / limit)
          }
        });
      } catch (error) {
        console.error('Error fetching applications:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      
    case 'POST':
      try {
        // Only applicants can create applications
        if (auth.user.userType !== 'applicant') {
          return res.status(403).json({ message: 'Only applicants can apply for jobs' });
        }
        
        const { jobId, coverLetter } = req.body;
        
        // Validate required fields
        if (!jobId) {
          return res.status(400).json({ message: 'Job ID is required' });
        }
        
        // Check if the job exists
        const job = await db.collection('jobs').findOne({ _id: new ObjectId(jobId) });
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check if the user has already applied for this job
        const existingApplication = await db.collection('applications').findOne({
          applicantId: auth.user.userId,
          jobId
        });
        
        if (existingApplication) {
          return res.status(409).json({ message: 'You have already applied for this job' });
        }
        
        // Get the applicant details
        const applicant = await db.collection('users').findOne({ _id: new ObjectId(auth.user.userId) });
        
        if (!applicant) {
          return res.status(404).json({ message: 'Applicant not found' });
        }
        
        // Check if the applicant has uploaded a resume
        if (!applicant.resume) {
          return res.status(400).json({ message: 'Please upload your resume before applying' });
        }
        
        // Create the application
        const application = {
          jobId,
          applicantId: auth.user.userId,
          resumePath: applicant.resume,
          coverLetter,
          status: 'pending',
          appliedAt: new Date(),
          updatedAt: new Date(),
          // Include key applicant details for easier querying
          applicantDetails: {
            name: applicant.personal?.name || '',
            email: applicant.email,
            phone: applicant.contact?.phone || ''
          },
          // Include key job details
          jobDetails: {
            title: job.title,
            company: job.company,
            location: job.location
          }
        };
        
        const result = await db.collection('applications').insertOne(application);
        
        return res.status(201).json({ 
          message: 'Application submitted successfully',
          applicationId: result.insertedId,
          application
        });
      } catch (error) {
        console.error('Error creating application:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
