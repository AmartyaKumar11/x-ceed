"""
Simplified Video AI Service - Clean, working version
"""
import os
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Core imports
import google.generativeai as genai
from youtube_transcript_api import YouTubeTranscriptApi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Optional Google APIs
try:
    from googleapiclient.discovery import build
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False

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
        self.gemini_model = genai.GenerativeModel('gemini-pro')
        
        # Optional YouTube API
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        if self.youtube_api_key and GOOGLE_API_AVAILABLE:
            try:
                self.youtube_service = build('youtube', 'v3', developerKey=self.youtube_api_key)
            except Exception as e:
                print(f"YouTube API setup failed: {e}")
                self.youtube_service = None
        else:
            self.youtube_service = None
        
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
            
            # Get video metadata if available
            video_title = title
            video_channel = channel
            description = ""
            duration = 0
            
            if self.youtube_service:
                try:
                    video_response = self.youtube_service.videos().list(
                        id=video_id,
                        part='snippet,contentDetails'
                    ).execute()
                    
                    if video_response['items']:
                        video_info = video_response['items'][0]
                        snippet = video_info['snippet']
                        video_title = snippet['title']
                        video_channel = snippet['channelTitle']
                        description = snippet.get('description', '')
                        duration = self._parse_duration(video_info['contentDetails']['duration'])
                except Exception as e:
                    print(f"Error getting video metadata: {e}")
            
            context = VideoContext(
                video_id=video_id,
                title=video_title,
                channel=video_channel,
                transcript=transcript_text,
                transcript_with_timestamps=transcript_data,
                duration=duration,
                description=description
            )
            
            self.video_contexts[video_id] = context
            return context
            
        except Exception as e:
            print(f"Error getting video context: {e}")
            raise

    def _get_video_transcript(self, video_id: str) -> List[Dict[str, Any]]:
        """Get video transcript with timestamps"""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            return transcript_list
        except Exception as e:
            print(f"Error getting transcript: {e}")
            return [{"text": "Transcript not available", "start": 0, "duration": 0}]

    def _parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to seconds"""
        import re
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)
        if match:
            hours = int(match.group(1) or 0)
            minutes = int(match.group(2) or 0)
            seconds = int(match.group(3) or 0)
            return hours * 3600 + minutes * 60 + seconds
        return 0

    async def _generate_ai_response(self, prompt: str) -> str:
        """Generate AI response using Gemini"""
        try:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "I'm sorry, I encountered an error. Please try again."

    async def _generate_notes(self, video_context: VideoContext) -> str:
        """Generate structured notes from video content"""
        notes_prompt = f"""
Create comprehensive study notes for this video:

