import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';

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

    // Connect to database
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

    return NextResponse.json({ 
      success: true,
      unreadCount,
      totalCount
    });

  } catch (error) {
    console.error('Notification count error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
