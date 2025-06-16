import clientPromise, { getDatabase } from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Check authentication first
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }

  // Only applicants can save jobs
  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ message: 'Only applicants can save jobs' });  }

  // Connect to the database
  const db = await getDatabase();

  switch (req.method) {
    case 'GET':
      try {
        // Get saved jobs for the applicant
        const savedJobs = await db.collection('savedJobs')
          .find({ applicantId: auth.user.userId })
          .sort({ savedAt: -1 })
          .toArray();        // Get job details for saved jobs - only active and non-expired jobs
        const now = new Date();
        const jobIds = savedJobs.map(saved => new ObjectId(saved.jobId));
        const jobs = await db.collection('jobs')
          .find({ 
            _id: { $in: jobIds },
            status: 'active', // Only return active jobs
            // Only show jobs that are still accepting applications
            $or: [
              { applicationEnd: { $gte: now } }, // Application deadline hasn't passed
              { applicationEnd: { $exists: false } }, // No deadline set
              { applicationEnd: null } // Explicit null deadline
            ]
          })
          .toArray();

        // Combine saved job data with job details
        const savedJobsWithDetails = savedJobs.map(saved => {
          const job = jobs.find(j => j._id.toString() === saved.jobId);
          return {
            ...saved,
            jobDetails: job || null
          };
        }).filter(saved => saved.jobDetails !== null); // Filter out deleted/inactive jobs

        return res.status(200).json({
          success: true,
          data: savedJobsWithDetails
        });
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    case 'POST':
      try {
        const { jobId } = req.body;

        if (!jobId) {
          return res.status(400).json({ message: 'Job ID is required' });
        }

        if (!ObjectId.isValid(jobId)) {
          return res.status(400).json({ message: 'Invalid job ID format' });
        }

        // Check if job exists and is active
        const job = await db.collection('jobs').findOne({ 
          _id: new ObjectId(jobId),
          status: 'active'
        });

        if (!job) {
          return res.status(404).json({ message: 'Job not found or not active' });
        }

        // Check if already saved
        const existingSave = await db.collection('savedJobs').findOne({
          applicantId: auth.user.userId,
          jobId: jobId
        });

        if (existingSave) {
          return res.status(409).json({ message: 'Job already saved' });
        }

        // Save the job
        const savedJob = {
          applicantId: auth.user.userId,
          jobId: jobId,
          savedAt: new Date(),
          jobTitle: job.title,
          companyName: job.companyName || job.company || 'Company'
        };

        const result = await db.collection('savedJobs').insertOne(savedJob);

        return res.status(201).json({
          success: true,
          message: 'Job saved successfully',
          data: {
            savedJobId: result.insertedId,
            ...savedJob
          }
        });
      } catch (error) {
        console.error('Error saving job:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    case 'DELETE':
      try {
        const { jobId } = req.query;

        if (!jobId) {
          return res.status(400).json({ message: 'Job ID is required' });
        }

        // Remove the saved job
        const result = await db.collection('savedJobs').deleteOne({
          applicantId: auth.user.userId,
          jobId: jobId
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Saved job not found' });
        }

        return res.status(200).json({
          success: true,
          message: 'Job removed from saved jobs'
        });
      } catch (error) {
        console.error('Error removing saved job:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
