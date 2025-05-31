import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { createToken, setAuthCookie } from '../../../lib/auth';

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
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token with user information
    const token = await createToken({ 
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType,
      name: user.userType === 'applicant' ? user.personal?.name : user.recruiter?.name
    });
    
    // Set the token in the cookies
    setAuthCookie({ req, res, token });
    
    // Log the login attempt
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { lastLogin: new Date() },
        $push: { 
          loginHistory: {
            timestamp: new Date(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.headers['x-forwarded-for'] || 
                req.socket.remoteAddress || 
                'Unknown'
          } 
        }
      }
    );
    
    // Return success response with token and user info (excluding password and sensitive fields)
    const { 
      password: _, 
      resetPasswordToken: __, 
      resetPasswordExpiry: ___, 
      loginHistory: ____, 
      ...userWithoutSensitiveInfo 
    } = user;
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutSensitiveInfo
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}