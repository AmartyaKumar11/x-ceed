import clientPromise, { getDatabase } from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Check authentication first
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }
  
  // Get application ID from the request
  const { id } = req.query;
  
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid application ID' });
  }
    // Connect to the database
  const db = await getDatabase();
  
  // Find the application
  const application = await db.collection('applications').findOne({
    _id: new ObjectId(id)
  });
  
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  
  // Handle different request methods
  switch (req.method) {    case 'GET':
      try {
        // Check access permissions
        if (auth.user.userType === 'applicant' && application.applicantId !== auth.user.userId) {
          return res.status(403).json({ 
            success: false,
            message: 'You can only view your own applications' 
          });
        }
        
        // For recruiters, check if they own the job
        if (auth.user.userType === 'recruiter') {
          const job = await db.collection('jobs').findOne({
            _id: new ObjectId(application.jobId),
            recruiterId: auth.user.userId
          });
          
          if (!job) {
            return res.status(403).json({ 
              success: false,
              message: 'You can only view applications for jobs you own' 
            });
          }
        }
        
        // Return the application details
        return res.status(200).json({ 
          success: true,
          data: application 
        });
      } catch (error) {
        console.error('Error fetching application:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
        case 'PATCH':
      try {
        // Only recruiters can update application status
        if (auth.user.userType !== 'recruiter') {
          return res.status(403).json({ 
            success: false,
            message: 'Only recruiters can update application status' 
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
            message: 'You can only update applications for jobs you own' 
          });
        }
        
        const { status, feedback, interviewDate } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'reviewing', 'interview', 'accepted', 'rejected'];
        if (status && !validStatuses.includes(status)) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid status' 
          });
        }
        
        // Prepare update object
        const updateObj = {
          updatedAt: new Date()
        };
        
        // Only add fields that are provided
        if (status) updateObj.status = status;
        if (feedback) updateObj.feedback = feedback;
        if (interviewDate) updateObj.interviewDate = new Date(interviewDate);
        
        // Update the application
        const result = await db.collection('applications').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateObj }
        );
        
        if (result.modifiedCount === 0) {
          return res.status(400).json({
            success: false,
            message: 'Application was not updated'
          });
        }
        
        // Get the updated application
        const updatedApplication = await db.collection('applications').findOne({
          _id: new ObjectId(id)
        });        // Add notification for the applicant if status is changed
        if (status) {
          let notificationTitle, notificationMessage, notificationType, priority;
          
          // Create specific notifications based on status
          switch (status) {
            case 'accepted':
              notificationTitle = '🎉 Application Accepted!';
              notificationMessage = `Congratulations! Your application for ${job.title} at ${job.company} has been accepted. You will hear from the recruiter soon with next steps.`;
              notificationType = 'application_accepted';
              priority = 'high';
              break;
              
            case 'rejected':
              notificationTitle = 'Application Update';
              notificationMessage = `Thank you for your interest in the ${job.title} position at ${job.company}. After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for other positions that match your skills.`;
              notificationType = 'application_rejected';
              priority = 'medium';
              break;
              
            case 'interview':
              notificationTitle = '📅 Interview Scheduled';
              notificationMessage = `Great news! You've been selected for an interview for the ${job.title} position at ${job.company}. ${interviewDate ? `Your interview is scheduled for ${new Date(interviewDate).toLocaleDateString()}.` : 'The recruiter will contact you soon with interview details.'}`;
              notificationType = 'interview_scheduled';
              priority = 'urgent';
              break;
              
            case 'reviewing':
              notificationTitle = '👀 Application Under Review';
              notificationMessage = `Your application for ${job.title} at ${job.company} is now being reviewed by our recruitment team. We'll update you on the progress soon.`;
              notificationType = 'application_status';
              priority = 'medium';
              break;
              
            default:
              notificationTitle = 'Application Status Updated';
              notificationMessage = `Your application for ${job.title} at ${job.company} has been updated to "${status}".`;
              notificationType = 'application_status';
              priority = 'medium';
          }
            // Create the notification
          const notification = {
            userId: application.applicantId, // Keep as string to match JWT token format
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            company: job.company,
            position: job.title,
            timestamp: new Date(),
            read: false,
            priority: priority,
            actionRequired: status === 'interview' || status === 'accepted',
            interviewDate: interviewDate ? new Date(interviewDate) : null,
            metadata: {
              jobId: job._id.toString(),
              jobTitle: job.title,
              company: job.company,
              applicationId: application._id.toString(),
              newStatus: status,
              feedback: feedback || null
            }
          };
          
          await db.collection('notifications').insertOne(notification);
          console.log(`✅ Notification created for user ${application.applicantId} - Job: ${job.title}, Status: ${status}`);
        }
        
        // Return success message with updated application
        return res.status(200).json({ 
          success: true,
          message: 'Application updated successfully',
          data: updatedApplication
        });
      } catch (error) {
        console.error('Error updating application:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      
    case 'DELETE':
      try {
        // Only the applicant who created the application can delete it
        // and only if it's still in pending status
        if (auth.user.userType === 'applicant' && application.applicantId !== auth.user.userId) {
          return res.status(403).json({ message: 'You can only delete your own applications' });
        }
        
        if (auth.user.userType === 'applicant' && application.status !== 'pending') {
          return res.status(403).json({ message: 'You can only delete pending applications' });
        }
        
        // Delete the application
        await db.collection('applications').deleteOne({ _id: new ObjectId(id) });
        
        return res.status(200).json({ message: 'Application deleted successfully' });
      } catch (error) {
        console.error('Error deleting application:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
