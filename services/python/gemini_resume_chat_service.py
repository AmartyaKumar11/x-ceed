"""
Gemini-powered FastAPI RAG Service for X-ceed Resume Analysis Chat
Specifically for the resume matching analysis chatbot using Google Gemini AI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
env_file_path = os.path.join(project_root, '.env.local')
print(f"Loading environment variables from: {env_file_path}")
load_dotenv(env_file_path)
load_dotenv()  # Also load from .env as fallback
print(f"Environment variables loaded. GEMINI_API_KEY present: {bool(os.getenv('GEMINI_API_KEY'))}")

# Initialize FastAPI app
app = FastAPI(
    title="X-ceed Resume Analysis Chat API (Gemini)",
    description="Gemini-powered resume analysis chatbot service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API configuration
print(f"Loading environment variables from: {os.path.abspath('../../.env.local')}")
print(f"Environment variables loaded. GEMINI_API_KEY present: {bool(os.getenv('GEMINI_API_KEY'))}")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in environment variables")
    print("Please check your .env.local file in the project root")
    raise ValueError("GEMINI_API_KEY is required")

print(f"Gemini API Key configured: {bool(GEMINI_API_KEY)}")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')  # Updated model name

# Global session storage (in production, use proper session management)
session_data = {}

# Pydantic models
class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"
    conversation_history: Optional[List[Dict]] = []
    context: Optional[Dict] = None

class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None

def call_gemini_api(prompt: str, conversation_history: List[Dict] = None) -> str:
    """Make a call to Gemini API for chat responses"""
    try:
        print(f"[DEBUG] Calling Gemini API with prompt length: {len(prompt)}")
        
        # Build conversation context
        context_parts = []
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                role = "User" if msg.get('role') == 'user' else "Assistant"
                content = msg.get('content', '')
                context_parts.append(f"{role}: {content}")
        
        # Create the full prompt with context
        full_prompt = f"""You are an AI assistant specialized in resume analysis and career guidance. You help job seekers understand how well their resume matches job requirements and provide actionable advice.

{"Previous conversation:" + chr(10) + chr(10).join(context_parts) + chr(10) + chr(10) if context_parts else ""}

Current question: {prompt}

