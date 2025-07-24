"""
Simplified Working Video AI Service
"""
import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Fix Windows console encoding issues
if sys.platform == "win32":
    import codecs
    import io
    # Use a more robust approach for Windows console
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'buffer'):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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
        
        print(f"[INFO] Sampled {len(sampled)} segments from {len(transcript_data)} total segments")
        return sampled

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
List the main topics discussed in the video with approximate timestamps:
- **Topic 1** (0:00 - X:XX): Brief description
- **Topic 2** (X:XX - X:XX): Brief description
- **Topic 3** (X:XX - X:XX): Brief description

## 📖 Detailed Notes

### 🔥 Main Concepts
For each major concept, provide:
- **Concept Name** (timestamp): Detailed explanation with examples
- **Implementation Details**: Step-by-step breakdown
- **Key Insights**: Important takeaways

### 💡 Important Points
- **Point 1** (timestamp): Explanation
- **Point 2** (timestamp): Explanation
- **Point 3** (timestamp): Explanation

### ⚡ Best Practices & Tips
- Practical advice mentioned in the video
- Common pitfalls to avoid
- Recommended approaches

## 🎯 Summary & Key Takeaways
1. **Main Learning Objective**: 
2. **Practical Applications**:
3. **Next Steps**:

## 📌 Important Timestamps
- **Introduction**: 0:00
- **Key Concept 1**: [timestamp]
- **Key Concept 2**: [timestamp]
- **Conclusion**: [timestamp]

---
*Notes generated from video transcript analysis*

Make the notes comprehensive, educational, and well-organized. Include specific timestamps where possible from the transcript data provided.
"""
        
        notes = await self._generate_ai_response(notes_prompt)
        return notes

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
        video_id = request.get("video_id")
        title = request.get("title", "Unknown Video")
        channel = request.get("channel", "Unknown Channel")
        
        if not video_id:
            raise HTTPException(status_code=400, detail="video_id is required")
        
        # Get video context with transcript
        video_context = await video_ai_service.get_video_context(video_id, title, channel)
        
        # Generate comprehensive notes
        notes = await video_ai_service._generate_notes(video_context)
        
        return {
            "success": True,
            "notes": notes,
            "video_id": video_id,
            "title": title,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error generating notes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate notes: {str(e)}")

@app.post("/suggest-clips")
async def suggest_clips_endpoint(request: dict):
    """Suggest interesting clips from a video"""
    try:
        video_id = request.get("video_id")
        title = request.get("title", "Unknown Video")
        channel = request.get("channel", "Unknown Channel")
        query = request.get("query", "")
        
        if not video_id:
            raise HTTPException(status_code=400, detail="video_id is required")
        
        # Get video context
        video_context = await video_ai_service.get_video_context(video_id, title, channel)
        
        # Generate clip suggestions
        clips = await video_ai_service._suggest_clips(video_context, query)
        
        return {
            "success": True,
            "clips": clips,
            "video_id": video_id,
            "title": title,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error suggesting clips: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to suggest clips: {str(e)}")

@app.get("/video-context/{video_id}")
async def get_video_context_endpoint(video_id: str, title: str = "Unknown Video", channel: str = "Unknown Channel"):
    """Get video context including transcript analysis"""
    try:
        video_context = await video_ai_service.get_video_context(video_id, title, channel)
        
        return {
            "success": True,
            "context": {
                "video_id": video_context.video_id,
                "title": video_context.title,
                "channel": video_context.channel,
                "duration": video_context.duration,
                "transcript_segments": len(video_context.transcript_with_timestamps),
                "description": video_context.description
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting video context: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get video context: {str(e)}")

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
    print("- POST /chat - Main chat interface with video context")
    print("- POST /generate-notes - Generate comprehensive video notes")
    print("- POST /suggest-clips - Suggest interesting video clips")
    print("- GET /video-context/{video_id} - Get video analysis and transcript info")
    print("- GET /health - Health check")
    print(f"🌐 Service will be available at: http://localhost:8002")
    print(f"📚 API Documentation: http://localhost:8002/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8002)
