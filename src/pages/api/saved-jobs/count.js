import clientPromise from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';

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

    // Get count of saved jobs for the applicant
    const count = await db.collection('savedJobs').countDocuments({
      applicantId: auth.user.userId
    });

    return res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error fetching saved jobs count:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
