import clientPromise from '../../../lib/mongodb';
import { createToken } from '../../../lib/auth';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Extract data from request body
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });
    
    // If the user doesn't exist, we still return a success message
    // for security reasons (to prevent email enumeration)
    if (!user) {
      return res.status(200).json({ 
        message: 'If your email exists in our system, you will receive a password reset link shortly.' 
      });
    }
    
    // Generate a unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save the reset token to the database with an expiry time (1 hour)
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
    
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpiry: resetTokenExpiry,
          updatedAt: new Date()
        }
      }
    );
    
    // Generate a JWT token for the password reset link
    const token = await createToken({ 
      userId: user._id.toString(),
      email: user.email,
      purpose: 'password_reset',
      exp: Math.floor(resetTokenExpiry.getTime() / 1000)
    });
    
    // Create the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;
    
    // In a real application, send an email with the reset link
    // For now, just log it to the console
    console.log('Password reset link:', resetUrl);
    
    // Return success response
    return res.status(200).json({
      message: 'If your email exists in our system, you will receive a password reset link shortly.',
      // Only include the reset URL in development for testing purposes
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
    
  } catch (error) {
    console.error('Request password reset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
