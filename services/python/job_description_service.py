from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import pdfplumber
import requests
import os
from datetime import datetime

app = FastAPI(title="Job Description & Mock Interview Service")

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
MISTRAL_MODEL = "mistralai/mistral-7b-instruct"

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
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MISTRAL_MODEL,
            "messages": [
                {"role": "system", "content": "You are an expert interviewer."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 200,
            "temperature": 0.7
        }
    )
    data = response.json()
    question = data["choices"][0]["message"]["content"].strip()
    return {"question": question}

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