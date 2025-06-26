"""
Direct resume format testing script
Test different resume formats (PDF, DOCX, TXT) and see parsing results
"""

import os
import sys
from ai_resume_analyzer import AIResumeAnalyzer, DocumentProcessor

def test_resume_formats():
    """Test different resume file formats"""
    
    print("🔍 RESUME FORMAT TESTING TOOL")
    print("=" * 50)
    
    # Look for test files in the current directory
    test_files = []
    for file in os.listdir('.'):
        if file.lower().endswith(('.pdf', '.docx', '.doc', '.txt')):
            test_files.append(file)
    
    if not test_files:
        print("❌ No test resume files found!")
        print("💡 Place some resume files (.pdf, .docx, .txt) in the current directory")
        return
    
    print(f"📁 Found {len(test_files)} test files:")
    for i, file in enumerate(test_files, 1):
        print(f"   {i}. {file}")
    
    # Test each file
    analyzer = AIResumeAnalyzer()
    
    for file_path in test_files:
        print(f"\n" + "="*60)
        print(f"🧪 TESTING: {file_path}")
        print("="*60)
        
        try:
            # Extract text
            file_ext = os.path.splitext(file_path)[1].lower()
            print(f"📄 File type: {file_ext}")
            
            extracted_text = ""
            if file_ext == '.pdf':
                extracted_text = DocumentProcessor.extract_text_from_pdf(file_path)
            elif file_ext in ['.docx', '.doc']:
                extracted_text = DocumentProcessor.extract_text_from_docx(file_path)
            elif file_ext == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
            
            print(f"📊 Extracted text length: {len(extracted_text)} characters")
            
            if len(extracted_text) == 0:
                print("⚠️ WARNING: No text extracted from this file!")
                print("🔍 This might indicate a parsing issue with this file format")
                continue
            
            # Show first 300 characters
            print(f"📋 First 300 characters:")
            print("-" * 40)
            print(extracted_text[:300] + ("..." if len(extracted_text) > 300 else ""))
            print("-" * 40)
            
            # Test job requirements
            job_requirements = {
                'title': 'Senior Frontend Developer',
                'department': 'Engineering',
                'level': 'senior',
                'required_skills': ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
                'experience_years': '5+ years',
                'education': 'Bachelor degree preferred'
            }
            
            job_description = '''
            We are looking for a Senior Frontend Developer with expertise in React, TypeScript, JavaScript, HTML, CSS, and Node.js. 
            The ideal candidate should have 5+ years of experience in frontend development and be familiar with modern web technologies.
            Experience with MongoDB, PostgreSQL, and cloud platforms like AWS is a plus.
            '''
            
            print("🤖 Running AI analysis...")
            analysis = analyzer.analyze_resume_for_job(extracted_text, job_description, job_requirements)
            
            print(f"📊 ANALYSIS RESULTS:")
            print(f"   Overall Score: {analysis['overall_score']}%")
            print(f"   Skills Match: {analysis['skill_match_score']}%")
            print(f"   Experience: {analysis['experience_score']}%")
            print(f"   Education: {analysis['education_score']}%")
            print(f"   Recommendation: {analysis.get('recommendation', 'N/A')}")
            
            print(f"✅ Strengths:")
            for strength in analysis.get('strengths', [])[:3]:
                print(f"     • {strength}")
            
            print(f"⚠️ Weaknesses:")
            for weakness in analysis.get('weaknesses', [])[:3]:
                print(f"     • {weakness}")
            
        except Exception as e:
            print(f"❌ ERROR processing {file_path}: {str(e)}")
            import traceback
            print(f"🔍 Traceback: {traceback.format_exc()}")
    
    print(f"\n" + "="*60)
    print("🎯 TESTING COMPLETE")
    print("="*60)

if __name__ == "__main__":
    test_resume_formats()
