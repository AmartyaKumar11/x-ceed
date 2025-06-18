import clientPromise from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication first
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }

  // Only applicants can have saved jobs
  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ message: 'Only applicants can save jobs' });
  }
  try {
    // Connect to the database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');

    // Get saved jobs for the applicant
    const savedJobs = await db.collection('savedJobs')
      .find({ applicantId: auth.user.userId })
      .toArray();

    // Get job details for saved jobs - only active and non-expired jobs
    const now = new Date();
    const jobIds = savedJobs.map(saved => new ObjectId(saved.jobId));
    const activeJobs = await db.collection('jobs')
      .find({ 
        _id: { $in: jobIds },
        status: 'active', // Only count active jobs
        // Only count jobs that are still accepting applications
        $or: [
          { applicationEnd: { $gte: now } }, // Application deadline hasn't passed
          { applicationEnd: { $exists: false } }, // No deadline set
          { applicationEnd: null } // Explicit null deadline
        ]
      })
      .toArray();

    // Count only saved jobs that correspond to active jobs
    const count = activeJobs.length;

    return res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching saved jobs count:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
