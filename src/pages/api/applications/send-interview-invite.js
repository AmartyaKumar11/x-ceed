import clientPromise from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';
import { sendInterviewInvitation } from '../../../lib/emailService';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ message: auth.error });
    }
    
    // Only recruiters can send interview invitations
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can send interview invitations' });
    }
    
    // Extract data from request body
    const { 
      applicationId, 
      interviewDate,
      location,
      isVirtual = false,
      additionalNotes
    } = req.body;
    
    // Validate required fields
    if (!applicationId || !interviewDate || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the application
    const application = await db.collection('applications').findOne({
      _id: new ObjectId(applicationId)
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Get the applicant details
    const applicant = await db.collection('users').findOne({
      _id: new ObjectId(application.applicantId)
    });
    
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    // Get the recruiter details
    const recruiter = await db.collection('users').findOne({
      _id: new ObjectId(auth.user.userId)
    });
    
    // Get the job details
    const job = await db.collection('jobs').findOne({
      _id: new ObjectId(application.jobId)
    });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Send the interview invitation
    await sendInterviewInvitation({
      to: applicant.email,
      name: applicant.personal?.name || applicant.email,
      position: job.title,
      company: job.company,
      interviewDate: new Date(interviewDate),
      location,
      isVirtual,
      recruiterName: recruiter.recruiter?.name || 'Recruitment Team',
      recruiterEmail: recruiter.email,
      recruiterPhone: recruiter.recruiter?.phone || 'N/A',
      additionalNotes
    });
    
    // Update the application status
    await db.collection('applications').updateOne(
      { _id: new ObjectId(applicationId) },
      { 
        $set: { 
          status: 'interview',
          interviewDate: new Date(interviewDate),
          interviewLocation: location,
          interviewIsVirtual: isVirtual,
          interviewNotes: additionalNotes,
          interviewInviteSent: true,
          interviewInviteSentAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    // Create a notification for the applicant
    const notification = {
      userId: applicant._id.toString(),
      type: 'interview_invitation',
      title: 'Interview Invitation',
      message: `You've been invited to an interview for ${job.title} at ${job.company}!`,
      read: false,
      createdAt: new Date()
    };
    
    await db.collection('notifications').insertOne(notification);
    
    // Return success response
    return res.status(200).json({ 
      message: 'Interview invitation sent successfully',
      applicationId,
      interviewDate,
      location,
      isVirtual,
      additionalNotes
    });
    
  } catch (error) {
    console.error('Send interview invitation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
