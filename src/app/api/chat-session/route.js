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
    // Check if Firebase is available
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase not configured - using localStorage fallback' 
      });
    }

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
    // Check if Firebase is available
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase not configured - using localStorage fallback' 
      });
    }

    const sessionData = await request.json();
    const { videoId, videoTitle, videoChannel, messages, projectFolder } = sessionData;

    if (!videoId || !messages) {
      return NextResponse.json({ success: false, error: 'Invalid session data' });
    }

    // Create session ID from video info
    const sessionId = `${videoId}_${Buffer.from(videoTitle || '').toString('base64').slice(0, 10)}`;
    
    // Save/update chat session - Clean data to avoid Firestore errors
    const sessionDoc = {
      videoId,
      updatedAt: new Date(),
      createdAt: new Date()
    };

    // Only add fields if they have valid values
    if (videoTitle && videoTitle.trim()) {
      sessionDoc.videoTitle = videoTitle.trim();
    }
    
    if (videoChannel && videoChannel.trim()) {
      sessionDoc.videoChannel = videoChannel.trim();
    }
    
    if (projectFolder && typeof projectFolder === 'object') {
      // Clean project folder data
      const cleanProjectFolder = {};
      if (projectFolder.folderId) cleanProjectFolder.folderId = projectFolder.folderId;
      if (projectFolder.name) cleanProjectFolder.name = projectFolder.name;
      if (projectFolder.folderUrl) cleanProjectFolder.folderUrl = projectFolder.folderUrl;
      if (projectFolder.webViewLink) cleanProjectFolder.webViewLink = projectFolder.webViewLink;
      
      if (Object.keys(cleanProjectFolder).length > 0) {
        sessionDoc.projectFolder = cleanProjectFolder;
      }
    }

    await setDoc(doc(db, 'chatSessions', sessionId), sessionDoc, { merge: true });

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

    // Add new messages - Clean data to avoid Firestore errors
    const messagePromises = messages.map(message => {
      // Clean the message data to remove undefined values
      const cleanMessage = {
        sessionId,
        type: message.type || 'user',
        content: message.content || '',
        timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
        messageId: message.id || Date.now().toString()
      };

      // Only add optional fields if they have valid values
      if (message.actions && Array.isArray(message.actions) && message.actions.length > 0) {
        cleanMessage.actions = message.actions;
      }
      
      if (message.clips && Array.isArray(message.clips) && message.clips.length > 0) {
        cleanMessage.clips = message.clips;
      }
      
      if (message.notes && message.notes !== null && message.notes !== undefined) {
        cleanMessage.notes = message.notes;
      }
      
      if (message.isWelcome === true) {
        cleanMessage.isWelcome = true;
      }
      
      if (message.showProjectSetup === true) {
        cleanMessage.showProjectSetup = true;
      }

      return addDoc(collection(db, 'chatMessages'), cleanMessage);
    });
    
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
    // Check if Firebase is available
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase not configured - using localStorage fallback' 
      });
    }

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
