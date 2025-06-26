#!/usr/bin/env python3
"""
Test script to parse and analyze a resume file directly
"""
import os
import sys
from ai_resume_analyzer import AIResumeAnalyzer, DocumentProcessor

def test_resume_parsing(file_path):
    """Test parsing and analysis of a specific resume"""
    print(f"🔍 Testing resume: {file_path}")
    print("=" * 60)
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    # Get file info
    file_size = os.path.getsize(file_path)
    file_ext = os.path.splitext(file_path)[1].lower()
    
    print(f"📄 File: {os.path.basename(file_path)}")
    print(f"📄 Size: {file_size:,} bytes")
    print(f"📄 Type: {file_ext}")
    print()
    
    try:
        # Extract text
        print("🔄 Extracting text...")
        extracted_text = ""
        
        if file_ext == '.pdf':
            extracted_text = DocumentProcessor.extract_text_from_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            extracted_text = DocumentProcessor.extract_text_from_docx(file_path)
        elif file_ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                extracted_text = f.read()
        else:
            print(f"⚠️ Unsupported file type: {file_ext}")
            return
        
        # Display extraction results
        if extracted_text and len(extracted_text.strip()) > 0:
            print(f"✅ Text extracted successfully!")
            print(f"📝 Length: {len(extracted_text):,} characters")
            print(f"📝 Lines: {len(extracted_text.splitlines())}")
            print()
            
            # Show first 500 characters
            print("📖 First 500 characters:")
            print("-" * 40)
            print(extracted_text[:500])
            if len(extracted_text) > 500:
                print("...")
            print("-" * 40)
            print()
            
            # Test AI Analysis
            print("🤖 Testing AI analysis...")
            try:
                analyzer = AIResumeAnalyzer()
                
                # Sample job data for analysis
                sample_job = {
                    'title': 'Software Developer',
                    'description': 'Looking for a software developer with experience in Python, JavaScript, and web development.',
                    'level': 'mid'
                }
                
                job_requirements = {
                    'title': sample_job['title'],
                    'department': 'Engineering',
                    'level': sample_job['level'],
                    'required_skills': ['Python', 'JavaScript', 'HTML', 'CSS'],
                    'experience_years': '3-5 years',
                    'education': 'Bachelor\'s degree'
                }
                
                analysis = analyzer.analyze_resume_for_job(
                    extracted_text,
                    sample_job['description'],
                    job_requirements
                )
                
                if analysis:
                    print("✅ AI analysis completed!")
                    print(f"🎯 Overall Score: {analysis.get('overall_score', 0)}%")
                    print(f"🔧 Skill Match: {analysis.get('skill_match_score', 0)}%")
                    print(f"💼 Experience: {analysis.get('experience_score', 0)}%")
                    print(f"🎓 Education: {analysis.get('education_score', 0)}%")
                    print()
                    
                    if analysis.get('strengths'):
                        print("💪 Strengths:")
                        for strength in analysis['strengths'][:3]:
                            print(f"   • {strength}")
                        print()
                    
                    if analysis.get('weaknesses'):
                        print("⚠️ Areas for improvement:")
                        for weakness in analysis['weaknesses'][:3]:
                            print(f"   • {weakness}")
                        print()
                    
                    if analysis.get('detailed_feedback'):
                        print(f"📋 Recommendation: {analysis['detailed_feedback']}")
                        print()
                    
                else:
                    print("❌ AI analysis failed")
                    
            except Exception as ai_error:
                print(f"❌ AI analysis error: {str(ai_error)}")
                
        else:
            print("❌ No text could be extracted from the file")
            print("   This might be an image-based PDF or corrupted file")
            
    except Exception as e:
        print(f"❌ Error processing file: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Test files to try
    test_files = [
        "test-resume.pdf",
        "Ayush Yadav_BMU.pdf", 
        "public/uploads/resumes/272f7aa1-6361-417e-bc78-e32a0c4c5977.pdf"
    ]
    
    if len(sys.argv) > 1:
        # Use file specified as argument
        test_resume_parsing(sys.argv[1])
    else:
        # Test available files
        for test_file in test_files:
            if os.path.exists(test_file):
                test_resume_parsing(test_file)
                print("\n" + "="*60 + "\n")
                break
        else:
            print("No test resume files found. Available files:")
            for test_file in test_files:
                status = "✅" if os.path.exists(test_file) else "❌"
                print(f"   {status} {test_file}")
