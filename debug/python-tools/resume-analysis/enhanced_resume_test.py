"""
Enhanced Resume Format Testing with Better Error Handling
"""

import os
import sys
from ai_resume_analyzer import AIResumeAnalyzer, DocumentProcessor

def test_pdf_robustly(file_path):
    """Test PDF parsing with multiple libraries for robustness"""
    print(f"🔧 Testing PDF with multiple parsers: {file_path}")
    
    # Method 1: PyPDF2
    try:
        text1 = DocumentProcessor.extract_text_from_pdf(file_path)
        print(f"   PyPDF2: {len(text1)} characters extracted")
        if len(text1) > 0:
            return text1
    except Exception as e:
        print(f"   PyPDF2 failed: {str(e)}")
    
    # Method 2: Try alternative PDF parsing
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text2 = ""
        for page in doc:
            text2 += page.get_text()
        doc.close()
        print(f"   PyMuPDF: {len(text2)} characters extracted")
        if len(text2) > 0:
            return text2
    except ImportError:
        print("   PyMuPDF not available")
    except Exception as e:
        print(f"   PyMuPDF failed: {str(e)}")
    
    # Method 3: Try pdfplumber
    try:
        import pdfplumber
        text3 = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text3 += page.extract_text() or ""
        print(f"   pdfplumber: {len(text3)} characters extracted")
        if len(text3) > 0:
            return text3
    except ImportError:
        print("   pdfplumber not available")
    except Exception as e:
        print(f"   pdfplumber failed: {str(e)}")
    
    print("   ❌ All PDF parsing methods failed")
    return ""

def create_sample_resumes():
    """Create sample resume files for testing"""
    
    # Sample resume content
    sample_resume_text = """
John Smith
Senior Frontend Developer
Email: john.smith@email.com | Phone: (555) 123-4567

PROFESSIONAL SUMMARY
Experienced Senior Frontend Developer with 6+ years of expertise in React, TypeScript, JavaScript, HTML5, and CSS3. 
Proven track record of building scalable web applications and leading development teams.

TECHNICAL SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Redux
• Backend: Node.js, Express.js, RESTful APIs
• Databases: MongoDB, PostgreSQL, MySQL
• Tools: Git, Docker, Webpack, VS Code
• Cloud: AWS, Azure, Google Cloud Platform

PROFESSIONAL EXPERIENCE

Senior Frontend Developer | TechCorp Inc. | 2020 - Present
• Led development of customer-facing web applications using React and TypeScript
• Improved application performance by 40% through code optimization
• Mentored junior developers and conducted code reviews
• Collaborated with UX/UI designers to implement responsive designs

Frontend Developer | WebSolutions Ltd. | 2018 - 2020
• Developed and maintained multiple client websites using JavaScript and React
• Implemented RESTful API integrations
• Worked with cross-functional teams in Agile environment

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014 - 2018

PROJECTS
• E-commerce Platform: Built full-stack application using React, Node.js, and MongoDB
• Task Management App: Developed responsive web app with real-time updates
• Portfolio Website: Created personal portfolio showcasing development skills

CERTIFICATIONS
• AWS Certified Developer Associate (2022)
• React Developer Certification (2021)
"""
    
    # Create TXT version
    with open('sample_resume_good.txt', 'w', encoding='utf-8') as f:
        f.write(sample_resume_text)
    
    # Create another sample with different skills
    sample_resume_backend = """
Jane Doe
Backend Developer
Email: jane.doe@email.com | Phone: (555) 987-6543

PROFESSIONAL SUMMARY
Experienced Backend Developer with 4+ years of expertise in Python, Django, PostgreSQL, and cloud technologies.
Strong background in API development and database optimization.

TECHNICAL SKILLS
• Backend: Python, Django, Flask, FastAPI
• Databases: PostgreSQL, MySQL, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, Jenkins, Postman

PROFESSIONAL EXPERIENCE

Backend Developer | DataSystems Inc. | 2020 - Present
• Developed RESTful APIs using Django and FastAPI
• Optimized database performance resulting in 50% faster queries
• Implemented microservices architecture using Docker

Junior Developer | StartupTech | 2019 - 2020
• Built web applications using Python and Flask
• Worked with PostgreSQL databases

EDUCATION
Master of Science in Software Engineering
Tech University | 2017 - 2019
"""
    
    with open('sample_resume_backend.txt', 'w', encoding='utf-8') as f:
        f.write(sample_resume_backend)
    
    print("✅ Created sample resume files:")
    print("   - sample_resume_good.txt (Frontend developer - should score high)")
    print("   - sample_resume_backend.txt (Backend developer - should score lower)")

