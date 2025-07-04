import clientPromise, { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// Helper function to get status badge styling
function getStatusStyling(status) {
  switch (status.toLowerCase()) {
    case 'applied':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    case 'interview':
    case 'interviewing':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    case 'reviewing':
    case 'under review':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    case 'accepted':
    case 'hired':
      return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200';
    case 'rejected':
    case 'declined':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    case 'withdrawn':
      return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export async function GET(request) {
  try {
    // Get user ID from JWT token
    const authHeader = request.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.log('Invalid token, proceeding without authentication');
      }
    }    // For testing, use a default user if no token
    if (!userId) {
      userId = 'amartya3'; // Default test user
    }    console.log('🔍 API Debug - User ID:', userId);

    const db = await getDatabase();
    
    // Debug: Check if applications exist for this user
    const directCount = await db.collection('applications').countDocuments({ userId: userId });
    console.log('🔍 Direct count for user:', directCount);
      // Get query parameters
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;    console.log('🔍 Query params - jobId:', jobId, 'limit:', limit, 'page:', page, 'skip:', skip);

    // Check if this is a recruiter query (jobId provided) or candidate query (no jobId)
    if (jobId) {      // RECRUITER VIEW: Get all applications for a specific job with applicant details
      console.log('🎯 Recruiter view - looking for applications with jobId:', jobId);
        // First, let's check if applications exist for this jobId
      const directApplications = await db.collection('applications').find({ jobId: jobId }).toArray();
      console.log('🔍 Direct applications found:', directApplications.length);
      
      // Let's also check what database we're using
      const dbStats = await db.stats();
      console.log('🔍 Database name:', dbStats.db);
      
      // Let's see a sample of applications to compare
      const sampleApps = await db.collection('applications').find({}).limit(3).toArray();
      console.log('🔍 Sample application jobIds:', sampleApps.map(app => ({ id: app._id, jobId: app.jobId })));
      
      const applications = await db.collection('applications')
        .aggregate([
          { 
            $match: { 
              jobId: jobId // jobId is stored as string in applications
            } 
          },{
            $lookup: {
              from: 'users',
              let: { userIdStr: '$userId' },
              pipeline: [
                { 
                  $match: { 
                    $expr: { 
                      $eq: ['$_id', { $toObjectId: '$$userIdStr' }] 
                    } 
                  } 
                }
              ],
              as: 'applicantDetails'
            }
          },
          {
            $unwind: {
              path: '$applicantDetails',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'jobs',
              localField: 'jobId',
              foreignField: '_id',
              as: 'jobDetails'
            }
          },
          {
            $unwind: {
              path: '$jobDetails',
              preserveNullAndEmptyArrays: true
            }
          },          {
            $project: {
              _id: 1,
              jobId: 1,
              userId: 1,
              status: 1,
              appliedAt: 1,
              updatedAt: 1,
              resumeUsed: 1,
              resumePath: 1,
              resumeUrl: 1,
              coverLetter: 1,
              notes: 1,
              additionalMessage: 1,
              // Applicant details
              'applicantDetails.name': 1,
              'applicantDetails.email': 1,
              'applicantDetails.phone': 1,
              'applicantDetails._id': 1,
              // Job details
              'jobDetails.title': 1,
              'jobDetails.company': 1,
              'jobDetails.location': 1,
              'jobDetails.jobType': 1,
              'jobDetails.salary': 1
            }
          },
          {
            $sort: { appliedAt: -1 }
          },
          {
            $skip: skip
          },
          {
            $limit: limit
          }        ])
        .toArray();

      console.log('🔍 Aggregation pipeline results:', applications.length);
      if (applications.length > 0) {
        console.log('🔍 Sample aggregated application:', JSON.stringify(applications[0], null, 2));
      }

      // Get total count for pagination
      const totalApplications = await db.collection('applications').countDocuments({
        jobId: jobId // jobId is stored as string
      });      // Format applications for recruiter view
      const formattedApplications = applications.map(app => ({
        _id: app._id,
        jobId: app.jobId,
        userId: app.userId,
        // Applicant details - using email as name fallback if name is missing
        applicantName: app.applicantDetails?.name || app.applicantDetails?.email?.split('@')[0] || 'Unknown Applicant',
        applicantEmail: app.applicantDetails?.email || 'No email',
        applicantPhone: app.applicantDetails?.phone || 'No phone',
        applicantId: app.userId, // Keep this for compatibility with existing UI
        // Job details
        jobTitle: app.jobDetails?.title || 'Unknown Position',
        company: app.jobDetails?.company || 'Unknown Company',
        location: app.jobDetails?.location || '',
        status: app.status || 'applied',
        statusStyling: getStatusStyling(app.status || 'applied'),
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        resumeUsed: app.resumeUsed,
        resumePath: app.resumePath,
        resumeUrl: app.resumeUrl,
        coverLetter: app.coverLetter,
        notes: app.notes,
        additionalMessage: app.additionalMessage,
        // Formatted dates
        appliedDateFormatted: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'Unknown',
        appliedDateRelative: app.appliedAt ? getRelativeTimeString(app.appliedAt) : 'Unknown'
      }));

      return NextResponse.json({
        success: true,
        applications: formattedApplications,
        pagination: {
          total: totalApplications,
          page: page,
          limit: limit,
          pages: Math.ceil(totalApplications / limit),
          hasNext: skip + limit < totalApplications,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString(),
        viewType: 'recruiter'
      });
    }    // CANDIDATE VIEW: Fetch user's job applications with job details
    const applications = await db.collection('applications')
      .aggregate([        { 
          $match: { 
            userId: userId
            // Temporarily removed date filter for testing
          } 
        },
        {
          $lookup: {
            from: 'jobs',
            let: { jobIdStr: '$jobId' },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $or: [
                      { $eq: ['$_id', { $toObjectId: '$$jobIdStr' }] }, // Try converting to ObjectId
                      { $eq: [{ $toString: '$_id' }, '$$jobIdStr'] }    // Try comparing as string
                    ]
                  } 
                } 
              }
            ],
            as: 'jobDetails'
          }
        },
        {
          $unwind: {
            path: '$jobDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            jobId: 1,
            userId: 1,
            status: 1,
            appliedAt: 1,
            updatedAt: 1,
            resumeUsed: 1,
            coverLetter: 1,
            notes: 1,
            // Job details
            'jobDetails.title': 1,
            'jobDetails.company': 1,
            'jobDetails.location': 1,
            'jobDetails.jobType': 1,
            'jobDetails.salary': 1,
            'jobDetails.description': 1
          }
        },
        {
          $sort: { appliedAt: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray();    // Get total count for pagination
    const totalApplications = await db.collection('applications').countDocuments({
      userId: userId
      // Temporarily removed date filter for testing
    });

    // Format applications for frontend
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      jobId: app.jobId,
      jobTitle: app.jobDetails?.title || 'Unknown Position',
      company: app.jobDetails?.company || 'Unknown Company',
      location: app.jobDetails?.location || '',
      jobType: app.jobDetails?.jobType || '',
      salary: app.jobDetails?.salary || '',
      status: app.status || 'applied',
      statusStyling: getStatusStyling(app.status || 'applied'),
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      resumeUsed: app.resumeUsed,
      coverLetter: app.coverLetter,
      notes: app.notes,
      // Formatted dates
      appliedDateFormatted: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'Unknown',
      appliedDateRelative: app.appliedAt ? getRelativeTimeString(app.appliedAt) : 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      pagination: {
        total: totalApplications,
        page: page,
        limit: limit,
        pages: Math.ceil(totalApplications / limit),
        hasNext: skip + limit < totalApplications,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Get user ID from JWT token
    const authHeader = request.headers.get('authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.log('Invalid token, proceeding without authentication');
      }
    }

    // For testing, use a default user if no token
    if (!userId) {
      userId = 'amartya3'; // Default test user
    }

    const body = await request.json();
    const { jobId, resumeUsed, coverLetter, notes } = body;

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 });
    }    const db = await getDatabase();

    // Check if user already applied to this job
    const existingApplication = await db.collection('applications').findOne({
      userId: userId,
      jobId: new ObjectId(jobId)
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        error: 'You have already applied to this job'
      }, { status: 409 });
    }

    // Create new application
    const application = {
      userId: userId,
      jobId: new ObjectId(jobId),
      status: 'applied',
      appliedAt: new Date(),
      updatedAt: new Date(),
      resumeUsed: resumeUsed || null,
      coverLetter: coverLetter || null,
      notes: notes || null
    };

    const result = await db.collection('applications').insertOne(application);

    return NextResponse.json({
      success: true,
      applicationId: result.insertedId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit application',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to get relative time string
function getRelativeTimeString(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';  
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

// New endpoint: /api/applications/status-daily
export async function GET_status_daily(request) {
  try {
    // Get user ID from JWT token
    const authHeader = request.headers.get('authorization');
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.log('Invalid token, proceeding without authentication');
      }
    }
    if (!userId) {
      userId = 'amartya3'; // Default test user
    }
    const db = await getDatabase();
    // Aggregate daily status counts
    const pipeline = [
      { $match: { userId: userId } },
      { $project: {
          status: 1,
          appliedAt: 1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } }
        }
      },
      { $match: { status: { $in: ["accepted", "interview", "rejected"] } } },
      { $group: {
          _id: { date: "$date", status: "$status" },
          count: { $sum: 1 }
        }
      },
      { $group: {
          _id: "$_id.date",
          counts: {
            $push: { status: "$_id.status", count: "$count" }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $project: {
          _id: 0,
          date: "$_id",
          accepted: {
            $ifNull: [
              { $first: { $filter: { input: "$counts", as: "c", cond: { $eq: ["$$c.status", "accepted"] } } } },
              { count: 0 }
            ]
          },
          interview: {
            $ifNull: [
              { $first: { $filter: { input: "$counts", as: "c", cond: { $eq: ["$$c.status", "interview"] } } } },
              { count: 0 }
            ]
          },
          rejected: {
            $ifNull: [
              { $first: { $filter: { input: "$counts", as: "c", cond: { $eq: ["$$c.status", "rejected"] } } } },
              { count: 0 }
            ]
          }
        }
      },
      { $project: {
          date: 1,
          accepted: "$accepted.count",
          interview: "$interview.count",
          rejected: "$rejected.count"
        }
      }
    ];
    const results = await db.collection('applications').aggregate(pipeline).toArray();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching status-daily:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch daily status counts',
      details: error.message
    }, { status: 500 });
  }
}
