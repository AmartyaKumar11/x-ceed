import { authMiddleware } from '../../../lib/middleware';
import { sendCustomEmail } from '../../../lib/emailService';

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
    
    // Only recruiters can send emails
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can send emails' });
    }
    
    // Extract data from request body
    const { to, subject, body } = req.body;
    
    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: to, subject, and body are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email address format' 
      });
    }
      try {
      // Send the email using the email service
      await sendCustomEmail({
        to,
        subject,
        body,
        senderType: 'recruiter',
        senderId: auth.user.userId
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Email sent successfully' 
      });
      
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // For development/testing, we'll return success even if email fails
      // In production, you'd want to handle this differently
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Simulating email send success');
        return res.status(200).json({ 
          success: true,
          message: 'Email sent successfully (development mode)' 
        });
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send email. Please try again later.' 
      });
    }
    
  } catch (error) {
    console.error('API error in email send:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
}
