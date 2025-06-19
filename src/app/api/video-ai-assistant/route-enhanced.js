import { NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

export async function POST(request) {
  try {
    const { message, videoId, videoTitle, videoChannel, conversationHistory } = await request.json();

    // Try to connect to Python service first
    try {
      const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          video_id: videoId,
          video_title: videoTitle,
          video_channel: videoChannel,
          conversation_history: conversationHistory || []
        }),
        timeout: 10000 // 10 second timeout
      });

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json();
        
        return NextResponse.json({
          success: true,
          response: pythonData.response,
          actions: pythonData.actions || [],
          clips: pythonData.clips,
          notes: pythonData.notes,
          source: 'python_service'
        });
      }
    } catch (pythonError) {
      console.log('Python service not available, falling back to Gemini:', pythonError.message);
    }

    // Fallback to direct Gemini API call
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build conversation context
    const conversationContext = conversationHistory
      ?.slice(-5) // Last 5 messages for context
      ?.map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      ?.join('\n') || '';

    const systemPrompt = `You are an AI video assistant helping users analyze YouTube videos. 

Video Information:
- Title: ${videoTitle}
- Channel: ${videoChannel}
- YouTube Video ID: ${videoId}

You can help with:
1. 📝 Answering questions about video content
2. ✂️ Suggesting clips (provide timestamps when possible)
3. 📸 Screenshot suggestions (provide timestamps)
4. 📋 Creating notes and summaries
5. 🎯 Learning recommendations

Recent conversation:
${conversationContext}

Current user message: ${message}

Provide helpful responses about the video. If you need the actual transcript to give better answers, mention that the enhanced Python service provides more detailed analysis with full transcript access.

For clip suggestions, use format like "2:30-4:15" for timestamps.
For screenshots, suggest specific times like "at 3:45".`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    // Detect actions from user message
    const actions = detectActions(message);

    return NextResponse.json({
      success: true,
      response: response,
      actions: actions,
      source: 'gemini_fallback',
      note: 'For enhanced video analysis with full transcript access, ensure the Python service is running.'
    });

  } catch (error) {
    console.error('Error in video AI assistant:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      response: 'I apologize, but I encountered an error processing your request. Please try again in a moment.'
    }, { status: 500 });
  }
}

function detectActions(message) {
  const actions = [];
  const messageLower = message.toLowerCase();

  if (messageLower.includes('notes') || messageLower.includes('note') || messageLower.includes('summary')) {
    actions.push({
      type: 'notes',
      text: 'Generate Notes',
      description: 'Create structured notes from this video'
    });
  }

  if (messageLower.includes('clip') || messageLower.includes('segment') || messageLower.includes('timestamp')) {
    actions.push({
      type: 'clips',
      text: 'Suggest Clips',
      description: 'Find interesting video segments'
    });
  }

  if (messageLower.includes('screenshot') || messageLower.includes('capture')) {
    actions.push({
      type: 'screenshot',
      text: 'Screenshot',
      description: 'Suggest screenshot moments'
    });
  }

  return actions;
}
