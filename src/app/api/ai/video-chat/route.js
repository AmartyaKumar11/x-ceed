import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, videoContext, chatHistory, learningMaterials } = await request.json();
    
    console.log('🤖 AI Video Chat Request:', {
      message,
      skill: videoContext?.skill,
      timestamp: videoContext?.currentTime,
      videoTitle: videoContext?.videoTitle
    });

    // Check if we have Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return provideMockResponse(message, videoContext);
    }

    // Build context-aware prompt
    const systemPrompt = buildSystemPrompt(videoContext, learningMaterials);
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that right now.";

    // Parse response for actions
    const actions = extractActions(aiResponse, videoContext);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      actions,
      timestamp: videoContext?.currentTime,
      context: {
        skill: videoContext?.skill,
        videoTitle: videoContext?.videoTitle
      }
    });

  } catch (error) {
    console.error('AI Video Chat Error:', error);
    
    // Fallback to mock response
    return provideMockResponse(message, videoContext);
  }
}

function buildSystemPrompt(videoContext, learningMaterials) {
  const { skill, videoTitle, videoChannel, currentTime, duration } = videoContext || {};
  
  return `You are an AI Learning Assistant helping a student learn "${skill}" by watching a video tutorial.

CURRENT CONTEXT:
- Video: "${videoTitle}" by ${videoChannel}
- Learning Topic: ${skill}
- Current Timestamp: ${formatTime(currentTime)} / ${formatTime(duration)}
- Session Progress: ${learningMaterials?.bookmarks || 0} bookmarks, ${learningMaterials?.notes || 0} notes, ${learningMaterials?.clips || 0} clips

YOUR ROLE:
1. Help explain concepts shown in the video
2. Suggest when to save clips, take notes, or bookmark important moments
3. Answer questions about the learning material
4. Provide context-aware guidance based on the current video timestamp
5. Encourage active learning and engagement

CAPABILITIES:
- When you suggest saving content, use action commands like [BOOKMARK], [SAVE_CLIP], [TAKE_NOTE], [SCREENSHOT]
- Reference specific timestamps when relevant
- Provide clear, educational explanations
- Encourage hands-on practice and note-taking

RESPONSE STYLE:
- Be encouraging and supportive
- Use emojis sparingly but effectively
- Keep responses concise but informative
- Focus on practical learning advice
- Reference the video content when possible

Current student question:`;
}

function extractActions(response, videoContext) {
  const actions = [];
  const currentTime = videoContext?.currentTime || 0;
  
  // Look for action indicators in the AI response
  if (response.includes('[BOOKMARK]') || response.toLowerCase().includes('bookmark this')) {
    actions.push({
      type: 'bookmark',
      timestamp: currentTime,
      title: `Important concept at ${formatTime(currentTime)}`,
      description: 'AI suggested bookmark'
    });
  }
  
  if (response.includes('[SAVE_CLIP]') || response.toLowerCase().includes('save this clip')) {
    actions.push({
      type: 'save_clip',
      startTime: Math.max(0, currentTime - 15),
      endTime: currentTime + 15,
      title: `Key explanation clip`
    });
  }
  
  if (response.includes('[TAKE_NOTE]') || response.toLowerCase().includes('take a note')) {
    actions.push({
      type: 'take_note',
      content: `Note from ${formatTime(currentTime)}: Key learning point`
    });
  }
  
  if (response.includes('[SCREENSHOT]') || response.toLowerCase().includes('screenshot')) {
    actions.push({
      type: 'screenshot',
      title: `Screenshot at ${formatTime(currentTime)}`
    });
  }
  
  return actions;
}

function provideMockResponse(message, videoContext) {
  const { skill, currentTime } = videoContext || {};
  
  // Analyze message for context
  const lowerMessage = message.toLowerCase();
  
  let response = '';
  let actions = [];
  
  if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
    response = `Great question! At ${formatTime(currentTime)}, this concept in ${skill} is fundamental to understand. 

Let me break it down:
- This is a core concept that builds on what you've learned
- The example shown demonstrates practical application
- You'll use this knowledge in real projects

💡 I suggest bookmarking this moment and taking a note about the key points discussed here.`;
    
    actions.push({
      type: 'bookmark',
      timestamp: currentTime,
      title: `${skill} concept explanation`,
      description: 'Key learning moment'
    });
  }
  else if (lowerMessage.includes('save') || lowerMessage.includes('clip')) {
    response = `✅ Great idea! I'll save this section as a clip for you to review later. This part covers important ${skill} concepts that you'll want to reference again.

The clip will include the current explanation and context around ${formatTime(currentTime)}.`;
    
    actions.push({
      type: 'save_clip',
      startTime: Math.max(0, currentTime - 30),
      endTime: currentTime + 30,
      title: `${skill} - Important section`
    });
  }
  else if (lowerMessage.includes('note') || lowerMessage.includes('summary')) {
    response = `📝 I'll help you create a note for this section! Here's what's important at ${formatTime(currentTime)}:

**Key Points:**
- Main concept being discussed
- Practical application examples
- How this fits into your ${skill} learning journey

This note will be saved with the timestamp for easy reference.`;
    
    actions.push({
      type: 'take_note',
      content: `${skill} learning note from ${formatTime(currentTime)}: Key concepts and practical applications discussed.`
    });
  }
  else if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
    response = `🧠 Excellent! Testing your knowledge is crucial for learning ${skill}. Based on what you've watched so far:

**Quick Quiz:**
1. What was the main concept explained around ${formatTime(Math.max(0, currentTime - 60))}?
2. How does this apply to real-world ${skill} projects?
3. What would happen if you tried a different approach?

Take a moment to think through these, then continue watching to see if your understanding is correct!`;
  }
  else {
    response = `I'm here to help with your ${skill} learning! At ${formatTime(currentTime)}, you're making great progress.

Here's how I can assist:
• 🔖 **"Bookmark this"** - Save important moments
• ✂️ **"Save this clip"** - Create clips for review
• 📝 **"Take notes"** - Generate smart notes
• 🧠 **"Quiz me"** - Test your understanding
• 💡 **"Explain this concept"** - Get detailed explanations

What would you like help with?`;
  }
  
  return NextResponse.json({
    success: true,
    response,
    actions,
    timestamp: currentTime,
    source: 'mock_ai',
    context: {
      skill: skill,
      videoTitle: videoContext?.videoTitle
    }
  });
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
