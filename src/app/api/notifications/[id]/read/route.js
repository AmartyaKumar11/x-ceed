import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authMiddleware } from '@/lib/middleware';

export async function PATCH(request, { params }) {
  try {
    // Check authentication
    const auth = await authMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ 
        success: false, 
        message: auth.error 
      }, { status: auth.status });
    }

    const { id } = params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid notification ID format' 
      }, { status: 400 });
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

    // Update the specific notification as read
    const result = await db.collection('notifications').updateOne(
      { 
        _id: new ObjectId(id),
        userId: userIdQuery
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Notification not found or does not belong to user' 
      }, { status: 404 });
    }

    console.log('Marked notification', id, 'as read for user:', auth.user.userId);

    return NextResponse.json({ 
      success: true,
      modified: result.modifiedCount > 0,
      message: result.modifiedCount > 0 ? 'Notification marked as read' : 'Notification was already read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
