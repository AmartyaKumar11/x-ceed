"""
Simplified FastAPI RAG Service for X-ceed Resume Analysis
Uses direct Groq API calls instead of complex LangChain setup
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="X-ceed Resume Analyzer API",
    description="Simplified RAG-powered resume analysis service",
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

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Global session storage (in production, use proper session management)
session_data = {}

# Pydantic models
class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    job_title: str
    job_requirements: Optional[list] = []

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"
    conversation_history: Optional[list] = []
    context: Optional[dict] = None

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

def call_groq_api(messages, model="llama-3.1-8b-instant", temperature=0.1):
    """Make a direct call to Groq API"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 4000
    }
    
    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "X-ceed Resume Analyzer API (Simplified)",
        "status": "running",
        "groq_configured": bool(GROQ_API_KEY),
        "version": "1.0.0"
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(request: AnalysisRequest):
    """Analyze resume against job description"""
    try:
        # Debug: Print received data
        print(f"[DEBUG] Received analysis request:")
        print(f"   - Job Title: '{request.job_title}'")
        print(f"   - Job Description Length: {len(request.job_description)} chars")
        print(f"   - Job Description (first 200 chars): '{request.job_description[:200]}...'")
        print(f"   - Job Requirements: {request.job_requirements}")
        print(f"   - Resume Text Length: {len(request.resume_text)} chars")
        print(f"   - Resume Text (first 100 chars): '{request.resume_text[:100]}...'")
        
        # Store session data
        session_id = "default"
        session_data[session_id] = {
            "resume_text": request.resume_text,
            "job_description": request.job_description,
            "job_title": request.job_title,
            "job_requirements": request.job_requirements
        }        # Create structured analysis prompt that returns JSON data
        analysis_prompt = f"""
You are an expert HR professional and career advisor. Analyze this resume against the job description and provide a comprehensive assessment.

**IMPORTANT ANALYSIS GUIDELINES:**
- Recognize technology synonyms and variations (e.g., React = React.js, JS = JavaScript, Node = Node.js, etc.)
- Don't penalize candidates for minor naming differences in technologies
- Focus on actual skill gaps, not semantic differences
- Be fair and accurate in skill matching

**SKILL MATCHING RULES:**
- React.js = React = ReactJS (same technology)
- JavaScript = JS = ECMAScript
- Node.js = Node = NodeJS
- TypeScript = TS
- HTML5 = HTML
- CSS3 = CSS
- PostgreSQL = Postgres
- MongoDB = Mongo
- And similar common variations

**JOB INFORMATION:**
**Title:** {request.job_title}
**Description:** {request.job_description}
**Requirements:** {', '.join(request.job_requirements)}

**RESUME CONTENT:**
{request.resume_text}

Analyze the resume and respond with a JSON object in this exact format:

{{
  "overallMatch": {{
    "score": [0-100 number],
    "level": "[Excellent/Good/Fair/Poor]",
    "summary": "[Brief 2-3 sentence summary of match quality]"
  }},
  "keyStrengths": [
    "[Strength 1 with evidence from resume]",
    "[Strength 2 with evidence from resume]",
    "[Strength 3 with evidence from resume]",
    "[Strength 4 with evidence from resume]"
  ],
  "matchingSkills": [
    "[Skill that appears in both resume and job description]",
    "[Another matching skill]"
  ],
  "missingSkills": [
    "[Critical skill mentioned in job but missing from resume]",
    "[Another missing skill]"
  ],
  "experienceAnalysis": {{
    "relevantExperience": "[Years and specific roles that match]",
    "experienceGaps": "[What experience is missing or weak]"
  }},
  "improvementSuggestions": [
    "[Specific actionable suggestion 1]",
    "[Specific actionable suggestion 2]",
    "[Specific actionable suggestion 3]",
    "[Specific actionable suggestion 4]"
  ],
  "competitiveAdvantages": [
    "[What makes this candidate stand out]",
    "[Another advantage]"
  ],
  "interviewPreparation": {{
    "strengthsToHighlight": [
      "[Key point to emphasize]",
      "[Another strength to highlight]"
    ],
    "areasToAddress": [
      "[Potential weakness to prepare for]",
      "[Another area to address]"
    ]
  }}
}}

Return ONLY the JSON object, no other text or formatting.
"""

        messages = [
            {"role": "system", "content": "You are an expert HR professional and career advisor specializing in resume analysis and job matching. You must respond with valid JSON only."},
            {"role": "user", "content": analysis_prompt}
        ]
        
        # Get analysis from Groq
        analysis_result = call_groq_api(messages)
        
        # Try to parse the JSON response
        try:
            import json
            structured_analysis = json.loads(analysis_result)
            
            return AnalysisResponse(
                success=True,
                data={
                    "analysis": {
                        "structuredAnalysis": structured_analysis,
                        "timestamp": "2025-06-15T18:00:00.000Z",
                        "model": "llama-3.1-8b-instant",
                        "ragEnabled": True
                    },
                    "metadata": {
                        "analyzedAt": "2025-06-15T18:00:00.000Z",
                        "jobTitle": request.job_title,
                        "model": "llama-3.1-8b-instant",
                        "ragEnabled": True
                    }
                }
            )
        except json.JSONDecodeError:
            # Fallback to original text format if JSON parsing fails
            return AnalysisResponse(
                success=True,
                data={                    "analysis": {
                        "comprehensiveAnalysis": analysis_result,
                        "timestamp": "2025-06-15T18:00:00.000Z",
                        "model": "llama-3.1-8b-instant",
                        "ragEnabled": True
                    },
                    "metadata": {
                        "analyzedAt": "2025-06-15T18:00:00.000Z",
                        "jobTitle": request.job_title,
                        "model": "llama-3.1-8b-instant",
                        "ragEnabled": True
                    }
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/chat", response_model=AnalysisResponse)
async def chat_with_resume(request: ChatRequest):
    """Chat about the resume and job description"""
    try:
        print(f"💬 Received chat request:")
        print(f"   - Question: '{request.question}'")
        print(f"   - Session ID: '{request.session_id}'")
        print(f"   - Context available: {request.context is not None}")
        print(f"   - Conversation history length: {len(request.conversation_history) if request.conversation_history else 0}")
        
        if request.context:
            print(f"   - Context job title: {request.context.get('jobTitle', 'N/A')}")
            print(f"   - Context has job description: {bool(request.context.get('jobDescription'))}")
            print(f"   - Context has analysis result: {bool(request.context.get('analysisResult'))}")
        
        session_id = request.session_id or "default"
        
        # Try to get session data, but don't fail if not found
        session = session_data.get(session_id, {})
        print(f"   - Session data available: {bool(session)}")
        if session:
            print(f"   - Session job title: {session.get('job_title', 'N/A')}")
            print(f"   - Session has job description: {bool(session.get('job_description'))}")
            print(f"   - Session has resume text: {bool(session.get('resume_text'))}")
          # Build conversation context with better memory
        conversation_context = ""
        if request.conversation_history:
            # Use last 6 messages for better context (3 exchanges)
            recent_messages = request.conversation_history[-6:]
            for i, msg in enumerate(recent_messages):
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                # Don't truncate the most recent messages as much
                if i >= len(recent_messages) - 2:  # Last 2 messages
                    content = content[:500] if len(content) > 500 else content
                else:
                    content = content[:200] if len(content) > 200 else content
                conversation_context += f"**{role.capitalize()}:** {content}\n\n"
        
        # Build enhanced analysis context
        analysis_context = ""
        if request.context:
            job_title = request.context.get('jobTitle', '')
            job_description = request.context.get('jobDescription', '')
            analysis_result = request.context.get('analysisResult', '')
            
            if job_title:
                analysis_context += f"**Current Job Application:** {job_title}\n"
            if job_description:
                # Include more job description context
                job_desc_excerpt = job_description[:400] if len(job_description) > 400 else job_description
                analysis_context += f"**Job Description:** {job_desc_excerpt}...\n"
            if analysis_result:
                # Include more analysis context
                analysis_excerpt = analysis_result[:500] if len(analysis_result) > 500 else analysis_result
                analysis_context += f"**Previous Analysis Summary:** {analysis_excerpt}...\n"          # Create natural conversational prompt for Groq
        # Build the conversation messages for Groq API
        messages = [
            {
                "role": "system", 
                "content": f"""You are a helpful and friendly AI career assistant. You have access to information about a job application and resume analysis.

CONTEXT INFORMATION:
- Job Title: {session.get('job_title', request.context.get('jobTitle', 'Unknown') if request.context else 'Unknown')}
- You have analyzed the candidate's resume against this job posting
- You can provide career advice, interview tips, and resume feedback when asked

CONVERSATION STYLE:
- Be natural and conversational
- Respond to greetings naturally (hi, hello, thanks, etc.)
- Only provide detailed analysis when specifically asked
- Ask follow-up questions to understand what the user needs
- Be supportive and encouraging
- Use the candidate's name if mentioned in the resume

Remember: You're having a conversation, not giving a lecture. Let the user guide what they want to discuss."""
            }
        ]
        
        # Add recent conversation history for context
        if request.conversation_history:
            # Add the last few messages to maintain conversation flow
            recent_messages = request.conversation_history[-6:]  # Last 6 messages for context
            for msg in recent_messages:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                if role in ['user', 'assistant'] and content:
                    messages.append({
                        "role": role,
                        "content": content
                    })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": request.question
        })        
        # Call Groq API for natural conversation
        chat_response = call_groq_api(messages, temperature=0.7)  # Higher temperature for more natural responses
        
        return AnalysisResponse(
            success=True,
            data={                "response": chat_response,
                "sources": [],
                "timestamp": "2025-06-15T18:00:00.000Z"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/quick-analysis/{analysis_type}")
async def quick_analysis(analysis_type: str):
    """Get quick analysis results"""
    try:
        session_id = "default"
        
        if session_id not in session_data:
            raise HTTPException(status_code=400, detail="No analysis session found. Please analyze first.")
        
        session = session_data[session_id]
        
        questions = {
            "match": "Provide a detailed analysis of how well my resume matches the job requirements. Give me a percentage match and explain the key alignments and gaps.",
            "skills": "What skills and qualifications mentioned in the job description are missing from my resume? Provide specific recommendations.",
            "improvements": "Give me 5 specific suggestions to improve my resume for this job, including keywords I should add and sections I should enhance."
        }
        
        if analysis_type not in questions:
            raise HTTPException(status_code=400, detail=f"Invalid analysis type. Use one of: {list(questions.keys())}")
        
        # Create quick analysis prompt
        prompt = f"""
You are an expert career advisor. Analyze this resume against the job description.

Job Title: {session['job_title']}
Job Description: {session['job_description']}
Resume: {session['resume_text']}

Question: {questions[analysis_type]}

Provide a focused, actionable response.
"""

        messages = [
            {"role": "system", "content": "You are an expert career advisor specializing in resume analysis."},
            {"role": "user", "content": prompt}
        ]
        
        # Get response from Groq
        analysis_result = call_groq_api(messages)
        
        return AnalysisResponse(
            success=True,
            data={
                "analysis": analysis_result,
                "type": analysis_type,
                "timestamp": "2025-06-15T18:00:00.000Z"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick analysis failed: {str(e)}")

@app.get("/status")
async def get_status():
    """Get service status"""
    return {
        "ready": bool(GROQ_API_KEY),
        "active_sessions": len(session_data),
        "groq_configured": bool(GROQ_API_KEY)
    }

@app.post("/clear-session")
async def clear_session():
    """Clear analysis session"""
    try:
        session_data.clear()
        return AnalysisResponse(
            success=True,
            data={"message": "Session cleared successfully"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear session: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting X-ceed Resume Analyzer API (Simplified)...")
    print("API will be available at: http://localhost:8000")
    print("API docs will be available at: http://localhost:8000/docs")
    print(f"Groq API configured: {bool(GROQ_API_KEY)}")
    
    uvicorn.run(
        "simplified_rag_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
