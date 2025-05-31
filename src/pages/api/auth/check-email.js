// API endpoint to check if an email is available (not already registered)
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    const db = client.db(dbName);
    
    // Normalize and escape email
    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check if email exists in main email field
    const existingUserByEmail = await db.collection('users').findOne({ 
      email: { $regex: new RegExp('^' + escapedEmail + '$', 'i') } 
    });
    
    // Check if email exists in contact.email field
    const existingUserByContactEmail = await db.collection('users').findOne({ 
      'contact.email': { $regex: new RegExp('^' + escapedEmail + '$', 'i') } 
    });
    
    // Return availability status
    if (existingUserByEmail || existingUserByContactEmail) {
      return res.status(200).json({ 
        available: false, 
        message: 'Email is already registered' 
      });
    }
    
    return res.status(200).json({ 
      available: true, 
      message: 'Email is available' 
    });
    
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({ message: 'Failed to check email availability' });
  }
}
