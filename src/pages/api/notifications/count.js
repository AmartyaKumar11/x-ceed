import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ 
        success: false, 
        message: auth.error 
      });
    }    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');

    // Convert userId to ObjectId for database query
    let userIdQuery;
    try {
      userIdQuery = new ObjectId(auth.user.userId);
    } catch (error) {
      // If conversion fails, use the string as is
      userIdQuery = auth.user.userId;
    }

    console.log('Counting notifications for userId:', auth.user.userId, 'as ObjectId:', userIdQuery);

    // Count unread notifications for the user
    const unreadCount = await db.collection('notifications').countDocuments({
      userId: userIdQuery,
      read: false
    });

    // Get total notification count
    const totalCount = await db.collection('notifications').countDocuments({
      userId: userIdQuery
    });

    console.log('Found', unreadCount, 'unread notifications out of', totalCount, 'total');

    return res.status(200).json({ 
      success: true,
      unreadCount,
      totalCount
    });

  } catch (error) {
    console.error('Notification count error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
