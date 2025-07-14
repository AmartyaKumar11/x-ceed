import { authMiddleware } from '../../../lib/middleware';
import { getDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }

  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ message: 'Only applicants can view prep plans' });
  }

  try {
    const { id } = req.query;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Valid prep plan ID is required' });
    }

    // Get the database
    const db = await getDatabase();

    // Fetch the prep plan with detailed study plan
    const prepPlan = await db.collection('prepPlans').findOne({
      _id: new ObjectId(id),
      applicantId: auth.user.userId
    });

    if (!prepPlan) {
      return res.status(404).json({ message: 'Prep plan not found' });
    }

    // Fetch job details if jobId exists
    let jobDetails = null;
    if (prepPlan.jobId && ObjectId.isValid(prepPlan.jobId)) {
      jobDetails = await db.collection('jobs').findOne({
        _id: new ObjectId(prepPlan.jobId)
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...prepPlan,
        jobDetails: jobDetails
      }
    });

  } catch (error) {
    console.error('Error fetching prep plan:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch prep plan',
      error: error.message 
    });
  }
}