Please provide a helpful, detailed response focused on resume analysis, job matching, and career advice. Be specific and actionable in your recommendations."""

        print(f"[DEBUG] Full prompt length: {len(full_prompt)}")
        
        # Generate response using Gemini
        print("[DEBUG] Calling model.generate_content...")
        response = model.generate_content(full_prompt)
        print(f"[DEBUG] Gemini response received: {type(response)}")
        
        if hasattr(response, 'text') and response.text:
            print(f"[DEBUG] Response text length: {len(response.text)}")
            return response.text
        else:
            print(f"[DEBUG] No text in response. Response: {response}")
            print(f"[DEBUG] Response attributes: {dir(response)}")
            
            # Try to get more info about the response
            if hasattr(response, 'candidates'):
                print(f"[DEBUG] Candidates: {response.candidates}")
            if hasattr(response, 'prompt_feedback'):
                print(f"[DEBUG] Prompt feedback: {response.prompt_feedback}")
                
            return "I apologize, but I'm unable to generate a response at the moment. Please try rephrasing your question or try again later."
        
    except Exception as e:
        print(f"❌ Gemini API error details: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "X-ceed Resume Analysis Chat API (Gemini)",
        "status": "running",
        "gemini_configured": bool(GEMINI_API_KEY),
        "version": "1.0.0"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_with_resume_analyzer(request: ChatRequest):
    """Chat endpoint for resume analysis discussions"""
    try:
        print(f"[DEBUG] Received chat request:")
        print(f"   - Question: '{request.question[:100]}...'")
        print(f"   - Session ID: {request.session_id}")
        print(f"   - Has context: {bool(request.context)}")
        print(f"   - History length: {len(request.conversation_history) if request.conversation_history else 0}")

        # Store session context if provided
        if request.context and request.session_id:
            session_data[request.session_id] = request.context
            print(f"[DEBUG] Stored context for session {request.session_id}")

        # Get session context
        session_context = session_data.get(request.session_id, {})
        
        # Build comprehensive context for resume analysis
        enhanced_question = request.question
        context_info = request.context or session_context
        
        if context_info:
            print(f"[DEBUG] Context available - Job: {context_info.get('jobTitle', 'N/A')}")
            print(f"[DEBUG] Has resume text: {bool(context_info.get('resumeText'))}")
            print(f"[DEBUG] Has job description: {bool(context_info.get('jobDescription'))}")
            
            # Build comprehensive analysis context
            context_parts = []
            
            # Add job information
            if context_info.get('jobTitle'):
                context_parts.append(f"JOB TITLE: {context_info['jobTitle']}")
                
            if context_info.get('jobDescription'):
                job_desc = context_info['jobDescription']
                # Truncate if too long but keep essential info
                if len(job_desc) > 1000:
                    job_desc = job_desc[:1000] + "... [truncated]"
                context_parts.append(f"JOB DESCRIPTION: {job_desc}")
                
            if context_info.get('jobRequirements') and len(context_info['jobRequirements']) > 0:
                requirements = ', '.join(context_info['jobRequirements'][:10])  # Limit to first 10
                context_parts.append(f"JOB REQUIREMENTS: {requirements}")
            
            # Add resume information
            if context_info.get('resumeText'):
                resume_text = context_info['resumeText']
                # Truncate if too long but keep essential info
                if len(resume_text) > 2000:
                    resume_text = resume_text[:2000] + "... [truncated]"
                context_parts.append(f"CANDIDATE'S RESUME CONTENT: {resume_text}")
            elif context_info.get('resumePath'):
                context_parts.append(f"RESUME PATH: {context_info['resumePath']}")
            
            # Add previous analysis if available
            if context_info.get('analysisResult'):
                analysis = context_info['analysisResult']
                if len(analysis) > 800:
                    analysis = analysis[:800] + "... [truncated]"
                context_parts.append(f"PREVIOUS ANALYSIS: {analysis}")
                
            if context_info.get('structuredAnalysis'):
                struct_analysis = context_info['structuredAnalysis']
                if isinstance(struct_analysis, dict):
                    # Extract key metrics
                    if struct_analysis.get('overallMatch'):
                        match_info = struct_analysis['overallMatch']
                        context_parts.append(f"MATCH SCORE: {match_info.get('score', 'N/A')}% - {match_info.get('level', 'N/A')}")
                
            if context_parts:
                enhanced_question = f"""RESUME ANALYSIS CONTEXT:
{chr(10).join(context_parts)}

USER QUESTION: {request.question}

Please provide a detailed, helpful response based on the resume and job information provided above. Focus on specific, actionable advice for improving the resume-job match."""

        # Generate response using Gemini
        response_text = call_gemini_api(enhanced_question, request.conversation_history)
        
        print(f"[DEBUG] Generated response length: {len(response_text)} characters")
        
        return ChatResponse(
            success=True,
            response=response_text
        )

    except Exception as e:
        print(f"❌ Chat error: {e}")
        return ChatResponse(
            success=False,
            error=f"Failed to generate response: {str(e)}"
        )

@app.post("/analyze")
async def analyze_resume(request: dict):
    """Analysis endpoint - delegates to existing analysis logic or provides basic analysis"""
    try:
        print(f"[DEBUG] Received analysis request")
        
        # For now, return a message directing to the proper analysis service
        # In the future, this could integrate with the AI resume analyzer
        return {
            "success": True,
            "message": "Analysis functionality is handled by the main resume analysis system. This service focuses on chat interactions.",
            "data": {
                "analysis_status": "delegated",
                "chat_available": True
            }
        }
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return {
            "success": False,
            "error": f"Analysis error: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    print("Starting Gemini Resume Chat Service...")
    print(f"Gemini API Key configured: {bool(GEMINI_API_KEY)}")
    uvicorn.run(app, host="0.0.0.0", port=8003)