def main():
    print("🚀 ENHANCED RESUME FORMAT TESTING")
    print("="*50)
    
    # Create sample resumes if they don't exist
    if not os.path.exists('sample_resume_good.txt'):
        create_sample_resumes()
    
    # Test files
    test_files = []
    for file in os.listdir('.'):
        if file.lower().endswith(('.pdf', '.docx', '.doc', '.txt')) and 'sample_resume' in file:
            test_files.append(file)
    
    if not test_files:
        print("📁 No sample resume files found. Creating them...")
        create_sample_resumes()
        test_files = ['sample_resume_good.txt', 'sample_resume_backend.txt']
    
    analyzer = AIResumeAnalyzer()
    
    for file_path in test_files:
        print(f"\n" + "="*70)
        print(f"🧪 TESTING: {file_path}")
        print("="*70)
        
        try:
            # Extract text based on file type
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.pdf':
                extracted_text = test_pdf_robustly(file_path)
            elif file_ext in ['.docx', '.doc']:
                extracted_text = DocumentProcessor.extract_text_from_docx(file_path)
            elif file_ext == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
            else:
                print(f"❌ Unsupported file type: {file_ext}")
                continue
            
            print(f"📊 Extracted text length: {len(extracted_text)} characters")
            
            if len(extracted_text) == 0:
                print("⚠️ WARNING: No text extracted!")
                continue
            
            # Show key sections
            print(f"📋 Resume preview (first 400 chars):")
            print("-" * 50)
            print(extracted_text[:400] + ("..." if len(extracted_text) > 400 else ""))
            print("-" * 50)
            
            # AI Analysis
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
            The ideal candidate should have 5+ years of experience in frontend development and modern web technologies.
            '''
            
            print("🤖 Running AI analysis...")
            analysis = analyzer.analyze_resume_for_job(extracted_text, job_description, job_requirements)
            
            print(f"\n📊 ANALYSIS RESULTS:")
            print(f"   🎯 Overall Score: {analysis['overall_score']}%")
            print(f"   🔧 Skills Match: {analysis['skill_match_score']}%")
            print(f"   💼 Experience: {analysis['experience_score']}%")
            print(f"   🎓 Education: {analysis['education_score']}%")
            
            if analysis.get('criteria_analysis', {}).get('technical_skills'):
                tech_skills = analysis['criteria_analysis']['technical_skills']
                print(f"   ✅ Found Skills: {tech_skills.get('found_skills', [])}")
                print(f"   ❌ Missing Skills: {tech_skills.get('missing_skills', [])}")
            
            print(f"\n💪 TOP STRENGTHS:")
            for i, strength in enumerate(analysis.get('strengths', [])[:3], 1):
                print(f"   {i}. {strength}")
            
            print(f"\n⚠️ MAIN WEAKNESSES:")
            for i, weakness in enumerate(analysis.get('weaknesses', [])[:3], 1):
                print(f"   {i}. {weakness}")
            
            print(f"\n🎭 Recommendation: {analysis.get('recommendation', 'N/A')}")
            
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            import traceback
            print(f"🔍 Details: {traceback.format_exc()}")
    
    print(f"\n" + "="*70)
    print("🎯 TESTING COMPLETE")
    print("="*70)
    print("💡 Tips for better resume parsing:")
    print("   • Use high-quality PDF files with selectable text")
    print("   • DOCX files generally parse better than PDFs")
    print("   • Avoid image-based or scanned resumes")
    print("   • Test with simple TXT format first")

if __name__ == "__main__":
    main()
