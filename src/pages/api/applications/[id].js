import clientPromise from '../../../lib/mongodb';
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
  const client = await clientPromise;
  const db = client.db();
  
  // Find the application
  const application = await db.collection('applications').findOne({
    _id: new ObjectId(id)
  });
  
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  
  // Handle different request methods
  switch (req.method) {
    case 'GET':
      try {
        // Check access permissions
        if (auth.user.userType === 'applicant' && application.applicantId !== auth.user.userId) {
          return res.status(403).json({ message: 'You can only view your own applications' });
        }
        
        // Return the application details
        return res.status(200).json({ application });
      } catch (error) {
        console.error('Error fetching application:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      
    case 'PATCH':
      try {
        // Only recruiters can update application status
        if (auth.user.userType !== 'recruiter') {
          return res.status(403).json({ message: 'Only recruiters can update application status' });
        }
        
        const { status, feedback, interviewDate } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'reviewing', 'interview', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        
        // Prepare update object
        const updateObj = {
          status,
          updatedAt: new Date()
        };
        
        // Add optional fields if provided
        if (feedback) {
          updateObj.feedback = feedback;
        }
        
        if (interviewDate) {
          updateObj.interviewDate = new Date(interviewDate);
        }
        
        // Update the application
        await db.collection('applications').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateObj }
        );
        
        // Add notification for the applicant
        const notification = {
          userId: application.applicantId,
          type: 'application_status',
          title: 'Application Status Updated',
          message: `Your application for ${application.jobDetails.title} has been updated to "${status}"`,
          read: false,
          createdAt: new Date()
        };
        
        await db.collection('notifications').insertOne(notification);
        
        // Return success message
        return res.status(200).json({ 
          message: 'Application status updated successfully',
          status
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
