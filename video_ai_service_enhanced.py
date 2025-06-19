"""
Simplified Working Video AI Service
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Load environment variables
def load_env_file():
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env_file()

# Core imports
import google.generativeai as genai
from youtube_transcript_api import YouTubeTranscriptApi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

@dataclass
class VideoContext:
    video_id: str
    title: str
    channel: str
    transcript: str
    transcript_with_timestamps: List[Dict[str, Any]]
    duration: int
    description: str

class ChatRequest(BaseModel):
    message: str
    video_id: str
    video_title: str
    video_channel: str
    conversation_history: List[Dict[str, Any]]

class ChatResponse(BaseModel):
    success: bool
    response: str
    actions: List[Dict[str, Any]]
    clips: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

class VideoAIService:
    def __init__(self):
        # Initialize Gemini AI
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Video context cache
        self.video_contexts: Dict[str, VideoContext] = {}
        print("✅ Video AI Service initialized successfully")

    async def get_video_context(self, video_id: str, title: str = "", channel: str = "") -> VideoContext:
        """Get comprehensive video context including transcript and metadata"""
        if video_id in self.video_contexts:
            return self.video_contexts[video_id]
        
        try:
            # Get transcript with timestamps
            transcript_data = self._get_video_transcript(video_id)
            transcript_text = ' '.join([item['text'] for item in transcript_data])
            
            context = VideoContext(
                video_id=video_id,
                title=title,
                channel=channel,
                transcript=transcript_text,
                transcript_with_timestamps=transcript_data,
                duration=len(transcript_data) * 5,  # Rough estimate
                description=""
            )
            
            self.video_contexts[video_id] = context
            return context
            
        except Exception as e:
            print(f"Error getting video context: {e}")
            raise

    def _get_video_transcript(self, video_id: str) -> List[Dict[str, Any]]:
        """Get video transcript with timestamps"""
        print(f"🔍 Fetching transcript for video: {video_id}")
        
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id)
            print(f"✅ Found transcript with {len(transcript_data)} segments")
            return transcript_data
        except Exception as e:
            print(f"❌ Transcript fetch failed: {e}")
            return [{"text": "Transcript not available for this video.", "start": 0, "duration": 0}]

    async def _generate_ai_response(self, prompt: str) -> str:
        """Generate AI response using Gemini"""
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "I'm sorry, I couldn't generate a response at the moment."

    def _sample_transcript_for_notes(self, transcript_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sample transcript intelligently for notes generation"""
        if len(transcript_data) <= 100:
            return transcript_data
        
        # For large transcripts, take samples from different parts
        sample_size = min(100, len(transcript_data))
        step = len(transcript_data) // sample_size
        
        sampled = []
        for i in range(0, len(transcript_data), step):
            if len(sampled) >= sample_size:
                break
            sampled.append(transcript_data[i])
        
        print(f"📊 Sampled {len(sampled)} segments from {len(transcript_data)} total segments")
        return sampled

    async def _generate_notes(self, video_context: VideoContext) -> str:
        """Generate structured notes from video content with timestamps"""
          # Sample the transcript intelligently for large videos
        transcript_sample = self._sample_transcript_for_notes(
            video_context.transcript_with_timestamps
        )
        
        transcript_with_times = self._format_transcript_for_analysis(transcript_sample)
        total_segments = len(video_context.transcript_with_timestamps)
        sample_segments = len(transcript_sample)
        
        notes_prompt = f"""
Create comprehensive, detailed study notes for this video with specific timestamps.

Title: {video_context.title}
Channel: {video_context.channel}
Total transcript segments: {total_segments} (analyzing sample of {sample_segments} key segments)

Key transcript segments with timestamps:
{transcript_with_times}

Generate detailed study notes in **PROPER MARKDOWN FORMAT** with the following structure:

# 📚 {video_context.title}

## 🎯 Overview
Write a comprehensive 2-3 sentence summary of the video content and learning objectives.

## 📋 Key Topics Covered
- **Topic 1 Name** - Starting at [X:XX]
- **Topic 2 Name** - Starting at [X:XX]  
- **Topic 3 Name** - Starting at [X:XX]
- *(Continue for all major topics)*

## 📝 Detailed Notes

### 🔸 Topic 1: [Topic Name]
**⏰ Starts at:** [X:XX]

- **🎯 Key Point 1** `[timestamp]`  
  Detailed explanation of the concept with clear formatting
  
- **💡 Key Point 2** `[timestamp]`  
  Another important concept with proper explanation
  
- **📖 Important Quote** `[timestamp]`  
  > "*Direct quote from the video in italics*"

---

### 🔸 Topic 2: [Topic Name]  
**⏰ Starts at:** [X:XX]

- **🎯 Key Point 1** `[timestamp]`  
  Detailed explanation with proper formatting
  
- **💡 Key Point 2** `[timestamp]`  
  Another key concept explained clearly

---

*(Continue this pattern for all major topics)*

## 🔍 Important Concepts & Definitions

| Term | Timestamp | Definition |
|------|-----------|------------|
| **[Term 1]** | `[X:XX]` | Clear definition and explanation |
| **[Term 2]** | `[X:XX]` | Clear definition and explanation |

## ⭐ Key Takeaways

1. **Main Takeaway 1** `[timestamp]`  
   Clear explanation of the first key learning point

2. **Main Takeaway 2** `[timestamp]`  
   Clear explanation of the second key learning point

3. **Main Takeaway 3** `[timestamp]`  
   Clear explanation of the third key learning point

## 🚀 Practical Applications

**Real-world scenarios where this knowledge applies:**
- Application scenario 1
- Application scenario 2
- Application scenario 3

## 📊 Summary

Write a comprehensive 3-4 sentence summary that captures the essence of the entire video and its main learning objectives.

## ⚡ Quick Reference

**Key Timestamps:**
- `[X:XX]` - Important moment 1
- `[X:XX]` - Important moment 2  
- `[X:XX]` - Important moment 3

---

**FORMATTING REQUIREMENTS:**
- Use proper markdown headers (# ## ###)
- Use **bold** for emphasis
- Use `code blocks` for timestamps
- Use > blockquotes for direct quotes
- Use tables for definitions when appropriate
- Use bullet points with proper spacing
- Use emojis for visual appeal and section identification
- Use horizontal rules --- to separate major sections
- Ensure consistent spacing and formatting throughout

Make the notes extremely detailed, educational, and visually appealing with proper markdown formatting.
"""
        
        notes = await self._generate_ai_response(notes_prompt)
        return notes

    def _format_transcript_for_analysis(self, transcript_data: List[Dict[str, Any]]) -> str:
        """Format transcript data for AI analysis"""
        formatted = []
        for item in transcript_data:
            try:
                # Handle both dict and object formats
                if hasattr(item, 'start'):
                    start_time = int(item.start)
                    text = item.text.strip()
                else:
                    start_time = int(item['start'])
                    text = item['text'].strip()
                formatted.append(f"[{start_time}s] {text}")
            except Exception as e:
                print(f"Error formatting transcript item: {e}")
                continue
        return '\n'.join(formatted)

    async def _suggest_clips(self, video_context: VideoContext, query: str = "") -> List[Dict[str, Any]]:
        """Suggest interesting clips with timestamps"""
        
        clips = []
        transcript_data = video_context.transcript_with_timestamps
        
        if not transcript_data or len(transcript_data) < 2:
            return clips
        
        # Create clips every 2-3 minutes or based on content
        clip_duration = 120  # 2 minutes
        current_start = 0
        
        for i in range(0, len(transcript_data), 10):  # Sample every 10 segments
            if i + 10 < len(transcript_data):
                start_time = int(transcript_data[i]['start'])
                end_time = int(transcript_data[i + 10]['start'])
                
                # Get text for this segment
                segment_texts = [transcript_data[j]['text'] for j in range(i, min(i + 10, len(transcript_data)))]
                segment_text = ' '.join(segment_texts)
                
                clips.append({
                    "title": f"Segment {len(clips) + 1}: {segment_text[:50]}...",
                    "start_time": start_time,
                    "end_time": end_time,
                    "description": segment_text[:100] + "..." if len(segment_text) > 100 else segment_text,
                    "value": "Educational content segment"
                })
                
                if len(clips) >= 6:  # Limit to 6 clips
                    break
        
        return clips

    async def process_chat_message(self, request: ChatRequest) -> ChatResponse:
        """Process chat message with video context"""
        try:
            # Get or create video context
            video_context = await self.get_video_context(
                request.video_id, 
                request.video_title, 
                request.video_channel
            )
            
            # Build conversation context
            conversation_context = ""
            if request.conversation_history:
                recent_messages = request.conversation_history[-3:]  # Last 3 messages
                for msg in recent_messages:
                    role = "User" if msg.get('type') == 'user' else "Assistant"
                    conversation_context += f"{role}: {msg.get('content', '')}\n"
            
            # Create contextual prompt
            contextual_prompt = f"""
            You are an AI assistant helping users understand and analyze this YouTube video:
            
            Video: {video_context.title}
            Channel: {video_context.channel}
            
            You have access to the full video transcript and can provide:
            1. Answers about video content
            2. Generated notes and summaries
            3. Suggested video clips with timestamps
            
            Recent conversation:
            {conversation_context}
            
            Current user message: {request.message}
            
            Video transcript: {video_context.transcript[:2000]}...
            
            Provide a helpful, detailed response based on the video content.
            """
            
            # Generate AI response
            ai_response = await self._generate_ai_response(contextual_prompt)
            
            # Detect what actions the user wants
            actions = self._detect_user_actions(request.message)
            
            # Generate additional content if requested
            clips = None
            notes = None
            
            if any(action['type'] in ['clips', 'clip'] for action in actions):
                clips = await self._suggest_clips(video_context, request.message)
            
            if any(action['type'] in ['notes', 'note'] for action in actions):
                notes = await self._generate_notes(video_context)
            
            return ChatResponse(
                success=True,
                response=ai_response,
                actions=actions,
                clips=clips,
                notes=notes
            )
            
        except Exception as e:
            print(f"Error processing chat message: {e}")
            return ChatResponse(
                success=False,
                response=f"I'm sorry, I encountered an error while processing your request. Please try again.",
                actions=[]
            )

    def _detect_user_actions(self, message: str) -> List[Dict[str, Any]]:
        """Detect what actions the user wants to perform"""
        actions = []
        message_lower = message.lower()
        
        # Detect note-taking requests
        if any(word in message_lower for word in ['notes', 'note', 'summary', 'summarize']):
            actions.append({
                'type': 'notes',
                'text': 'Generate Notes',
                'description': 'Create structured notes from this video'
            })
        
        # Detect clipping requests
        if any(word in message_lower for word in ['clip', 'clips', 'segment', 'timestamp']):
            actions.append({
                'type': 'clips',
                'text': 'Suggest Clips',
                'description': 'Find interesting video segments'
            })
        
        return actions

# FastAPI app
app = FastAPI(title="Video AI Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
video_ai_service = VideoAIService()

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint with video context"""
    return await video_ai_service.process_chat_message(request)

@app.post("/generate-notes")
async def generate_notes_endpoint(request: dict):
    """Generate detailed notes for a video"""
    try:
        video_id = request.get('video_id')
        title = request.get('title', '')
        channel = request.get('channel', '')
        
        context = await video_ai_service.get_video_context(video_id, title, channel)
        notes = await video_ai_service._generate_notes(context)
        
        return {
            "success": True,
            "notes": notes,
            "video_title": context.title,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    print("🎬 Starting Video AI Service...")
    print("Available endpoints:")
    print("- POST /chat - Main chat interface")
    print("- POST /generate-notes - Generate notes for a video")
    print("- GET /health - Health check")
    
    uvicorn.run(app, host="0.0.0.0", port=8005)
