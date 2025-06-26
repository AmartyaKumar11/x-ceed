import { NextResponse } from 'next/server';
import clientPromise, { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
    try {
        const db = await getDatabase();
        
        // Extract recruiter ID from query parameters
        const { searchParams } = new URL(request.url);
        const recruiterId = searchParams.get('recruiterId');
        
        if (!recruiterId) {
            return NextResponse.json({ 
                success: false, 
                error: 'Recruiter ID is required' 
            }, { status: 400 });
        }

        // Date range filter - all future interviews
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        console.log('DEBUG: Recruiter ID:', recruiterId);
        
        // Find all applications with status 'interview' for jobs posted by this recruiter
        const upcomingInterviews = await db.collection('applications').aggregate([
            {
                $match: {
                    'status': 'interview'
                }
            },
            {
                $addFields: {
                    // Convert jobId to ObjectId if it's a string, keep as-is if already ObjectId
                    jobIdAsObjectId: {
                        $cond: {
                            if: { $eq: [{ $type: "$jobId" }, "string"] },
                            then: { $toObjectId: "$jobId" },
                            else: "$jobId"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'jobIdAsObjectId',
                    foreignField: '_id',
                    as: 'job'
                }
            },
            {
                $unwind: '$job'
            },
            {
                $match: {
                    'job.recruiterId': recruiterId
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { 
                        applicantId: '$applicantId', 
                        candidateId: '$candidateId',
                        userId: '$userId'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: [{ $toString: '$_id' }, '$$applicantId'] },
                                        { $eq: [{ $toString: '$_id' }, '$$candidateId'] },
                                        { $eq: [{ $toString: '$_id' }, '$$userId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'applicant'
                }
            },
            {
                $unwind: {
                    path: '$applicant',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    applicantName: '$applicant.name',
                    applicantEmail: '$applicant.email',
                    interviewDate: '$interviewDate',
                    interviewTime: '$interviewTime',
                    interviewType: '$interviewType',
                    interviewNotes: '$interviewNotes',
                    jobTitle: '$job.title',
                    jobId: '$job._id',
                    applicationStatus: '$status',
                    updatedAt: '$updatedAt',
                    // Generate a mock interview date if not set (for existing data)
                    mockInterviewDate: {
                        $dateAdd: {
                            startDate: '$updatedAt',
                            unit: 'day',
                            amount: { $mod: [{ $dayOfYear: '$updatedAt' }, 7] }
                        }
                    }
                }
            },
            {
                $addFields: {
                    // Use actual interview date if available, otherwise use mock date
                    finalInterviewDate: {
                        $ifNull: ['$interviewDate', '$mockInterviewDate']
                    }
                }
            },
            {
                $match: {
                    finalInterviewDate: {
                        $gte: todayStart
                        // Removed upper date limit - show ALL future interviews
                    }
                }
            },
            {
                $sort: {
                    finalInterviewDate: 1
                }
            },
            {
                $limit: 10
            }
        ]).toArray();

        console.log('DEBUG: Raw aggregation results:', JSON.stringify(upcomingInterviews, null, 2));

        // Format the interviews for the frontend
        const formattedInterviews = upcomingInterviews.map(interview => {
            // Extract name from email if name is not available
            let candidateName = 'Unknown Candidate';
            if (interview.applicantName && interview.applicantName !== 'N/A' && interview.applicantName !== '') {
                candidateName = interview.applicantName;
            } else if (interview.applicantEmail && interview.applicantEmail !== 'No Email') {
                candidateName = interview.applicantEmail.split('@')[0];
            }
            
            return {
                id: interview._id,
                applicantName: candidateName,
                applicantEmail: interview.applicantEmail || 'No Email',
                jobTitle: interview.jobTitle,
                jobId: interview.jobId,
                interviewDate: interview.finalInterviewDate,
                interviewTime: interview.interviewTime || generateMockTime(interview._id),
                interviewType: interview.interviewType || 'Technical Interview',
                status: interview.applicationStatus,
                notes: interview.interviewNotes || '',
                isToday: isToday(interview.finalInterviewDate),
                isTomorrow: isTomorrow(interview.finalInterviewDate),
                timeFromNow: formatTimeFromNow(interview.finalInterviewDate)
            };
        });

        return NextResponse.json({
            success: true,
            interviews: formattedInterviews,
            count: formattedInterviews.length
        });

    } catch (error) {
        console.error('Error fetching upcoming interviews:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch upcoming interviews' },
            { status: 500 }
        );
    }
}

// Helper functions
function generateMockTime(interviewId) {
    const times = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
    const hash = interviewId.toString().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return times[Math.abs(hash) % times.length];
}

function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
}

function isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = new Date(date);
    return tomorrow.toDateString() === checkDate.toDateString();
}

function formatTimeFromNow(date) {
    const now = new Date();
    const interviewDate = new Date(date);
    const diffTime = interviewDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return `On ${interviewDate.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
    })}`;
}
