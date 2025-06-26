#!/usr/bin/env python3
"""
Debug Resume Parser - Standalone script for testing resume parsing and AI analysis
Called by the Next.js API to analyze uploaded resume files
"""

import sys
import json
import os
from ai_resume_analyzer import AIResumeAnalyzer, DocumentProcessor

def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Usage: python debug_resume_parser.py <file_path> <job_data_json>"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    job_data_json = sys.argv[2]
    
    try:
        # Parse job data
        job_data = json.loads(job_data_json)
        
        # Check if file exists
        if not os.path.exists(file_path):
            result = {
                "error": f"File not found: {file_path}",
                "extractedText": "",
                "analysis": {}
            }
            print(json.dumps(result))
            sys.exit(0)
        
        # Extract text from file
        file_extension = os.path.splitext(file_path)[1].lower()
        extracted_text = ""
        
        print(f"📄 Processing file: {file_path}", file=sys.stderr)
        print(f"📄 File extension: {file_extension}", file=sys.stderr)
        
        if file_extension == '.pdf':
            extracted_text = DocumentProcessor.extract_text_from_pdf(file_path)
        elif file_extension in ['.docx', '.doc']:
            extracted_text = DocumentProcessor.extract_text_from_docx(file_path)
        elif file_extension == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                extracted_text = f.read()
        else:
            extracted_text = f"Unsupported file type: {file_extension}"
        
        print(f"📄 Extracted text length: {len(extracted_text)} characters", file=sys.stderr)
        
        # If we have text, run AI analysis
        analysis = {}
        if extracted_text and len(extracted_text.strip()) > 0:
            try:
                # Initialize AI analyzer
                analyzer = AIResumeAnalyzer()
                
                # Prepare job requirements
                job_requirements = {
                    'title': job_data.get('title', ''),
                    'department': 'Engineering',  # Default
                    'level': job_data.get('level', ''),
                    'required_skills': analyzer._extract_required_skills(job_data),
                    'experience_years': analyzer._extract_experience_requirement(job_data),
                    'education': job_data.get('education', '')
                }
                
                print(f"🤖 Running AI analysis...", file=sys.stderr)
                print(f"🤖 Job requirements: {job_requirements}", file=sys.stderr)
                
                # Run analysis
                analysis = analyzer.analyze_resume_for_job(
                    extracted_text,
                    job_data.get('description', ''),
                    job_requirements
                )
                
                print(f"✅ AI analysis completed. Overall score: {analysis.get('overall_score', 0)}%", file=sys.stderr)
                
            except Exception as ai_error:
                print(f"❌ AI analysis error: {str(ai_error)}", file=sys.stderr)
                analysis = {
                    "overall_score": 0,
                    "skill_match_score": 0,  
                    "experience_score": 0,
                    "education_score": 0,
                    "detailed_feedback": f"AI analysis failed: {str(ai_error)}",
                    "strengths": [],
                    "weaknesses": ["AI analysis unavailable"],
                    "criteria_analysis": {
                        "technical_skills": {
                            "found_skills": [],
                            "missing_skills": [],
                            "reasoning": "Analysis failed"
                        }
                    }
                }
        else:
            analysis = {
                "overall_score": 0,
                "skill_match_score": 0,
                "experience_score": 0,
                "education_score": 0,
                "detailed_feedback": "No text could be extracted from the resume file",
                "strengths": [],
                "weaknesses": ["No extractable content"],
                "criteria_analysis": {
                    "technical_skills": {
                        "found_skills": [],
                        "missing_skills": [],
                        "reasoning": "No text to analyze"
                    }
                }
            }
        
        # Prepare result
        result = {
            "extractedText": extracted_text[:5000],  # Limit to first 5000 chars for display
            "fullTextLength": len(extracted_text),
            "analysis": analysis,
            "fileInfo": {
                "path": file_path,
                "extension": file_extension,
                "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
        }
        
        # Output JSON result
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "extractedText": "",
            "analysis": {}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
