import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';

export default async function handler(req, res) {
  // Only allow PATCH requests
  if (req.method !== 'PATCH') {
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
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');

    // Update all unread notifications for the user
    const result = await db.collection('notifications').updateMany(
      { 
        userId: auth.user.userId,
        read: false
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );

    return res.status(200).json({ 
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
