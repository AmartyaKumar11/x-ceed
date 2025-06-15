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
        session_id = request.session_id or "default"
        
        # Try to get session data, but don't fail if not found
        session = session_data.get(session_id, {})
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
                analysis_context += f"**Previous Analysis Summary:** {analysis_excerpt}...\n"
          # Create enhanced context-aware chat prompt
        if session:
            # Full context available
            chat_prompt = f"""
You are an expert career advisor. You have access to a candidate's resume and the job description they're applying for.

**FORMAT YOUR RESPONSE USING MARKDOWN:**
- Use **bold** for important terms and headings
- Use *italics* for emphasis
- Use bullet points with - for lists
- Use numbered lists for step-by-step advice
- Be conversational but professional

**CONTEXT:**
**Job Title:** {session.get('job_title', request.context.get('jobTitle', 'Unknown') if request.context else 'Unknown')}
**Job Description:** {session.get('job_description', 'Not available')}
**Resume Content:** {session.get('resume_text', 'Not available')}

{analysis_context}

**RECENT CONVERSATION:**
{conversation_context}

**CURRENT QUESTION:** {request.question}

Provide a helpful, specific response based on the resume and job description. Reference specific details from both documents when relevant. Format your response with markdown for better readability. If you don't have access to the full resume or job description, acknowledge this and provide general career advice.
"""
        else:
            # Limited context - use what we have
            chat_prompt = f"""
You are an expert career advisor helping a job candidate.

**FORMAT YOUR RESPONSE USING MARKDOWN:**
- Use **bold** for important terms and headings
- Use *italics* for emphasis
- Use bullet points with - for lists
- Use numbered lists for step-by-step advice
- Be conversational but professional

{analysis_context}

**RECENT CONVERSATION:**
{conversation_context}

**CURRENT QUESTION:** {request.question}

Based on the available context, provide helpful career advice formatted with markdown for better readability. If you need more specific information about their resume or the job they're applying for, ask clarifying questions.
"""        # Build messages array with conversation history
        messages = [
            {"role": "system", "content": "You are an expert career advisor helping a job candidate. You provide specific, actionable advice and are conversational but professional. Always format your responses using markdown with **bold** for important terms, *italics* for emphasis, and bullet points for lists."}
        ]
        
        # Add context as a system message if available
        if analysis_context:
            messages.append({
                "role": "system", 
                "content": f"CONTEXT INFORMATION:\n{analysis_context}"
            })
        
        # Add recent conversation history
        if request.conversation_history:
            # Add last few messages to maintain context
            recent_messages = request.conversation_history[-4:]  # Last 4 messages
            for msg in recent_messages:
                if msg.get('role') in ['user', 'assistant']:
                    messages.append({
                        "role": "assistant" if msg.get('role') == 'assistant' else "user",
                        "content": msg.get('content', '')
                    })
        
        # Add current question
        current_question = f"**CURRENT QUESTION:** {request.question}"
        if session:
            current_question += f"\n\n**ADDITIONAL CONTEXT:** I have access to the candidate's resume for the '{session.get('job_title', 'position')}' role. Please provide specific, detailed advice."
        
        messages.append({"role": "user", "content": current_question})
        
        # Get response from Groq
        chat_response = call_groq_api(messages)
        
        return AnalysisResponse(
            success=True,
            data={
                "response": chat_response,
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
    print("🚀 Starting X-ceed Resume Analyzer API (Simplified)...")
    print("📊 API will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print(f"🔑 Groq API configured: {bool(GROQ_API_KEY)}")
    
    uvicorn.run(
        "simplified_rag_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
