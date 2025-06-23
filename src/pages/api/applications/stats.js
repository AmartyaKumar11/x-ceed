import { authMiddleware } from '../../../lib/middleware';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Only recruiters can access application stats
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only recruiters can access application statistics' 
      });
    }

    const client = await clientPromise;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    const db = client.db(dbName);    // Get only ACTIVE jobs posted by this recruiter (exclude closed/deleted jobs)
    const recruiterJobs = await db.collection('jobs').find({
      recruiterId: auth.user.userId,
      status: { $ne: 'closed' }, // Exclude closed jobs
      $and: [
        { status: { $ne: 'deleted' } }, // Exclude deleted jobs
        { status: { $ne: 'inactive' } } // Exclude inactive jobs
      ]
    }).toArray();

    const jobIds = recruiterJobs.map(job => job._id.toString());

    if (jobIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          pending: 0,
          reviewing: 0,
          interview: 0,
          accepted: 0,
          rejected: 0,
          total: 0
        }
      });
    }

    // Get application statistics
    const pipeline = [
      {
        $match: {
          jobId: { $in: jobIds }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const statusCounts = await db.collection('applications').aggregate(pipeline).toArray();

    // Initialize stats object
    const stats = {
      pending: 0,
      reviewing: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      total: 0
    };

    // Populate stats from aggregation results
    statusCounts.forEach(item => {
      const status = item._id || 'pending'; // Default to pending if status is null
      if (stats.hasOwnProperty(status)) {
        stats[status] = item.count;
      }
    });

    // Calculate total
    stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    // Get additional metrics
    const totalApplications = await db.collection('applications').countDocuments({
      jobId: { $in: jobIds }
    });

    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentApplications = await db.collection('applications').countDocuments({
      jobId: { $in: jobIds },
      appliedAt: { $gte: sevenDaysAgo }
    });

    // Get application trend (compare with previous week)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const previousWeekApplications = await db.collection('applications').countDocuments({
      jobId: { $in: jobIds },
      appliedAt: { 
        $gte: fourteenDaysAgo,
        $lt: sevenDaysAgo
      }
    });

    // Calculate trend
    const trend = previousWeekApplications > 0 
      ? Math.round(((recentApplications - previousWeekApplications) / previousWeekApplications) * 100)
      : recentApplications > 0 ? 100 : 0;

    return res.status(200).json({
      success: true,
      stats,
      metrics: {
        totalApplications,
        recentApplications,
        trend,
        successRate: stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0,
        interviewRate: stats.total > 0 ? Math.round(((stats.interview + stats.accepted) / stats.total) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching application stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
