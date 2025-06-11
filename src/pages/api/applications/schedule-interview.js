import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';
import { sendEmail } from '@/lib/emailService';

export default async function handler(req, res) {
  // Only allow POST requests
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

    // Only recruiters can schedule interviews
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only recruiters can schedule interviews' 
      });
    }    // Extract data from request body
    const { 
      applicationId, 
      interviewDate,
      location,
      isVirtual = false,
      duration = 60,
      additionalNotes,
      candidateName,
      candidateEmail,
      jobTitle,
      companyName
    } = req.body;

    console.log('🔍 Schedule interview request body:', req.body);
    console.log('🔍 Application ID received:', applicationId);
    console.log('🔍 Application ID type:', typeof applicationId);
    console.log('🔍 Application ID isValid:', ObjectId.isValid(applicationId));

    // Validate required fields
    if (!applicationId || !interviewDate || !location) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: applicationId, interviewDate, location' 
      });
    }    // Validate ObjectId format
    if (!ObjectId.isValid(applicationId)) {
      console.log('🔍 Invalid ObjectId format:', applicationId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid application ID format' 
      });
    }

    console.log('🔍 ObjectId is valid, creating ObjectId instance...');
    const objectId = new ObjectId(applicationId);
    console.log('🔍 Created ObjectId:', objectId.toString());// Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');    // Get the application
    const application = await db.collection('applications').findOne({
      _id: objectId
    });    console.log('🔍 Looking for application with ID:', applicationId);
    console.log('🔍 Application found:', application ? 'YES' : 'NO');
    if (!application) {
      console.log('🔍 Application query result:', application);
      
      // Let's also try to find any applications to see what IDs exist
      console.log('🔍 Searching for applications in database...');
      const allApplications = await db.collection('applications').find({}).limit(5).toArray();
      console.log('🔍 Sample applications in database:', allApplications.map(app => ({ 
        id: app._id.toString(), 
        jobId: app.jobId, 
        applicantId: app.applicantId,
        status: app.status 
      })));
      
      // Try to find with string comparison
      console.log('🔍 Trying to find application with string ID...');
      const appByString = await db.collection('applications').findOne({
        _id: applicationId
      });
      console.log('🔍 Found by string ID:', appByString ? 'YES' : 'NO');
      
      // Try to find without ObjectId conversion
      console.log('🔍 Trying to find application by comparing string IDs...');
      const appByStringComparison = await db.collection('applications').findOne({
        $where: function() { return this._id.toString() === applicationId; }
      });
      console.log('🔍 Found by string comparison:', appByStringComparison ? 'YES' : 'NO');
    }

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
    }

    // Verify that the recruiter owns the job for this application
    const job = await db.collection('jobs').findOne({
      _id: new ObjectId(application.jobId),
      recruiterId: auth.user.userId
    });

    if (!job) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only schedule interviews for your own job postings' 
      });
    }

    // Get the applicant details
    const applicant = await db.collection('users').findOne({
      _id: new ObjectId(application.applicantId)
    });

    if (!applicant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Applicant not found' 
      });
    }

    // Get the recruiter details
    const recruiter = await db.collection('users').findOne({
      _id: new ObjectId(auth.user.userId)
    });

    // Update the application with interview details and status
    const interviewDateTime = new Date(interviewDate);
    const updateResult = await db.collection('applications').updateOne(
      { _id: new ObjectId(applicationId) },
      { 
        $set: { 
          status: 'interview',
          interviewDate: interviewDateTime,
          interviewLocation: location,
          interviewIsVirtual: isVirtual,
          interviewDuration: duration,
          interviewNotes: additionalNotes || '',
          interviewScheduledAt: new Date(),
          interviewScheduledBy: auth.user.userId,
          updatedAt: new Date()
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Failed to update application' 
      });
    }    // Create a notification for the applicant
    const notification = {
      userId: applicant._id, // Store as ObjectId, not string
      type: 'interview_scheduled',
      title: '📅 Interview Scheduled',
      message: `Great news! Your interview for ${jobTitle} at ${companyName || job.company} has been scheduled for ${interviewDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} at ${interviewDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}.`,
      company: companyName || job.company,
      position: jobTitle,
      timestamp: new Date(),
      read: false,
      priority: 'urgent',
      actionRequired: true,
      interviewDate: interviewDateTime,
      metadata: {
        applicationId: applicationId,
        jobId: application.jobId,
        jobTitle: jobTitle,
        companyName: companyName || job.company,
        location: location,
        isVirtual: isVirtual,
        duration: duration,
        notes: additionalNotes
      }
    };

    await db.collection('notifications').insertOne(notification);

    // Format interview details for email
    const interviewDateFormatted = interviewDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const interviewTimeFormatted = interviewDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Send email notification to the candidate
    const emailSubject = `Interview Scheduled: ${jobTitle} Position`;
    const emailBody = `Dear ${candidateName || applicant.personal?.name || 'Candidate'},

We are pleased to inform you that your interview for the ${jobTitle} position at ${companyName || job.company} has been scheduled.

Interview Details:
📅 Date: ${interviewDateFormatted}
🕐 Time: ${interviewTimeFormatted}
⏱️ Duration: ${duration} minutes
${isVirtual ? '💻' : '📍'} ${isVirtual ? 'Meeting Link' : 'Location'}: ${location}

${additionalNotes ? `Additional Notes:
${additionalNotes}

` : ''}Please confirm your attendance by replying to this email. If you need to reschedule, please contact us as soon as possible.

We look forward to speaking with you!

Best regards,
${recruiter?.recruiter?.name || recruiter?.personal?.name || 'Recruitment Team'}
${companyName || job.company}

${recruiter?.email ? `Email: ${recruiter.email}` : ''}
${recruiter?.recruiter?.phone ? `Phone: ${recruiter.recruiter.phone}` : ''}`;

    try {
      await sendEmail(
        applicant.email,
        emailSubject,
        emailBody
      );
    } catch (emailError) {
      console.error('Failed to send interview notification email:', emailError);
      // Don't fail the entire request if email fails
    }

    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        applicationId,
        interviewDate: interviewDateTime,
        location,
        isVirtual,
        duration,
        additionalNotes,
        notificationSent: true
      }
    });
    
  } catch (error) {
    console.error('Schedule interview error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
