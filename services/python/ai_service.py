"""
AI Resume Analysis Service API
FastAPI service for analyzing resumes and ranking candidates
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from datetime import datetime
import json
import logging
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Import our AI analyzer
from ai_resume_analyzer import AIResumeAnalyzer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Resume Analysis Service", version="1.0.0")

# Initialize AI analyzer
try:
    ai_analyzer = AIResumeAnalyzer()
    logger.info("✅ AI Resume Analyzer initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize AI analyzer: {e}")
    ai_analyzer = None

# Pydantic models for request/response
class JobData(BaseModel):
    id: str
    title: str
    department: str
    level: str
    description: str
    jobDescriptionText: str
    requirements: List[str] = []

class CandidateData(BaseModel):
    _id: str
    applicantId: str
    applicantName: str
    applicantEmail: str
    skills: List[str] = []
    experience: str = ""
    education: str = ""
    coverLetter: str = ""
    resumeUrl: str = ""
    appliedAt: Optional[datetime] = None
    status: str = "pending"

class AnalysisRequest(BaseModel):
    job: JobData
    candidates: List[CandidateData]

class CandidateScore(BaseModel):
    candidate_id: str
    candidate_name: str
    overall_score: float
    skill_match_score: float
    experience_score: float
    education_score: float
    criteria_analysis: Dict[str, Any]
    strengths: List[str]
    weaknesses: List[str]
    recommendation: str

class AnalysisResponse(BaseModel):
    success: bool
    shortlist: List[CandidateScore]
    criteria: List[str]
    analysis_metadata: Dict[str, Any]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Resume Analysis Service",
        "version": "1.0.0",
        "ai_analyzer_status": "available" if ai_analyzer else "unavailable"
    }

@app.post("/analyze-candidates", response_model=AnalysisResponse)
async def analyze_candidates(request: AnalysisRequest):
    """
    Analyze candidates for a job position using AI
    """
    try:
        if not ai_analyzer:
            raise HTTPException(status_code=503, detail="AI analyzer not available")
        
        logger.info(f"🔍 Starting AI analysis for job: {request.job.title}")
        logger.info(f"📊 Analyzing {len(request.candidates)} candidates")
        
        # Convert request data to dict format for analyzer
        job_data = request.job.dict()
        candidates_data = [candidate.dict() for candidate in request.candidates]
        
        # Perform AI analysis
        shortlisted_candidates = ai_analyzer.shortlist_candidates(job_data, candidates_data)
        
        # Convert results to response format
        shortlist = []
        for candidate in shortlisted_candidates:
            shortlist.append({
                "candidate_id": candidate.candidate_id,
                "candidate_name": candidate.candidate_name,
                "overall_score": candidate.overall_score,
                "skill_match_score": candidate.skill_match_score,
                "experience_score": candidate.experience_score,
                "education_score": candidate.education_score,
                "criteria_analysis": candidate.criteria_analysis,
                "strengths": candidate.strengths,
                "weaknesses": candidate.weaknesses,
                "recommendation": candidate.recommendation
            })
        
        # Define analysis criteria
        criteria = [
            "Technical Skills Match",
            "Relevant Experience",
            "Educational Background",
            "Soft Skills Assessment",
            "Career Progression",
            "Job Level Alignment"
        ]
        
        # Analysis metadata
        analysis_metadata = {
            "total_candidates": len(request.candidates),
            "analysis_date": datetime.now().isoformat(),
            "job_title": request.job.title,
            "job_level": request.job.level,
            "ai_model": "gpt-3.5-turbo",
            "analysis_version": "1.0"
        }
        
        logger.info(f"✅ AI analysis completed successfully")
        logger.info(f"📈 Top candidate: {shortlist[0]['candidate_name'] if shortlist else 'None'} ({shortlist[0]['overall_score']:.1f}%)")
        
        return AnalysisResponse(
            success=True,
            shortlist=shortlist,
            criteria=criteria,
            analysis_metadata=analysis_metadata
        )
        
    except Exception as e:
        logger.error(f"❌ Error during AI analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/analysis-criteria")
async def get_analysis_criteria():
    """
    Get the criteria used for AI analysis
    """
    return {
        "criteria": [
            {
                "name": "Technical Skills Match",
                "description": "How well candidate's technical skills align with job requirements",
                "weight": 30
            },
            {
                "name": "Relevant Experience",
                "description": "Years and quality of relevant work experience",
                "weight": 25
            },
            {
                "name": "Educational Background",
                "description": "Educational qualifications and certifications",
                "weight": 20
            },
            {
                "name": "Soft Skills Assessment",
                "description": "Communication, leadership, and interpersonal skills",
                "weight": 15
            },
            {
                "name": "Career Progression",
                "description": "Growth trajectory and career advancement",
                "weight": 10
            }
        ]
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Resume Analysis Service",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/analyze-candidates",
            "/analysis-criteria"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("AI_SERVICE_PORT", 8004))
    logger.info(f"🚀 Starting AI Resume Analysis Service on port {port}")
    
    uvicorn.run(
        "ai_service:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
