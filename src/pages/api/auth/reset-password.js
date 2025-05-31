import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract data from request body
    const { token, password } = req.body;

    // Validate required fields
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Verify the token
    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check if the token is for password reset
    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid token purpose' });
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();

    // Find user by ID
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId),
      email: decoded.email
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the reset token has expired
    const now = new Date();
    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < now) {
      return res.status(401).json({ message: 'Reset token has expired' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and remove the reset token
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpiry: ""
        }
      }
    );

    // Return success response
    return res.status(200).json({ message: 'Password has been reset successfully' });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
