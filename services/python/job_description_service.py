from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import pdfplumber
import requests
import os
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
import traceback

# Load environment variables from .env.local and .env files
load_dotenv('.env.local')
load_dotenv('.env')

app = FastAPI(title="Job Description & Mock Interview Service", description="Enhanced with better error handling")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["x-ceed-db"]
collection = db["mock_interviews"]

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MISTRAL_MODEL = "mistralai/mistral-7b-instruct:free"

# Debug endpoint to check environment variables
@app.get("/debug/env")
async def debug_env():
    return {
        "openrouter_api_key_exists": bool(OPENROUTER_API_KEY),
        "gemini_api_key_exists": bool(GEMINI_API_KEY),
        "api_key_length": len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0,
        "gemini_key_length": len(GEMINI_API_KEY) if GEMINI_API_KEY else 0,
        "api_key_prefix": OPENROUTER_API_KEY[:10] + "..." if OPENROUTER_API_KEY else "NONE",
        "model": MISTRAL_MODEL
    }

# Simple test endpoint
@app.get("/test")
async def test_endpoint():
    return {"status": "working", "message": "Test endpoint is responding"}

# 1. File parsing endpoint
@app.post("/parse-job-description")
async def parse_job_description(file: UploadFile = File(...)):
    if file.content_type == "application/pdf":
        try:
            file.file.seek(0)
            with pdfplumber.open(file.file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parsing failed: {e}")
    elif file.content_type == "text/plain":
        text = (await file.read()).decode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file")
    return {"success": True, "text": text, "filename": file.filename}

# 2. Generate interview question
class QuestionRequest(BaseModel):
    job_description: str
    previous_questions: list = []

@app.post("/generate-question")
async def generate_question(req: QuestionRequest):
    print(f"🔄 Received request: job_description={req.job_description[:100]}...")
    
    prompt = f"""
You are an expert interviewer. Based on the following job description, generate ONE relevant interview question.
Job Description:
{req.job_description}

Previous questions (avoid repetition):
{chr(10).join(req.previous_questions)}

Instructions:
- Generate only ONE question
- Make it relevant to the job description
- Vary the question type (technical, behavioral, situational)
- Keep it concise and clear
- Don't include any explanations or additional text, just the question

Generate the question:
"""
    
    # Try OpenRouter first
    if OPENROUTER_API_KEY:
        print("🔄 Trying OpenRouter API...")
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3002",
                    "X-Title": "X-Ceed Mock Interview",
                },
                json={
                    "model": "mistralai/mistral-7b-instruct:free",
                    "messages": [
                        {"role": "system", "content": "You are an expert interviewer."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 200,
                    "temperature": 0.7
                }
            )
            
            print(f"🔄 OpenRouter response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    question = data["choices"][0]["message"]["content"].strip()
                    print(f"✅ OpenRouter generated question: {question}")
                    return {"question": question}
                else:
                    print(f"⚠️ OpenRouter unexpected response format: {data}")
            else:
                print(f"❌ OpenRouter API Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ OpenRouter API Exception: {str(e)}")
            print(f"❌ OpenRouter Exception traceback: {traceback.format_exc()}")
    
    # Try Gemini as backup
    if GEMINI_API_KEY:
        print("🔄 Trying Gemini API...")
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            response = model.generate_content(prompt)
            if response.text:
                question = response.text.strip()
                print(f"✅ Gemini generated question: {question}")
                return {"question": question}
            else:
                print("⚠️ Gemini returned empty response")
        except Exception as e:
            print(f"❌ Gemini API Exception: {str(e)}")
            print(f"❌ Gemini Exception traceback: {traceback.format_exc()}")
    
    # Fallback to predefined question
    print("🔄 Using fallback question")
    fallback_question = "Tell me about your experience relevant to this position and how you would approach the key responsibilities mentioned in the job description."
    return {"question": fallback_question}

# 3. Analyze interview answers and store in MongoDB
class AnalysisRequest(BaseModel):
    user_id: str = None
    job_description: str
    questions: list
    answers: list

@app.post("/analyze-answers")
async def analyze_answers(req: AnalysisRequest):
    prompt = f"""
You are an expert interview coach. Analyze the following mock interview and provide detailed feedback.

Job Description:
{req.job_description}

Questions and Answers:
{chr(10).join([f'Q: {q}\nA: {a}' for q, a in zip(req.questions, req.answers)])}

Please provide a JSON with:
- score (overall, communication, technical, confidence)
- strengths
- improvements
- recommendations
"""
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MISTRAL_MODEL,
            "messages": [
                {"role": "system", "content": "You are an expert interview analyst."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.3
        }
    )
    data = response.json()
    analysis = data["choices"][0]["message"]["content"].strip()
    # Store in MongoDB
    doc = {
        "userId": req.user_id,
        "jobDescription": req.job_description,
        "questions": req.questions,
        "answers": req.answers,
        "analysis": analysis,
        "createdAt": datetime.utcnow()
    }
    collection.insert_one(doc)
    return {"analysis": analysis, "success": True}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Job Description & Mock Interview Service"}

@app.get("/")
async def root():
    return {"message": "Job Description & Mock Interview Service is running", "status": "online"}