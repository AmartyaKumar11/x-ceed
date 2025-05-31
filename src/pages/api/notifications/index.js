import { connectToDatabase } from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Verify authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      const { db } = await connectToDatabase();
      
      // Get notifications for the user
      const notifications = await db.collection('notifications')
        .find({ 
          userId: decoded.userId,
          $or: [
            { deleted: { $ne: true } },
            { deleted: { $exists: false } }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      // Process notifications to check for upcoming interviews
      const processedNotifications = notifications.map(notification => {
        // Check if interview is upcoming (within 2 days)
        if (notification.type === 'interview_scheduled' && notification.interviewDate) {
          const now = new Date();
          const interviewDate = new Date(notification.interviewDate);
          const timeDiff = interviewDate - now;
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          
          if (daysDiff <= 2 && daysDiff > 0) {
            notification.isUpcoming = true;
            notification.priority = 'urgent';
          }
        }
        return notification;
      });

      return res.status(200).json({
        success: true,
        data: processedNotifications
      });

    } else if (req.method === 'PUT') {
      // Update notification (mark as read, snooze, etc.)
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      const { notificationId, action, data } = req.body;

      if (!notificationId || !action) {
        return res.status(400).json({ success: false, message: 'Notification ID and action are required' });
      }

      const { db } = await connectToDatabase();

      let updateData = {};
      
      switch (action) {
        case 'mark_read':
          updateData = { isRead: true, readAt: new Date() };
          break;
        case 'snooze':
          updateData = { 
            snoozed: true, 
            snoozeUntil: new Date(Date.now() + (data?.hours || 1) * 60 * 60 * 1000) 
          };
          break;
        case 'delete':
          updateData = { deleted: true, deletedAt: new Date() };
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid action' });
      }

      const result = await db.collection('notifications').updateOne(
        { 
          _id: new ObjectId(notificationId), 
          userId: decoded.userId 
        },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification updated successfully'
      });

    } else if (req.method === 'POST') {
      // Create new notification (typically called by the system, not directly by users)
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      const {
        type,
        title,
        message,
        company,
        position,
        priority = 'medium',
        actionRequired = false,
        interviewDate,
        metadata = {}
      } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Type, title, and message are required' 
        });
      }

      const { db } = await connectToDatabase();

      const notification = {
        userId: decoded.userId,
        type,
        title,
        message,
        company,
        position,
        priority,
        actionRequired,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        metadata,
        timestamp: new Date(),
        isRead: false,
        snoozed: false,
        deleted: false
      };

      const result = await db.collection('notifications').insertOne(notification);

      return res.status(201).json({
        success: true,
        data: { ...notification, _id: result.insertedId }
      });

    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'POST']);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Notifications API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
