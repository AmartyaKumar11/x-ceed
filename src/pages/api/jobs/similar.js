import clientPromise, { getDatabase } from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { jobId } = req.query;

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

    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ 
        success: false, 
        message: auth.error 
      });
    }

    // Only applicants can get job recommendations
    if (auth.user.userType !== 'applicant') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only applicants can get job recommendations'
      });
    }

    const db = await getDatabase();

    // Get the original job to find similar ones
    const originalJob = await db.collection('jobs').findOne({ 
      _id: new ObjectId(jobId)
    });

    if (!originalJob) {
      return res.status(404).json({ 
        success: false, 
        message: 'Original job not found' 
      });
    }    // Check if user has already applied to avoid duplicate applications
    const userApplications = await db.collection('applications')
      .find({ applicantId: auth.user.userId })
      .toArray();
    
    const appliedJobIds = userApplications.map(app => app.jobId);
    // Convert string jobIds to ObjectIds for MongoDB query
    const appliedObjectIds = appliedJobIds.map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        return id; // Keep as string if conversion fails
      }
    });    // Find similar jobs based on title, department, or level
    // Exclude the original job and jobs the user has already applied to
    const now = new Date();
    const similarJobs = await db.collection('jobs')
      .find({
        $and: [
          { _id: { $ne: new ObjectId(jobId) } }, // Exclude original job
          { _id: { $nin: appliedObjectIds } }, // Exclude jobs user already applied to
          { status: 'active' },
          // Only show jobs that are still accepting applications
          {
            $or: [
              { applicationEnd: { $gte: now } },
              { applicationEnd: { $exists: false } },
              { applicationEnd: null }
            ]
          },
          // Find similar jobs by matching department, level, or title keywords
          {
            $or: [
              { department: originalJob.department },
              { level: originalJob.level },
              { 
                title: { 
                  $regex: originalJob.title.split(' ').slice(0, 2).join('|'), 
                  $options: 'i' 
                } 
              }
            ]
          }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5) // Limit to 5 similar jobs
      .toArray();

    // If no similar jobs found, return the most recent active jobs instead
    let recommendedJob = null;
    if (similarJobs.length > 0) {
      // Pick the first similar job
      recommendedJob = similarJobs[0];
    } else {      // Fallback: get any active job that user hasn't applied to
      const fallbackJobs = await db.collection('jobs')
        .find({
          $and: [
            { _id: { $ne: new ObjectId(jobId) } },
            { _id: { $nin: appliedObjectIds } },
            { status: 'active' },
            {
              $or: [
                { applicationEnd: { $gte: now } },
                { applicationEnd: { $exists: false } },
                { applicationEnd: null }
              ]
            }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      
      if (fallbackJobs.length > 0) {
        recommendedJob = fallbackJobs[0];
      }
    }

    if (!recommendedJob) {
      return res.status(404).json({ 
        success: false, 
        message: 'No similar jobs available' 
      });
    }

    return res.status(200).json({
      success: true,
      data: recommendedJob,
      message: 'Similar job found'
    });

  } catch (error) {
    console.error('Error finding similar job:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
