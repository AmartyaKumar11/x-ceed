import { authMiddleware } from '../../../lib/middleware';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ message: auth.error });
    }
    
    // Return the user details
    if (auth.user.details) {
      // If details are already included in the auth object, return them
      return res.status(200).json({ user: auth.user.details });
    }
    
    // Otherwise, fetch user details from the database
    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(auth.user.userId)
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user info (excluding password and other sensitive fields)
    const { 
      password, 
      resetPasswordToken, 
      resetPasswordExpiry, 
      loginHistory, 
      ...userWithoutSensitiveInfo 
    } = user;
    
    return res.status(200).json({ 
      user: userWithoutSensitiveInfo
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
