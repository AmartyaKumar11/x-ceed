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
    
    def _generate_basic_suggestions(self, missing_skills: List[str], skills_analysis: Dict[str, Any] = None, experience_analysis: Dict[str, Any] = None) -> List[Dict[str, str]]:
        """Generate detailed, specific suggestions based on analysis"""
        suggestions = []
        
        if skills_analysis:
            # Critical missing skills
            if skills_analysis.get('critical_missing'):
                suggestions.append({
                    'title': '🚨 Critical Technical Skills Gap',
                    'description': f"Add these essential programming languages/technologies to your resume: {', '.join(skills_analysis['critical_missing'])}. These are core requirements for this role.",
                    'priority': 'critical',
                    'action_items': [
                        f"Complete online courses or tutorials in {skill}" for skill in skills_analysis['critical_missing'][:3]
                    ],
                    'resources': ['Coursera', 'Udemy', 'freeCodeCamp', 'Official documentation'],
                    'timeline': '2-4 weeks per skill'
                })
            
            # Important missing skills
            if skills_analysis.get('important_missing'):
                suggestions.append({
                    'title': '⚡ Important Framework/Database Skills',
                    'description': f"Strengthen your profile by learning: {', '.join(skills_analysis['important_missing'])}. These are commonly mentioned in similar roles.",
                    'priority': 'high',
                    'action_items': [
                        f"Build a project using {skill}" for skill in skills_analysis['important_missing'][:2]
                    ],
                    'resources': ['Official tutorials', 'YouTube channels', 'GitHub projects'],
                    'timeline': '1-2 weeks per skill'
                })
            
            # Partial matches
            if skills_analysis.get('partial_matches'):
                partial_skills = [match['required'] for match in skills_analysis['partial_matches']]
                suggestions.append({
                    'title': '🔧 Skill Enhancement Opportunities',
                    'description': f"You have related experience in {', '.join(partial_skills)}. Highlight these more prominently and consider deepening your knowledge.",
                    'priority': 'medium',
                    'action_items': [
                        "Add specific project examples using these technologies",
                        "Include version numbers and proficiency levels",
                        "Mention any certifications or courses completed"
                    ],
                    'resources': ['Professional portfolios', 'LinkedIn skill assessments'],
                    'timeline': '1 week'
                })
        
        if experience_analysis and experience_analysis.get('detailed_categories'):
            # Missing experience categories
            missing_categories = [cat for cat in experience_analysis['detailed_categories'] 
                                if cat['required_by_job'] and not cat['present_in_resume']]
            
            if missing_categories:
                for category in missing_categories[:2]:  # Top 2 missing categories
                    suggestions.append({
                        'title': f'💼 {category["category"]} Experience Gap',
                        'description': f"This role requires {category['description'].lower()}. Consider highlighting any relevant experience or seeking opportunities to develop this area.",
                        'priority': 'high',
                        'action_items': [
                            f"Review your past work for any {category['category'].lower()} examples",
                            "Consider volunteer leadership roles or side projects",
                            "Take online courses in project management or leadership"
                        ],
                        'resources': ['PMI courses', 'LinkedIn Learning', 'Company training programs'],
                        'timeline': '2-4 weeks'
                    })
            
            # Years of experience gap
            if experience_analysis.get('years_analysis', {}).get('gap', 0) > 0:
                gap = experience_analysis['years_analysis']['gap']
                suggestions.append({
                    'title': f'📅 Experience Duration Gap',
                    'description': f"This role typically requires {gap} more years of experience. Focus on highlighting the depth and impact of your current experience.",
                    'priority': 'medium',
                    'action_items': [
                        "Quantify your achievements with specific metrics",
                        "Highlight complex projects and their business impact",
                        "Emphasize rapid learning and adaptation skills",
                        "Consider emphasizing freelance or personal project experience"
                    ],
                    'resources': ['Resume writing guides', 'Professional mentorship'],
                    'timeline': '1 week'
                })
        
        # Generic high-impact suggestions
        suggestions.extend([
            {
                'title': '📊 Quantify Your Achievements',
                'description': 'Add specific numbers, percentages, and metrics to demonstrate impact. Instead of "improved performance," write "improved application performance by 40%, reducing load time from 3s to 1.8s."',
                'priority': 'high',
                'action_items': [
                    "Review each bullet point and add specific metrics",
                    "Include percentages, dollar amounts, time savings, user counts",
                    "Use action verbs followed by quantifiable results"
                ],
                'resources': ['Resume templates with metrics examples'],
                'timeline': '2-3 hours'
            },
            {
                'title': '🎯 Optimize for Applicant Tracking Systems (ATS)',
                'description': 'Ensure your resume passes automated screening by including exact keywords from the job description and using standard formatting.',
                'priority': 'high',
                'action_items': [
                    "Use exact skill names as mentioned in job posting",
                    "Include keywords in context, not just as a list",
                    "Save resume as both PDF and Word formats",
                    "Use standard section headers (Experience, Skills, Education)"
                ],
                'resources': ['ATS resume checkers', 'Jobscan.co'],
                'timeline': '1-2 hours'
            },
            {
                'title': '🏗️ Create Relevant Project Portfolio',
                'description': 'Build 2-3 projects that demonstrate the exact technologies and skills mentioned in this job posting.',
                'priority': 'medium',
                'action_items': [
                    "Identify 2-3 key technologies from the job description",
                    "Build small but complete projects using these technologies",
                    "Deploy projects and include live links in your resume",
                    "Write clear README files explaining your approach"
                ],
                'resources': ['GitHub', 'Netlify', 'Heroku', 'Vercel'],
                'timeline': '2-4 weeks'
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
        
        # If AI suggestions failed, use enhanced basic suggestions
        if not suggestions or len(suggestions) < 3:
            suggestions = self._generate_basic_suggestions(
                skills_analysis['missing'], 
                skills_analysis, 
                experience_analysis
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
            experience_analysis=experience_analysis.get('detailed_categories', []),
            highlights=highlights,
            overall_summary=self._generate_summary(int(overall_score), skills_analysis, experience_analysis)
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
        """Analyze skill match with detailed categorization and prioritization"""
        user_skills_lower = [skill.lower().strip() for skill in user_skills]
        required_skills_lower = [skill.lower().strip() for skill in required_skills]
        
        # Enhanced skill matching with variations
        skill_variations = {
            'javascript': ['js', 'javascript', 'ecmascript', 'es6', 'es2015', 'es2020'],
            'typescript': ['ts', 'typescript'],
            'react': ['react', 'reactjs', 'react.js'],
            'angular': ['angular', 'angularjs', 'angular2+'],
            'vue': ['vue', 'vuejs', 'vue.js'],
            'node.js': ['node', 'nodejs', 'node.js'],
            'express': ['express', 'expressjs', 'express.js'],
            'mongodb': ['mongo', 'mongodb'],
            'postgresql': ['postgres', 'postgresql', 'psql'],
            'mysql': ['mysql'],
            'python': ['python', 'py'],
            'java': ['java'],
            'c++': ['c++', 'cpp', 'cplusplus'],
            'c#': ['c#', 'csharp', 'c-sharp'],
            'php': ['php'],
            'html': ['html', 'html5'],
            'css': ['css', 'css3'],
            'sass': ['sass', 'scss'],
            'docker': ['docker', 'containerization'],
            'kubernetes': ['kubernetes', 'k8s'],
            'aws': ['aws', 'amazon web services'],
            'azure': ['azure', 'microsoft azure'],
            'gcp': ['gcp', 'google cloud platform', 'google cloud'],
            'git': ['git', 'version control'],
            'github': ['github'],
            'gitlab': ['gitlab'],
            'jenkins': ['jenkins', 'ci/cd'],
            'rest api': ['rest', 'restful', 'api', 'rest api'],
            'graphql': ['graphql', 'gql'],
            'redis': ['redis'],
            'elasticsearch': ['elasticsearch', 'elastic search'],
            'microservices': ['microservices', 'microservice architecture'],
            'agile': ['agile', 'scrum', 'kanban'],
            'machine learning': ['ml', 'machine learning', 'artificial intelligence', 'ai'],
            'data science': ['data science', 'data analysis', 'analytics'],
            'devops': ['devops', 'dev ops'],
            'linux': ['linux', 'unix'],
            'windows': ['windows'],
            'macos': ['macos', 'mac os']
        }
        
        # Categorize skills by priority and type
        skill_categories = {
            'core_programming': ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'typescript'],
            'frontend_frameworks': ['react', 'angular', 'vue', 'svelte'],
            'backend_frameworks': ['node.js', 'express', 'django', 'flask', 'spring'],
            'databases': ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'],
            'cloud_platforms': ['aws', 'azure', 'gcp'],
            'devops_tools': ['docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab'],
            'styling': ['html', 'css', 'sass', 'bootstrap', 'tailwind'],
            'soft_skills': ['agile', 'scrum', 'leadership', 'teamwork', 'communication']
        }
        
        # Normalize skills using variations
        def normalize_skill(skill):
            skill_lower = skill.lower().strip()
            for normalized, variations in skill_variations.items():
                if skill_lower in variations:
                    return normalized
            return skill_lower
        
        # Normalize all skills
        normalized_user_skills = [normalize_skill(skill) for skill in user_skills]
        normalized_required_skills = [normalize_skill(skill) for skill in required_skills]
        
        # Find matches with detailed analysis
        matched_skills = []
        missing_skills = []
        partial_matches = []
        
        for req_skill in normalized_required_skills:
            exact_match = req_skill in normalized_user_skills
            partial_match = any(req_skill in user_skill or user_skill in req_skill 
                              for user_skill in normalized_user_skills)
            
            if exact_match:
                matched_skills.append(req_skill)
            elif partial_match:
                partial_user_skill = next((user_skill for user_skill in normalized_user_skills 
                                         if req_skill in user_skill or user_skill in req_skill), None)
                partial_matches.append({
                    'required': req_skill,
                    'user_has': partial_user_skill,
                    'match_type': 'partial'
                })
            else:
                missing_skills.append(req_skill)
        
        # Categorize missing skills by priority
        critical_missing = []
        important_missing = []
        nice_to_have_missing = []
        
        for missing_skill in missing_skills:
            if missing_skill in skill_categories['core_programming']:
                critical_missing.append(missing_skill)
            elif missing_skill in skill_categories['frontend_frameworks'] or \
                 missing_skill in skill_categories['backend_frameworks'] or \
                 missing_skill in skill_categories['databases']:
                important_missing.append(missing_skill)
            else:
                nice_to_have_missing.append(missing_skill)
        
        # Calculate detailed score
        exact_matches = len(matched_skills)
        partial_score = len(partial_matches) * 0.5
        total_required = len(normalized_required_skills)
        
        if total_required > 0:
            score = int(((exact_matches + partial_score) / total_required) * 100)
        else:
            score = 50
        
        return {
            'matched': matched_skills,
            'missing': missing_skills,
            'partial_matches': partial_matches,
            'critical_missing': critical_missing,
            'important_missing': important_missing,
            'nice_to_have_missing': nice_to_have_missing,
            'score': score,
            'total_required': total_required,
            'exact_matches': exact_matches,
            'partial_matches_count': len(partial_matches)
        }
    
    def _analyze_keywords(self, resume_text: str, job_keywords: List[str]) -> Dict[str, Any]:
        """Analyze keyword match"""
        resume_lower = resume_text.lower()
        
        found = [kw for kw in job_keywords if kw in resume_lower]
        missing = [kw for kw in job_keywords if kw not in found]
        score = int((len(found) / len(job_keywords)) * 100) if job_keywords else 50
        
        return {'found': found, 'missing': missing, 'score': score}
    
    def _analyze_experience(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Analyze experience match with detailed breakdown"""
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract years of experience with more patterns
        resume_years = self._extract_years_experience(resume_text)
        job_years = self._extract_required_years(job_description)
        
        # Define comprehensive experience categories
        experience_categories = [
            {
                'category': 'Leadership & Management',
                'keywords': ['lead', 'manage', 'supervise', 'direct', 'oversee', 'coordinate', 'mentor', 'guide', 'head'],
                'weight': 0.25,
                'description': 'Experience leading teams, managing projects, or supervising others'
            },
            {
                'category': 'Team Collaboration',
                'keywords': ['team', 'collaborate', 'group', 'cross-functional', 'stakeholder', 'partner', 'work with'],
                'weight': 0.20,
                'description': 'Working effectively in team environments and with stakeholders'
            },
            {
                'category': 'Project Management',
                'keywords': ['project', 'deliver', 'timeline', 'deadline', 'milestone', 'scope', 'budget', 'agile', 'scrum'],
                'weight': 0.20,
                'description': 'Managing projects from inception to completion'
            },
            {
                'category': 'Client Interaction',
                'keywords': ['client', 'customer', 'user', 'stakeholder', 'business', 'requirement', 'meeting', 'presentation'],
                'weight': 0.15,
                'description': 'Direct interaction with clients, customers, or end users'
            },
            {
                'category': 'Problem Solving',
                'keywords': ['solve', 'debug', 'troubleshoot', 'optimize', 'improve', 'fix', 'resolve', 'analyze'],
                'weight': 0.10,
                'description': 'Identifying and solving complex technical problems'
            },
            {
                'category': 'Innovation & Development',
                'keywords': ['develop', 'create', 'build', 'design', 'architect', 'implement', 'innovate', 'research'],
                'weight': 0.10,
                'description': 'Creating new solutions and driving innovation'
            }
        ]
        
        detailed_analysis = []
        total_weighted_score = 0
        
        for category in experience_categories:
            # Check for keywords in both resume and job description
            resume_matches = [kw for kw in category['keywords'] if kw in resume_lower]
            job_mentions = [kw for kw in category['keywords'] if kw in job_lower]
            
            # Calculate relevance
            has_experience = len(resume_matches) > 0
            job_requires = len(job_mentions) > 0
            
            # Detailed scoring
            if has_experience and job_requires:
                category_score = 100
                status = "Strong Match"
                color = "green"
            elif has_experience and not job_requires:
                category_score = 75
                status = "Additional Strength"
                color = "blue"
            elif not has_experience and job_requires:
                category_score = 0
                status = "Missing Requirement"
                color = "red"
            else:
                category_score = 50
                status = "Not Applicable"
                color = "gray"
            
            # Evidence from resume
            evidence = []
            for keyword in resume_matches[:3]:  # Top 3 matches
                # Find context around the keyword
                import re
                pattern = rf'.{{0,50}}\b{re.escape(keyword)}\b.{{0,50}}'
                matches = re.findall(pattern, resume_text, re.IGNORECASE)
                if matches:
                    evidence.append(matches[0].strip())
            
            detailed_analysis.append({
                'category': category['category'],
                'description': category['description'],
                'score': category_score,
                'status': status,
                'color': color,
                'weight': category['weight'],
                'resume_keywords_found': resume_matches,
                'job_keywords_mentioned': job_mentions,
                'evidence': evidence[:2],  # Top 2 pieces of evidence
                'required_by_job': job_requires,
                'present_in_resume': has_experience
            })
            
            # Add to weighted score
            total_weighted_score += category_score * category['weight']
        
        # Years analysis
        years_analysis = {
            'resume_years': resume_years,
            'required_years': job_years,
            'meets_requirement': resume_years >= job_years,
            'gap': max(0, job_years - resume_years),
            'excess': max(0, resume_years - job_years)
        }
        
        # Calculate final experience score
        base_score = int(total_weighted_score)
        
        # Adjust for years
        if years_analysis['meets_requirement']:
            base_score += 10
        elif years_analysis['gap'] > 0:
            penalty = min(20, years_analysis['gap'] * 5)  # Max 20 point penalty
            base_score = max(0, base_score - penalty)
        
        # Industry experience patterns
        industry_keywords = self._extract_industry_keywords(job_description)
        industry_match_score = self._analyze_industry_experience(resume_text, industry_keywords)
        
        final_score = min(100, int((base_score + industry_match_score) / 2))
        
        return {
            'score': final_score,
            'detailed_categories': detailed_analysis,
            'years_analysis': years_analysis,
            'industry_match_score': industry_match_score,
            'summary': self._generate_experience_summary(detailed_analysis, years_analysis, final_score)
        }
    
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

    def _extract_industry_keywords(self, job_description: str) -> List[str]:
        """Extract industry-specific keywords from job description"""
        industry_patterns = {
            'fintech': ['financial', 'banking', 'payment', 'trading', 'investment', 'fintech'],
            'healthcare': ['healthcare', 'medical', 'patient', 'clinical', 'hospital', 'health'],
            'ecommerce': ['ecommerce', 'retail', 'shopping', 'cart', 'payment', 'marketplace'],
            'education': ['education', 'learning', 'student', 'academic', 'course', 'teaching'],
            'saas': ['saas', 'software as a service', 'subscription', 'platform', 'cloud'],
            'gaming': ['game', 'gaming', 'player', 'unity', 'unreal', 'mobile game'],
            'automotive': ['automotive', 'vehicle', 'car', 'transportation', 'fleet'],
            'manufacturing': ['manufacturing', 'production', 'factory', 'supply chain', 'logistics'],
            'media': ['media', 'content', 'video', 'streaming', 'broadcast', 'publishing'],
            'travel': ['travel', 'booking', 'hotel', 'flight', 'tourism', 'hospitality']
        }
        
        job_lower = job_description.lower()
        found_industries = []
        
        for industry, keywords in industry_patterns.items():
            if any(keyword in job_lower for keyword in keywords):
                found_industries.extend(keywords)
        
        return found_industries

    def _analyze_industry_experience(self, resume_text: str, industry_keywords: List[str]) -> int:
        """Analyze industry-specific experience"""
        if not industry_keywords:
            return 70  # Neutral score if no industry context
        
        resume_lower = resume_text.lower()
        matches = [kw for kw in industry_keywords if kw in resume_lower]
        
        if not matches:
            return 30  # Low score for no industry match
        
        # Score based on number of industry keywords found
        match_ratio = len(matches) / len(industry_keywords)
        return min(100, int(50 + (match_ratio * 50)))

    def _generate_experience_summary(self, detailed_analysis: List[Dict], years_analysis: Dict, final_score: int) -> str:
        """Generate comprehensive experience summary"""
        strong_areas = [cat['category'] for cat in detailed_analysis if cat['score'] >= 75]
        weak_areas = [cat['category'] for cat in detailed_analysis if cat['score'] < 50 and cat['required_by_job']]
        
        summary = f"Experience Score: {final_score}%\n\n"
        
        if years_analysis['meets_requirement']:
            summary += f"✅ Experience Duration: {years_analysis['resume_years']} years (meets {years_analysis['required_years']} year requirement)\n"
        else:
            summary += f"⚠️ Experience Duration: {years_analysis['resume_years']} years (needs {years_analysis['gap']} more years)\n"
        
        if strong_areas:
            summary += f"💪 Strong Areas: {', '.join(strong_areas)}\n"
        
        if weak_areas:
            summary += f"🎯 Areas to Develop: {', '.join(weak_areas)}\n"
        
        return summary
    
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
    
    def _generate_summary(self, score: int, skills_analysis: Dict[str, Any] = None, experience_analysis: Dict[str, Any] = None) -> str:
        """Generate detailed, personalized summary"""
        base_summary = ""
        
        if score >= 85:
            base_summary = "🎯 Excellent Match! Your resume strongly aligns with this job opportunity."
        elif score >= 70:
            base_summary = "✅ Very Good Match - You're a strong candidate with minor areas for improvement."
        elif score >= 55:
            base_summary = "👍 Good Match - Solid foundation with some areas that could be enhanced."
        elif score >= 40:
            base_summary = "⚠️ Fair Match - Consider significant improvements to better align with this role."
        else:
            base_summary = "🔄 Needs Work - Substantial revisions needed to align with this opportunity."
        
        detailed_breakdown = f"\n\n📊 DETAILED ANALYSIS:\n"
        
        if skills_analysis:
            total_required = skills_analysis.get('total_required', 0)
            exact_matches = skills_analysis.get('exact_matches', 0)
            partial_matches = skills_analysis.get('partial_matches_count', 0)
            
            detailed_breakdown += f"• Technical Skills: {exact_matches}/{total_required} exact matches"
            if partial_matches > 0:
                detailed_breakdown += f", {partial_matches} partial matches"
            detailed_breakdown += f" ({skills_analysis.get('score', 0)}%)\n"
            
            if skills_analysis.get('critical_missing'):
                detailed_breakdown += f"• ❗ Critical Skills Needed: {', '.join(skills_analysis['critical_missing'])}\n"
            
            if skills_analysis.get('matched'):
                detailed_breakdown += f"• ✅ Strong Skills: {', '.join(skills_analysis['matched'][:5])}\n"
        
        if experience_analysis:
            exp_score = experience_analysis.get('score', 0)
            years_info = experience_analysis.get('years_analysis', {})
            
            detailed_breakdown += f"• Experience Relevance: {exp_score}%\n"
            
            if years_info.get('meets_requirement'):
                detailed_breakdown += f"• ✅ Experience Duration: {years_info.get('resume_years', 0)} years (meets requirement)\n"
            elif years_info.get('gap', 0) > 0:
                detailed_breakdown += f"• ⏰ Experience Gap: Need {years_info['gap']} more years\n"
            
            # Strong and weak experience areas
            if experience_analysis.get('detailed_categories'):
                strong_cats = [cat['category'] for cat in experience_analysis['detailed_categories'] 
                             if cat['score'] >= 75]
                weak_cats = [cat['category'] for cat in experience_analysis['detailed_categories'] 
                           if cat['score'] < 50 and cat['required_by_job']]
                
                if strong_cats:
                    detailed_breakdown += f"• 💪 Experience Strengths: {', '.join(strong_cats[:3])}\n"
                if weak_cats:
                    detailed_breakdown += f"• 🎯 Experience Gaps: {', '.join(weak_cats[:3])}\n"
        
        # Recommendations based on score
        recommendations = "\n\n🎯 IMMEDIATE ACTION ITEMS:\n"
        if score >= 85:
            recommendations += "• Polish your resume formatting and ensure no typos\n"
            recommendations += "• Prepare for behavioral and technical interviews\n"
            recommendations += "• Research the company culture and recent developments\n"
        elif score >= 70:
            recommendations += "• Address the 1-2 critical missing skills mentioned above\n"
            recommendations += "• Add specific metrics to your achievement statements\n"
            recommendations += "• Tailor your resume summary to this specific role\n"
        elif score >= 40:
            recommendations += "• Focus on learning the critical missing technical skills\n"
            recommendations += "• Build 1-2 projects demonstrating relevant technologies\n"
            recommendations += "• Consider gaining relevant experience through internships or freelance work\n"
        else:
            recommendations += "• Significant upskilling needed in core technologies\n"
            recommendations += "• Consider formal training or bootcamp in required skills\n"
            recommendations += "• Build a portfolio of projects using job-relevant technologies\n"
        
        return base_summary + detailed_breakdown + recommendations

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
