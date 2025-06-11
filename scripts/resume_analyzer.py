#!/usr/bin/env python3
"""
Advanced Resume Matching Service using LangChain and AI
This service provides intelligent resume analysis and job matching capabilities.
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import PyPDF2
import spacy
import re
from collections import defaultdict

# LangChain imports
try:
    from langchain_openai import ChatOpenAI
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.schema import Document
    from langchain.prompts import ChatPromptTemplate
    from langchain.chains import LLMChain
    from langchain_community.vectorstores import FAISS
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logging.warning("LangChain not available. Using basic analysis.")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ResumeAnalysisRequest:
    """Request structure for resume analysis"""
    job_description: str
    job_title: str
    job_requirements: List[str]
    resume_path: str
    user_skills: List[str]
    user_id: str

@dataclass
class AnalysisResult:
    """Result structure for resume analysis"""
    overall_score: int
    skills_score: int
    experience_score: int
    keyword_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    found_keywords: List[str]
    missing_keywords: List[str]
    suggestions: List[Dict[str, str]]
    experience_analysis: List[Dict[str, Any]]
    highlights: List[Dict[str, Any]]
    overall_summary: str

class ResumeAnalyzer:
    """Advanced Resume Analysis using AI and NLP"""
    
    def __init__(self):
        self.nlp = None
        self.llm = None
        self.embeddings = None
        self.text_splitter = None
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize AI models and NLP tools"""
        try:
            # Initialize spaCy for NLP
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("✅ spaCy model loaded successfully")
        except OSError:
            logger.warning("❌ spaCy model not found. Please install: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        if LANGCHAIN_AVAILABLE:
            try:
                # Initialize OpenAI (if API key available)
                openai_api_key = os.getenv('OPENAI_API_KEY')
                if openai_api_key:
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.3,
                        openai_api_key=openai_api_key
                    )
                    logger.info("✅ OpenAI LLM initialized")
                else:
                    logger.warning("⚠️ OpenAI API key not found. Using basic analysis.")
                
                # Initialize embeddings for semantic similarity
                self.embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )
                self.text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200
                )
                logger.info("✅ Embeddings and text splitter initialized")
                
            except Exception as e:
                logger.error(f"❌ Error initializing AI models: {e}")
                self.llm = None
                self.embeddings = None
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF resume"""
        try:
            if not os.path.exists(pdf_path):
                logger.error(f"PDF file not found: {pdf_path}")
                return ""
            
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            
            logger.info(f"✅ Extracted {len(text)} characters from PDF")
            return text.strip()
        
        except Exception as e:
            logger.error(f"❌ Error extracting PDF text: {e}")
            return ""
    
    def extract_skills_with_nlp(self, text: str) -> List[str]:
        """Extract skills using NLP and pattern matching"""
        if not self.nlp:
            return self._extract_skills_basic(text)
        
        doc = self.nlp(text.lower())
        skills = set()
        
        # Technical skills patterns
        tech_patterns = [
            r'\b(?:javascript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin)\b',
            r'\b(?:react|angular|vue|svelte|ember)\b',
            r'\b(?:node\.js|express|django|flask|spring|laravel)\b',
            r'\b(?:mysql|postgresql|mongodb|redis|cassandra|elasticsearch)\b',
            r'\b(?:docker|kubernetes|jenkins|gitlab|github|git)\b',
            r'\b(?:aws|azure|gcp|heroku|vercel|netlify)\b',
            r'\b(?:html|css|sass|scss|tailwind|bootstrap)\b',
            r'\b(?:typescript|babel|webpack|vite|rollup)\b'
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, text.lower())
            skills.update(matches)
        
        # Extract noun chunks that might be skills
        for chunk in doc.noun_chunks:
            if len(chunk.text) > 2 and chunk.text.lower() not in ['experience', 'work', 'job', 'company']:
                skills.add(chunk.text.lower())
        
        return list(skills)[:20]  # Limit to top 20 skills
    
    def _extract_skills_basic(self, text: str) -> List[str]:
        """Basic skill extraction without NLP"""
        common_skills = [
            'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
            'html', 'css', 'sql', 'mongodb', 'postgresql', 'docker', 'aws',
            'git', 'github', 'jenkins', 'kubernetes', 'typescript', 'php'
        ]
        
        text_lower = text.lower()
        found_skills = [skill for skill in common_skills if skill in text_lower]
        return found_skills
    
    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts"""
        if not self.embeddings:
            return self._calculate_basic_similarity(text1, text2)
        
        try:
            # Create embeddings
            embedding1 = self.embeddings.embed_query(text1)
            embedding2 = self.embeddings.embed_query(text2)
            
            # Calculate cosine similarity
            import numpy as np
            similarity = np.dot(embedding1, embedding2) / (
                np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
            )
            return float(similarity)
        
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return self._calculate_basic_similarity(text1, text2)
    
    def _calculate_basic_similarity(self, text1: str, text2: str) -> float:
        """Basic similarity calculation using word overlap"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def generate_ai_suggestions(self, resume_text: str, job_description: str, missing_skills: List[str]) -> List[Dict[str, str]]:
        """Generate AI-powered improvement suggestions"""
        if not self.llm:
            return self._generate_basic_suggestions(missing_skills)
        
        try:
            prompt = ChatPromptTemplate.from_template("""
            You are an expert resume reviewer and career coach. Analyze the following resume and job description, 
            then provide specific, actionable suggestions for improvement.
            
            Job Description:
            {job_description}
            
            Resume:
            {resume_text}
            
            Missing Skills: {missing_skills}
            
            Please provide 3-5 specific suggestions to improve this resume for the given job. 
            Each suggestion should include a title, description, and priority level (high/medium/low).
            Format as JSON array with objects containing 'title', 'description', and 'priority' fields.
            """)
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            response = chain.run(
                job_description=job_description,
                resume_text=resume_text[:2000],  # Limit text length
                missing_skills=', '.join(missing_skills[:5])
            )
            
            # Parse JSON response
            suggestions = json.loads(response)
            return suggestions
        
        except Exception as e:
            logger.error(f"Error generating AI suggestions: {e}")
            return self._generate_basic_suggestions(missing_skills)
    
    def _generate_basic_suggestions(self, missing_skills: List[str]) -> List[Dict[str, str]]:
        """Generate basic suggestions without AI"""
        suggestions = []
        
        if missing_skills:
            suggestions.append({
                'title': 'Add Missing Technical Skills',
                'description': f'Consider adding these skills: {", ".join(missing_skills[:3])}',
                'priority': 'high'
            })
        
        suggestions.extend([
            {
                'title': 'Quantify Your Achievements',
                'description': 'Add specific numbers, percentages, and metrics to demonstrate impact',
                'priority': 'medium'
            },
            {
                'title': 'Use Action Verbs',
                'description': 'Start bullet points with strong action verbs like "developed", "implemented", "optimized"',
                'priority': 'medium'
            },
            {
                'title': 'Tailor Keywords',
                'description': 'Include more keywords from the job description throughout your resume',
                'priority': 'high'
            }
                ])
        
        return suggestions
    
    def analyze_resume(self, request: ResumeAnalysisRequest) -> AnalysisResult:
        """Main analysis method"""
        logger.info(f"🎯 Starting resume analysis for user {request.user_id}")
        
        # Extract resume text
        resume_text = ""
        if request.resume_path:
            full_path = os.path.join(os.getcwd(), 'public', request.resume_path)
            resume_text = self.extract_text_from_pdf(full_path)
        
        # For test mode, if no resume_path provided, create a simple test resume
        if not resume_text and not request.resume_path:
            resume_text = f"""
            John Doe
            Software Developer
            
            Skills: {', '.join(request.user_skills)}
            
            Experience:
            - 3 years of software development
            - Worked with web technologies
            - Experience in team collaboration and project management
            
            Education:
            Bachelor of Computer Science
            """
        
        # Extract skills from resume
        extracted_skills = self.extract_skills_with_nlp(resume_text)
        all_user_skills = list(set(request.user_skills + extracted_skills))
        
        # Extract job requirements
        job_keywords = self._extract_job_keywords(request.job_description, request.job_title)
        required_skills = self._extract_required_skills(request.job_description, request.job_requirements)
        
        # Skills analysis
        skills_analysis = self._analyze_skills(all_user_skills, required_skills)
        
        # Keywords analysis
        keyword_analysis = self._analyze_keywords(resume_text, job_keywords)
        
        # Experience analysis
        experience_analysis = self._analyze_experience(resume_text, request.job_description)
        
        # Calculate overall score with semantic similarity
        semantic_score = self.calculate_semantic_similarity(resume_text, request.job_description) * 100
        overall_score = self._calculate_weighted_score(
            skills_analysis['score'],
            experience_analysis['score'],
            keyword_analysis['score'],
            semantic_score
        )
        
        # Generate suggestions
        suggestions = self.generate_ai_suggestions(
            resume_text, request.job_description, skills_analysis['missing']
        )
        
        # Generate highlights for PDF
        highlights = self._generate_pdf_highlights(resume_text, skills_analysis['missing'])
        
        result = AnalysisResult(
            overall_score=int(overall_score),
            skills_score=skills_analysis['score'],
            experience_score=experience_analysis['score'],
            keyword_score=keyword_analysis['score'],
            matched_skills=skills_analysis['matched'],
            missing_skills=skills_analysis['missing'],
            found_keywords=keyword_analysis['found'],
            missing_keywords=keyword_analysis['missing'],
            suggestions=suggestions,
            experience_analysis=experience_analysis['details'],
            highlights=highlights,
            overall_summary=self._generate_summary(int(overall_score))
        )
        
        logger.info(f"✅ Analysis complete. Overall score: {overall_score}%")
        return result
    
    def _extract_job_keywords(self, job_description: str, job_title: str) -> List[str]:
        """Extract important keywords from job description"""
        text = f"{job_title} {job_description}".lower()
        
        # Technical keywords
        tech_keywords = [
            'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
            'mongodb', 'sql', 'postgresql', 'redis', 'docker', 'kubernetes',
            'aws', 'azure', 'gcp', 'ci/cd', 'devops', 'microservices', 'api',
            'git', 'agile', 'scrum', 'machine learning', 'ai', 'data science'
        ]
        
        found_keywords = [kw for kw in tech_keywords if kw in text]
        
        # Extract high-frequency words
        words = re.findall(r'\b\w{4,}\b', text)
        word_freq = defaultdict(int)
        for word in words:
            word_freq[word] += 1
        
        # Get top frequent words
        frequent_words = [word for word, freq in sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10] if freq >= 2]
        
        return list(set(found_keywords + frequent_words))
    
    def _extract_required_skills(self, job_description: str, job_requirements: List[str]) -> List[str]:
        """Extract required skills from job description"""
        all_text = f"{job_description} {' '.join(job_requirements)}".lower()
        
        skill_patterns = [
            r'\b(?:javascript|js|python|java|c\+\+|c#|php|ruby|go)\b',
            r'\b(?:react|angular|vue|svelte|ember)\b',
            r'\b(?:node\.js|express|django|flask|spring)\b',
            r'\b(?:mysql|postgresql|mongodb|redis|cassandra)\b',
            r'\b(?:docker|kubernetes|jenkins|git)\b',
            r'\b(?:aws|azure|gcp|cloud)\b'
        ]
        
        skills = set()
        for pattern in skill_patterns:
            matches = re.findall(pattern, all_text)
            skills.update(matches)
        
        return list(skills)
    
    def _analyze_skills(self, user_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
        """Analyze skill match"""
        user_skills_lower = [skill.lower() for skill in user_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        matched = []
        for req_skill in required_skills_lower:
            for user_skill in user_skills_lower:
                if req_skill in user_skill or user_skill in req_skill:
                    matched.append(req_skill)
                    break
        
        missing = [skill for skill in required_skills_lower if skill not in matched]
        score = int((len(matched) / len(required_skills_lower)) * 100) if required_skills_lower else 50
        
        return {'matched': matched, 'missing': missing, 'score': score}
    
    def _analyze_keywords(self, resume_text: str, job_keywords: List[str]) -> Dict[str, Any]:
        """Analyze keyword match"""
        resume_lower = resume_text.lower()
        
        found = [kw for kw in job_keywords if kw in resume_lower]
        missing = [kw for kw in job_keywords if kw not in found]
        score = int((len(found) / len(job_keywords)) * 100) if job_keywords else 50
        
        return {'found': found, 'missing': missing, 'score': score}
    
    def _analyze_experience(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Analyze experience match"""
        # Extract years of experience
        resume_years = self._extract_years_experience(resume_text)
        job_years = self._extract_required_years(job_description)
        
        # Analyze key requirements
        requirements = [
            {'requirement': 'Leadership experience', 'keywords': ['lead', 'manage', 'supervise']},
            {'requirement': 'Team collaboration', 'keywords': ['team', 'collaborate', 'group']},
            {'requirement': 'Project management', 'keywords': ['project', 'manage', 'coordinate']},
        ]
        
        details = []
        matched_count = 0
        
        for req in requirements:
            matched = any(kw in resume_text.lower() for kw in req['keywords'])
            if matched:
                matched_count += 1
            
            details.append({
                'requirement': req['requirement'],
                'matched': matched,
                'analysis': f"{'Found' if matched else 'No'} evidence of {req['requirement'].lower()}"
            })
        
        # Calculate score
        score = 60  # Base score
        if resume_years >= job_years:
            score += 20
        if matched_count >= 2:
            score += 20
        
        return {'score': min(100, score), 'details': details}
    
    def _extract_years_experience(self, text: str) -> int:
        """Extract years of experience from text"""
        years_patterns = [
            r'(\d+)\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\s*yrs?\s*experience',
            r'(\d+)\+\s*years?'
        ]
        
        max_years = 0
        for pattern in years_patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                years = int(match)
                max_years = max(max_years, years)
        
        return max_years
    
    def _extract_required_years(self, job_description: str) -> int:
        """Extract required years from job description"""
        return self._extract_years_experience(job_description)
    
    def _calculate_weighted_score(self, skills_score: int, exp_score: int, keyword_score: int, semantic_score: float) -> float:
        """Calculate weighted overall score"""
        weights = {
            'skills': 0.35,
            'experience': 0.25,
            'keywords': 0.25,
            'semantic': 0.15
        }
        
        return (
            skills_score * weights['skills'] +
            exp_score * weights['experience'] +
            keyword_score * weights['keywords'] +
            semantic_score * weights['semantic']
        )
    
    def _generate_pdf_highlights(self, resume_text: str, missing_skills: List[str]) -> List[Dict[str, Any]]:
        """Generate PDF highlight coordinates"""
        # This is a simplified version - in practice, you'd need PDF parsing
        # to get actual text coordinates
        highlights = []
        
        if missing_skills:
            highlights.append({
                'page': 1,
                'x': 100,
                'y': 200,
                'width': 300,
                'height': 20,
                'color': 'yellow',
                'reason': f'Consider adding: {", ".join(missing_skills[:3])}'
            })
        
        return highlights
    
    def _generate_summary(self, score: int) -> str:
        """Generate overall summary"""
        if score >= 85:
            return "Excellent match! Your resume strongly aligns with this job opportunity."
        elif score >= 70:
            return "Very good match with minor areas for improvement."
        elif score >= 55:
            return "Good match with some areas that could be enhanced."
        elif score >= 40:
            return "Fair match. Consider significant improvements to better align with this role."
        else:
            return "Poor match. Substantial revisions needed to align with this opportunity."

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python resume_analyzer.py <json_request>")
        print("   or: python resume_analyzer.py --test")
        sys.exit(1)
    
    try:        # Check for test mode
        if sys.argv[1] == "--test":
            # Run a simple test
            test_request = {
                "job_description": "We are looking for a Software Developer with experience in Python and JavaScript. React knowledge is a plus.",
                "job_title": "Software Developer",
                "job_requirements": ["Python", "JavaScript", "Web Development"],
                "resume_path": "",  # Empty for test - we'll use resume_text instead
                "user_skills": ["Python", "JavaScript", "React", "Node.js"],
                "user_id": "test_user"
            }
            request = ResumeAnalysisRequest(**test_request)
        else:
            # Parse JSON request
            request_json = json.loads(sys.argv[1])
            request = ResumeAnalysisRequest(**request_json)
        
        # Perform analysis
        analyzer = ResumeAnalyzer()
        result = analyzer.analyze_resume(request)
        
        # Output result as JSON
        result_dict = {
            'overall_score': result.overall_score,
            'skills_score': result.skills_score,
            'experience_score': result.experience_score,
            'keyword_score': result.keyword_score,
            'matched_skills': result.matched_skills,
            'missing_skills': result.missing_skills,
            'found_keywords': result.found_keywords,
            'missing_keywords': result.missing_keywords,
            'suggestions': result.suggestions,
            'experience_analysis': result.experience_analysis,
            'highlights': result.highlights,
            'overall_summary': result.overall_summary
        }
        
        print(json.dumps(result_dict, indent=2))
    
    except Exception as e:
        error_result = {
            'error': str(e),
            'overall_score': 0,
            'skills_score': 0,
            'experience_score': 0,
            'keyword_score': 0,
            'matched_skills': [],
            'missing_skills': [],
            'found_keywords': [],
            'missing_keywords': [],
            'suggestions': [],
            'experience_analysis': [],
            'highlights': [],
            'overall_summary': 'Analysis failed due to an error.'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
