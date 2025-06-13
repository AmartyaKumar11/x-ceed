import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Check authentication
    const auth = await authMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        success: false, 
        message: auth.error 
      }, { status: auth.status });
    }

    console.log('Fetching notifications for userId:', auth.user.userId);

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
    
    console.log('Using userIdQuery:', userIdQuery);
    
    // Get notifications for the user
    const notifications = await db.collection('notifications')
      .find({ 
        userId: userIdQuery,
        $or: [
          { deleted: { $ne: true } },
          { deleted: { $exists: false } }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
      
    console.log('Found notifications:', notifications.length);

    // Process notifications to check for upcoming interviews
    const processedNotifications = notifications.map(notification => {
      // Check if interview is upcoming (within 2 days)
      if (notification.type === 'interview_scheduled' && notification.interviewDate) {
        const now = new Date();
        const interviewDate = new Date(notification.interviewDate);
        const timeDiff = interviewDate.getTime() - now.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        if (daysDiff <= 2 && daysDiff >= 0) {
          notification.isUpcoming = true;
        }
      }
      
      return {
        ...notification,
        _id: notification._id.toString()
      };
    });

    return NextResponse.json({ 
      success: true, 
      notifications: processedNotifications 
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const auth = await authMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        success: false, 
        message: auth.error 
      }, { status: auth.status });
    }

    const body = await request.json();
    console.log('Creating notification:', body);

    const client = await clientPromise;
    const db = client.db('x-ceed-db');

    // Validate required fields
    if (!body.type || !body.title || !body.message) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: type, title, message'
      }, { status: 400 });
    }

    // Convert userId to ObjectId
    let userIdQuery;
    try {
      userIdQuery = new ObjectId(auth.user.userId);
    } catch (error) {
      userIdQuery = auth.user.userId;
    }

    const notification = {
      userId: userIdQuery,
      type: body.type,
      title: body.title,
      message: body.message,
      read: false,
      timestamp: new Date(),
      ...body.data || {}
    };

    const result = await db.collection('notifications').insertOne(notification);

    return NextResponse.json({
      success: true,
      notificationId: result.insertedId.toString(),
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
