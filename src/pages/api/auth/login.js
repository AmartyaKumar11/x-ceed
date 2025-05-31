import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { createToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  console.log('🔍 LOGIN API CALLED:', {
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {    console.log('🔗 Connecting to MongoDB...');
    // Connect to the database
    const client = await clientPromise;
    
    // Extract database name from URI or use default
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    
    const db = client.db(dbName);
    
    // Debug database info
    const actualDbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    console.log('📊 Database info:', { 
      intendedDbName: dbName,
      actualDbName, 
      collectionsCount: collections.length,
      collections: collections.map(c => c.name)
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Extract data from request body
    const { email, password } = req.body;
    console.log('📨 Request data:', { email, passwordLength: password?.length });    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'Missing email or password' });
    }

    console.log('🔍 Looking for user with email:', email);
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    console.log('👤 User lookup result:', { 
      found: !!user, 
      actualEmail: user?.email,
      userType: user?.userType,
      hasPassword: !!user?.password 
    });
    
    // Check if user exists
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
      // Verify password
    console.log('🔐 Testing password for user:', user.email);
    console.log('🔐 Password hash preview:', user.password?.substring(0, 20) + '...');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password invalid for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('✅ Login successful for:', email);
    
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