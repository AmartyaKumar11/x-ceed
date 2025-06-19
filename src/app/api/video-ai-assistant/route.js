import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { message, videoId, videoTitle, videoChannel, conversationHistory } = await request.json();

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build conversation context
    const videoContext = `
Video Information:
- Title: ${videoTitle}
- Channel: ${videoChannel}
- YouTube Video ID: ${videoId}
- Video URL: https://www.youtube.com/watch?v=${videoId}
`;

    // Build conversation history for context
    const conversationContext = conversationHistory
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are an AI video assistant helping users interact with YouTube videos. You can help with:

1. 📝 Creating notes and summaries
2. ✂️ Helping clip specific parts (provide timestamps)
3. 📸 Taking screenshots (provide timestamps)
4. 💾 Saving content to Google Drive
5. 💬 Answering questions about video content
6. 🎯 Providing learning recommendations

${videoContext}

Recent conversation:
${conversationContext}

Current user message: ${message}

Respond helpfully and include specific actions when relevant. If the user asks about clipping, screenshots, or saving to Drive, provide clear instructions and timestamps when possible.

For technical requests:
- Clipping: Suggest specific timestamp ranges (e.g., "2:30-4:15")
- Screenshots: Suggest specific timestamps (e.g., "at 3:45")
- Notes: Create structured, comprehensive notes
- Drive saving: Explain what will be saved and how

Be conversational, helpful, and specific to this video.`;

    const result = await model.generateContent([
      { text: systemPrompt }
    ]);

    const response = result.response;
    const aiResponse = response.text();

    // Detect if the response contains actionable items
    const actions = [];
    
    if (aiResponse.toLowerCase().includes('clip') || aiResponse.toLowerCase().includes('timestamp')) {
      actions.push({
        type: 'clip',
        text: '✂️ Set up video clipping',
        data: { videoId, timestamps: extractTimestamps(aiResponse) }
      });
    }
    
    if (aiResponse.toLowerCase().includes('screenshot')) {
      actions.push({
        type: 'screenshot',
        text: '📸 Take screenshot',
        data: { videoId, timestamps: extractTimestamps(aiResponse) }
      });
    }
    
    if (aiResponse.toLowerCase().includes('save') || aiResponse.toLowerCase().includes('drive')) {
      actions.push({
        type: 'save_drive',
        text: '💾 Save to Google Drive',
        data: { videoId, content: 'notes' }
      });
    }
    
    if (aiResponse.toLowerCase().includes('notes')) {
      actions.push({
        type: 'create_notes',
        text: '📝 Create detailed notes',
        data: { videoId, title: videoTitle }
      });
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      actions: actions,
      videoId: videoId
    });

  } catch (error) {
    console.error('Video AI Assistant Error:', error);
    
    // Fallback response if Gemini fails
    return NextResponse.json({
      success: true,
      response: `I'm here to help you with this video! I can assist you with:

📝 **Creating Notes**: I can summarize key points and create structured notes
✂️ **Clipping Videos**: Help you identify important sections to clip
📸 **Screenshots**: Suggest good moments to capture
💾 **Saving to Drive**: Organize your video content and notes

What would you like me to help you with regarding "${videoTitle || 'this video'}"?

(Note: I'm currently running on backup mode. Some features may be limited.)`,
      actions: [
        { type: 'create_notes', text: '📝 Create Notes', data: {} },
        { type: 'help', text: '❓ Show All Features', data: {} }
      ]
    });
  }
}

// Helper function to extract timestamps from AI response
function extractTimestamps(text) {
  const timestampRegex = /(\d{1,2}):(\d{2})/g;
  const timestamps = [];
  let match;
  
  while ((match = timestampRegex.exec(text)) !== null) {
    timestamps.push(match[0]);
  }
  
  return timestamps;
}