Title: {video_context.title}
Channel: {video_context.channel}
Duration: {video_context.duration // 60} minutes

Based on this transcript: {video_context.transcript[:3000]}...

Generate well-structured notes in markdown format:

# {video_context.title}

## Overview
[Brief summary of the video]

## Key Points
1. [Main point 1]
2. [Main point 2] 
3. [Main point 3]

## Important Concepts
- [Concept 1]: [explanation]
- [Concept 2]: [explanation]

## Practical Applications
[How to apply this knowledge]

## Summary
[Key takeaways and conclusion]

Make the notes detailed, educational, and well-organized.
"""
        
        notes = await self._generate_ai_response(notes_prompt)
        return notes

    async def _suggest_clips(self, video_context: VideoContext, query: str = "") -> List[Dict[str, Any]]:
        """Suggest interesting clips with timestamps"""
        if not video_context.transcript_with_timestamps or len(video_context.transcript_with_timestamps) < 2:
            return []
        
        transcript_sample = self._format_transcript_for_analysis(
            video_context.transcript_with_timestamps[:30]
        )
        
        clip_prompt = f"""
Analyze this video transcript and suggest 5-6 interesting clips that would be valuable to save.

Video: {video_context.title}

Transcript with timestamps:
{transcript_sample}

For each clip, provide:
- A descriptive title
- Start time (in seconds)
- End time (in seconds)
- Why this segment is valuable

Respond in JSON format:
[
  {{
    "title": "Introduction to Key Concept",
    "start_time": 45,
    "end_time": 120,
    "description": "Clear explanation of the main concept",
    "value": "Essential foundational knowledge"
  }}
]
"""
        
        try:
            clips_response = await self._generate_ai_response(clip_prompt)
            
            # Extract JSON from response
            import re
            json_match = re.search(r'\[.*\]', clips_response, re.DOTALL)
            if json_match:
                clips_json = json_match.group(0)
                clips = json.loads(clips_json)
                return clips[:6]
            
        except Exception as e:
            print(f"Error generating clips: {e}")
        
        # Fallback: create simple clips
        return self._create_default_clips(video_context.transcript_with_timestamps)

    def _format_transcript_for_analysis(self, transcript_data: List[Dict[str, Any]]) -> str:
        """Format transcript data for AI analysis"""
        formatted = []
        for item in transcript_data:
            start_time = int(item['start'])
            text = item['text'].strip()
            formatted.append(f"[{start_time}s] {text}")
        return '\n'.join(formatted)

    def _create_default_clips(self, transcript_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create default clips when AI analysis fails"""
        clips = []
        
        # Create clips every 2 minutes
        current_start = 0
        segment_texts = []
        
        for i, item in enumerate(transcript_data):
            segment_texts.append(item['text'])
            
            if (item['start'] - current_start > 120) or i == len(transcript_data) - 1:
                if segment_texts:
                    segment_text = ' '.join(segment_texts)
                    
                    clips.append({
                        "title": f"Segment {len(clips) + 1}",
                        "start_time": int(current_start),
                        "end_time": int(item['start'] + item.get('duration', 5)),
                        "description": segment_text[:100] + "..." if len(segment_text) > 100 else segment_text,
                        "value": "Educational segment"
                    })
                    
                    current_start = item['start']
                    segment_texts = []
        
        return clips[:6]

    async def process_chat_message(self, request: ChatRequest) -> ChatResponse:
        """Process chat message with video context"""
        try:
            # Get video context
            video_context = await self.get_video_context(
                request.video_id, 
                request.video_title, 
                request.video_channel
            )
            
            # Build conversation context
            conversation_context = ""
            if request.conversation_history:
                recent_messages = request.conversation_history[-5:]
                for msg in recent_messages:
                    role = "User" if msg.get('type') == 'user' else "Assistant"
                    conversation_context += f"{role}: {msg.get('content', '')}\n"
            
            # Create contextual prompt
            contextual_prompt = f"""
You are an AI assistant helping users understand and analyze this YouTube video:

Video: {video_context.title}
Channel: {video_context.channel}
Duration: {video_context.duration // 60} minutes

You can provide:
1. Answers about video content
2. Generated notes and summaries
3. Suggested video clips with timestamps
4. Content analysis and insights

Recent conversation:
{conversation_context}

Current user message: {request.message}

Video transcript (first 2000 chars): {video_context.transcript[:2000]}...

Provide a helpful, detailed response based on the video content.
"""
            
            # Generate AI response
            ai_response = await self._generate_ai_response(contextual_prompt)
            
            # Detect actions
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
                response="I'm sorry, I encountered an error. Please try again.",
                actions=[]
            )

    def _detect_user_actions(self, message: str) -> List[Dict[str, Any]]:
        """Detect what actions the user wants to perform"""
        actions = []
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['notes', 'note', 'summary', 'summarize']):
            actions.append({
                'type': 'notes',
                'text': 'Generate Notes',
                'description': 'Create structured notes from this video'
            })
        
        if any(word in message_lower for word in ['clip', 'clips', 'segment', 'timestamp']):
            actions.append({
                'type': 'clips',
                'text': 'Suggest Clips',
                'description': 'Find interesting video segments'
            })
        
        if any(word in message_lower for word in ['analyze', 'analysis', 'explain']):
            actions.append({
                'type': 'analysis',
                'text': 'Analyze Content',
                'description': 'Provide detailed content analysis'
            })
        
        return actions

# FastAPI app
app = FastAPI(title="Video AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service only when running as main
if __name__ == "__main__":
    video_ai_service = VideoAIService()
else:
    # Delay initialization when imported as module
    video_ai_service = None

@app.on_event("startup")
async def startup_event():
    global video_ai_service
    if video_ai_service is None:
        video_ai_service = VideoAIService()

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint with video context"""
    return await video_ai_service.process_chat_message(request)

@app.get("/video-context/{video_id}")
async def get_video_context_endpoint(video_id: str, title: str = "", channel: str = ""):
    """Get video context and basic info"""
    try:
        context = await video_ai_service.get_video_context(video_id, title, channel)
        return {
            "success": True,
            "context": {
                "video_id": context.video_id,
                "title": context.title,
                "channel": context.channel,
                "duration": context.duration,
                "has_transcript": len(context.transcript) > 50,
                "transcript_length": len(context.transcript)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/suggest-clips")
async def suggest_clips_endpoint(request: dict):
    """Suggest interesting clips from a video"""
    try:
        video_id = request.get('video_id')
        title = request.get('title', '')
        channel = request.get('channel', '')
        query = request.get('query', '')
        
        context = await video_ai_service.get_video_context(video_id, title, channel)
        clips = await video_ai_service._suggest_clips(context, query)
        
        return {
            "success": True,
            "clips": clips,
            "video_title": context.title,
            "total_clips": len(clips)
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
    print("- GET /video-context/{video_id} - Get video analysis")
    print("- POST /generate-notes - Generate video notes")
    print("- POST /suggest-clips - Get video clips")
    print("- GET /health - Health check")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
