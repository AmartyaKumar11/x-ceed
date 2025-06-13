import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';

export async function PATCH(request) {
  try {
    // Check authentication
    const auth = await authMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        success: false, 
        message: auth.error 
      }, { status: auth.status });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('x-ceed-db');

    // Convert userId to ObjectId for database query
    let userIdQuery;
    try {
      userIdQuery = new ObjectId(auth.user.userId);
    } catch (error) {
      userIdQuery = auth.user.userId;
    }

    // Update all unread notifications for the user
    const result = await db.collection('notifications').updateMany(
      { 
        userId: userIdQuery,
        read: false
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );

    console.log('Marked', result.modifiedCount, 'notifications as read for user:', auth.user.userId);

    return NextResponse.json({ 
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
