import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    console.log("Starting registration process...");
    
    // Connect to the database
    console.log("Connecting to MongoDB...");    const client = await clientPromise.catch(err => {
      console.error("Failed to get MongoDB client:", err);
      throw new Error(`MongoDB connection error: ${err.message}`);
    });
    
    console.log("Successfully connected to MongoDB client");
    
    // Extract database name from URI or use default
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    
    console.log("Using database:", dbName);
    const db = client.db(dbName); // Use extracted database name
    
    // Verify database connection by listing collections
    try {
      const collections = await db.listCollections().toArray();
      console.log("Available collections:", collections.map(c => c.name));
    } catch (collErr) {
      console.error("Failed to list collections:", collErr);
    }
      // Extract data from request body
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    const { 
      email, 
      password,
      userType, // 'applicant' or 'recruiter'
      userData // Contains either personal info for applicants or recruiter info
    } = req.body;

    // Validate required fields
    if (!email || !password || !userType) {
      console.log("Missing required fields:", { email: !!email, password: !!password, userType });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user with email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Prepare user object based on user type
    let userObj = {
      email,
      password: hashedPassword,
      userType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (userType === 'applicant') {
      // For applicants, add personal data
      userObj.personal = userData.personal || {};
      userObj.education = userData.education || [];
      userObj.contact = userData.contact || {};
      userObj.workExperience = userData.workExperience || [];
    } else if (userType === 'recruiter') {
      // For recruiters, add recruiter data
      userObj.recruiter = userData || {};
    }    console.log("Inserting user into database:", { email: userObj.email, userType: userObj.userType });
    
    // Check if the 'users' collection exists, create it if not
    const collections = await db.listCollections({name: 'users'}).toArray();
    if (collections.length === 0) {
      console.log("Users collection doesn't exist, creating it now");
      await db.createCollection('users');
    }
    
    // Insert user into database
    try {
      const result = await db.collection('users').insertOne(userObj);
      console.log("User inserted with ID:", result.insertedId);
      
      // Verify the user was inserted
      const verifyUser = await db.collection('users').findOne({ _id: result.insertedId });
      if (verifyUser) {
        console.log("User successfully verified in database");
      } else {
        console.warn("User insertion verification failed - couldn't find the user after insert");
      }
      return result;
    } catch (insertErr) {
      console.error("Error during user insertion:", insertErr);
      throw new Error(`Failed to insert user: ${insertErr.message}`);
    }
    
    // Return success response with user ID (exclude password)
    const { password: _, ...userWithoutPassword } = userObj;
    return res.status(201).json({ 
      message: 'User registered successfully',
      user: { 
        id: result.insertedId,
        ...userWithoutPassword
      }
    });
      } catch (error) {
    console.error('Registration error:', error);
    // Send more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        message: 'Registration failed',
        error: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}