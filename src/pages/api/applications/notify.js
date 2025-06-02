import clientPromise from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

// This is a placeholder for an email service
// In a real application, you would use a service like SendGrid, Mailgun, or AWS SES
async function sendEmail(to, subject, body) {
  console.log(`Email would be sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // This is a simulation of sending an email
  // In production, replace this with actual email sending code
  return { success: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed'
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
  
  // Only recruiters can send notifications
  if (auth.user.userType !== 'recruiter') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only recruiters can send notifications' 
    });
  }
  
  // Get request data
  const { applicationId, emailSubject, emailBody } = req.body;
  
  if (!applicationId || !emailSubject || !emailBody) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: applicationId, emailSubject, emailBody' 
    });
  }
  
  if (!ObjectId.isValid(applicationId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid application ID'
    });
  }
  
  try {
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the application
    const application = await db.collection('applications').findOne({
      _id: new ObjectId(applicationId)
    });
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: 'Application not found'
      });
    }
    
    // Check if the recruiter owns the job for this application
    const job = await db.collection('jobs').findOne({
      _id: new ObjectId(application.jobId),
      recruiterId: auth.user.userId
    });
    
    if (!job) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only send notifications for your own jobs'
      });
    }
    
    // Get the applicant email
    const applicant = await db.collection('users').findOne({
      _id: new ObjectId(application.applicantId)
    });
    
    if (!applicant || !applicant.email) {
      return res.status(404).json({ 
        success: false, 
        message: 'Applicant email not found'
      });
    }
    
    // Send the email notification
    const emailResult = await sendEmail(
      applicant.email,
      emailSubject,
      emailBody
    );
    
    // Create notification record in database
    await db.collection('notifications').insertOne({
      userId: application.applicantId,
      type: 'email',
      title: emailSubject,
      message: emailBody,
      applicationId: application._id.toString(),
      jobId: application.jobId,
      jobTitle: job.title || 'Job',
      read: false,
      createdAt: new Date()
    });
    
    // Update the application with a record of this notification
    await db.collection('applications').updateOne(
      { _id: new ObjectId(applicationId) },
      { 
        $push: { 
          communications: {
            date: new Date(),
            type: 'email',
            subject: emailSubject,
            message: emailBody,
            sentBy: auth.user.userId
          } 
        },
        $set: { updatedAt: new Date() }
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification'
    });
  }
}
