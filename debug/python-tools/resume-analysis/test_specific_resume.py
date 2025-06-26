"""
Quick Resume File Tester
Test specific resume files to see what's being extracted
"""

import os
import sys
from ai_resume_analyzer import AIResumeAnalyzer, DocumentProcessor

def test_specific_resume(file_path):
    """Test a specific resume file"""
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    print(f"🔍 TESTING RESUME: {file_path}")
    print("=" * 60)
    
    try:
        # Extract text based on file extension
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
        else:
            print(f"❌ Unsupported file type: {file_ext}")
            return
        
        print(f"📊 Extracted text length: {len(extracted_text)} characters")
        
        if len(extracted_text) == 0:
            print("❌ NO TEXT EXTRACTED!")
            print("🔍 This file cannot be read properly")
            print("💡 Possible issues:")
            print("   • PDF is image-based (scanned document)")
            print("   • File is corrupted")
            print("   • Unsupported format")
            print("   • Password protected")
            return
        
        # Show first 500 characters
        print(f"\n📋 EXTRACTED TEXT (first 500 chars):")
        print("-" * 50)
        print(extracted_text[:500] + ("..." if len(extracted_text) > 500 else ""))
        print("-" * 50)
        
        # Quick AI analysis
        analyzer = AIResumeAnalyzer()
        
        job_requirements = {
            'title': 'Senior Frontend Developer',
            'department': 'Engineering',
            'level': 'senior',
            'required_skills': ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
            'experience_years': '5+ years',
            'education': 'Bachelor degree preferred'
        }
        
        job_description = 'Senior Frontend Developer with React, TypeScript, JavaScript expertise needed.'
        
        print(f"\n🤖 RUNNING AI ANALYSIS...")
        analysis = analyzer.analyze_resume_for_job(extracted_text, job_description, job_requirements)
        
        print(f"\n📊 RESULTS:")
        print(f"   Overall Score: {analysis['overall_score']}%")
        print(f"   Skills Match: {analysis['skill_match_score']}%")
        print(f"   Experience: {analysis['experience_score']}%")
        print(f"   Education: {analysis['education_score']}%")
        
        if analysis.get('criteria_analysis', {}).get('technical_skills'):
            skills = analysis['criteria_analysis']['technical_skills']
            print(f"   Found Skills: {skills.get('found_skills', [])}")
            print(f"   Missing Skills: {skills.get('missing_skills', [])}")
        
        print(f"\n✅ STRENGTHS:")
        for strength in analysis.get('strengths', [])[:3]:
            print(f"   • {strength}")
        
        print(f"\n⚠️ WEAKNESSES:")
        for weakness in analysis.get('weaknesses', [])[:3]:
            print(f"   • {weakness}")
        
        print(f"\n🎯 RECOMMENDATION: {analysis.get('recommendation', 'N/A')}")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        print(f"🔍 Details: {traceback.format_exc()}")

def main():
    print("🔧 RESUME FILE TESTER")
    print("=" * 30)
    
    if len(sys.argv) > 1:
        # Test specific file provided as argument
        file_path = sys.argv[1]
        test_specific_resume(file_path)
    else:
        # Interactive mode
        print("💡 Usage:")
        print("   python test_specific_resume.py <resume_file_path>")
        print("\n📁 Or place your resume files in this directory and I'll find them:")
        
        # Look for resume files
        resume_files = []
        for file in os.listdir('.'):
            if file.lower().endswith(('.pdf', '.docx', '.doc', '.txt')) and not file.startswith('sample_'):
                resume_files.append(file)
        
        if resume_files:
            print(f"\n🔍 Found resume files:")
            for i, file in enumerate(resume_files, 1):
                print(f"   {i}. {file}")
            
            try:
                choice = input(f"\nEnter number (1-{len(resume_files)}) to test: ")
                idx = int(choice) - 1
                if 0 <= idx < len(resume_files):
                    test_specific_resume(resume_files[idx])
                else:
                    print("❌ Invalid choice")
            except (ValueError, KeyboardInterrupt):
                print("❌ Invalid input")
        else:
            print("❌ No resume files found in current directory")

if __name__ == "__main__":
    main()
