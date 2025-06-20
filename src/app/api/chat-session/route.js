import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  deleteDoc
} from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const videoTitle = searchParams.get('title');

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Video ID required' });
    }

    // Create session ID from video info
    const sessionId = `${videoId}_${Buffer.from(videoTitle || '').toString('base64').slice(0, 10)}`;
    
    // Get chat session from Firebase
    const sessionDoc = await getDoc(doc(db, 'chatSessions', sessionId));
    
    if (!sessionDoc.exists()) {
      return NextResponse.json({
        success: true,
        session: null
      });
    }

    const sessionData = sessionDoc.data();
    
    // Get messages for this session
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));

    return NextResponse.json({
      success: true,
      session: {
        ...sessionData,
        messages
      }
    });

  } catch (error) {
    console.error('Error loading chat session:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

export async function POST(request) {
  try {
    const sessionData = await request.json();
    const { videoId, videoTitle, videoChannel, messages, projectFolder } = sessionData;

    if (!videoId || !messages) {
      return NextResponse.json({ success: false, error: 'Invalid session data' });
    }

    // Create session ID from video info
    const sessionId = `${videoId}_${Buffer.from(videoTitle || '').toString('base64').slice(0, 10)}`;
    
    // Save/update chat session
    await setDoc(doc(db, 'chatSessions', sessionId), {
      videoId,
      videoTitle,
      videoChannel,
      projectFolder,
      updatedAt: new Date(),
      createdAt: new Date()
    }, { merge: true });

    // Clear existing messages for this session
    const existingMessagesQuery = query(
      collection(db, 'chatMessages'),
      where('sessionId', '==', sessionId)
    );
    const existingMessagesSnapshot = await getDocs(existingMessagesQuery);
      // Delete existing messages (proper way with Firebase v9+)
    for (const docRef of existingMessagesSnapshot.docs) {
      await deleteDoc(docRef.ref);
    }

    // Add new messages
    const messagePromises = messages.map(message => 
      addDoc(collection(db, 'chatMessages'), {
        sessionId,
        type: message.type,
        content: message.content,
        timestamp: new Date(message.timestamp),
        actions: message.actions || [],
        clips: message.clips || [],
        notes: message.notes || null,
        isWelcome: message.isWelcome || false,
        showProjectSetup: message.showProjectSetup || false
      })
    );
    
    await Promise.all(messagePromises);

    return NextResponse.json({
      success: true,
      message: 'Chat session saved successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error saving chat session:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const videoTitle = searchParams.get('title');

    if (!videoId) {
      return NextResponse.json({ success: false, error: 'Video ID required' });
    }

    // Create session ID from video info
    const sessionId = `${videoId}_${Buffer.from(videoTitle || '').toString('base64').slice(0, 10)}`;
    
    // Delete all messages for this session
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('sessionId', '==', sessionId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Delete the chat session
    await deleteDoc(doc(db, 'chatSessions', sessionId));

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
