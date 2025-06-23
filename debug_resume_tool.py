"""
Simple Interactive Resume Debug Tool
Upload and test resume files to see what's being extracted
"""

import os
import sys
from ai_resume_analyzer import AIResumeAnalyzer, DocumentProcessor

def show_menu():
    print("\n" + "="*60)
    print("🔧 RESUME DEBUG TOOL")
    print("="*60)
    print("1. Test a specific resume file")
    print("2. Test all resume files in current directory")
    print("3. Create sample resumes for testing")
    print("4. Show file analysis comparison")
    print("5. Exit")
    print("="*60)

def test_file(file_path):
    """Test a specific file and show detailed results"""
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    print(f"\n🔍 ANALYZING: {file_path}")
    print("-" * 50)
    
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
        else:
            print(f"❌ Unsupported file type: {file_ext}")
            return False
        
        print(f"📊 Extracted text length: {len(extracted_text)} characters")
        
        if len(extracted_text) == 0:
            print("❌ NO TEXT EXTRACTED!")
            print("🔍 Possible issues:")
            print("   • PDF is image-based (scanned)")
            print("   • File is corrupted")
            print("   • Password protected")
            print("   • Unsupported format")
            return False
        
        # Show preview
        print(f"\n📋 TEXT PREVIEW (first 300 chars):")
        print("-" * 40)
        print(extracted_text[:300] + ("..." if len(extracted_text) > 300 else ""))
        print("-" * 40)
        
        # AI Analysis
        analyzer = AIResumeAnalyzer()
        
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
        The ideal candidate should have 5+ years of experience in frontend development.
        '''
        
        print("🤖 Running AI analysis...")
        analysis = analyzer.analyze_resume_for_job(extracted_text, job_description, job_requirements)
        
        # Show results
        print(f"\n📊 AI ANALYSIS RESULTS:")
        print(f"   🎯 Overall Score: {analysis['overall_score']}%")
        print(f"   🔧 Skills Match: {analysis['skill_match_score']}%")
        print(f"   💼 Experience: {analysis['experience_score']}%")
        print(f"   🎓 Education: {analysis['education_score']}%")
        
        if analysis.get('criteria_analysis', {}).get('technical_skills'):
            tech = analysis['criteria_analysis']['technical_skills']
            print(f"   ✅ Found Skills: {tech.get('found_skills', [])}")
            print(f"   ❌ Missing Skills: {tech.get('missing_skills', [])}")
        
        print(f"\n💪 STRENGTHS:")
        for i, strength in enumerate(analysis.get('strengths', [])[:3], 1):
            print(f"   {i}. {strength}")
        
        print(f"\n⚠️ WEAKNESSES:")
        for i, weakness in enumerate(analysis.get('weaknesses', [])[:3], 1):
            print(f"   {i}. {weakness}")
        
        print(f"\n🎭 RECOMMENDATION: {analysis.get('recommendation', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        print(f"🔍 Details: {traceback.format_exc()}")
        return False

def test_all_files():
    """Test all resume files in current directory"""
    
    resume_files = []
    for file in os.listdir('.'):
        if file.lower().endswith(('.pdf', '.docx', '.doc', '.txt')):
            resume_files.append(file)
    
    if not resume_files:
        print("❌ No resume files found in current directory")
        print("💡 Place your resume files (.pdf, .docx, .txt) here and try again")
        return
    
    print(f"📁 Found {len(resume_files)} files to test:")
    for i, file in enumerate(resume_files, 1):
        print(f"   {i}. {file}")
    
    for file in resume_files:
        success = test_file(file)
        if success:
            print("✅ Analysis completed")
        else:
            print("❌ Analysis failed")
        
        if file != resume_files[-1]:  # Not the last file
            input("\nPress Enter to continue to next file...")

def create_sample_resumes():
    """Create sample resume files for testing"""
    
    # Good frontend resume
    frontend_resume = """
JOHN SMITH
Senior Frontend Developer
📧 john.smith@email.com | 📱 (555) 123-4567

PROFESSIONAL SUMMARY
Experienced Senior Frontend Developer with 6+ years of expertise in React, TypeScript, JavaScript, HTML5, and CSS3. 
Proven track record of building scalable web applications and leading development teams.

TECHNICAL SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Redux, Next.js
• Backend: Node.js, Express.js, RESTful APIs
• Databases: MongoDB, PostgreSQL, MySQL
• Tools: Git, Docker, Webpack, VS Code, Figma
• Cloud: AWS, Azure, Google Cloud Platform

PROFESSIONAL EXPERIENCE

Senior Frontend Developer | TechCorp Inc. | 2020 - Present
• Led development of customer-facing web applications using React and TypeScript
• Improved application performance by 40% through code optimization and lazy loading
• Mentored 3 junior developers and conducted weekly code reviews
• Collaborated with UX/UI designers to implement pixel-perfect responsive designs
• Built reusable component library reducing development time by 30%

Frontend Developer | WebSolutions Ltd. | 2018 - 2020
• Developed and maintained 15+ client websites using JavaScript and React
• Implemented RESTful API integrations with third-party services
• Worked with cross-functional teams in Agile environment
• Optimized website loading speeds resulting in 25% better user engagement

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2014 - 2018
GPA: 3.8/4.0

PROJECTS
• E-commerce Platform: Built full-stack application using React, Node.js, and MongoDB
• Task Management App: Developed responsive SPA with real-time updates using WebSocket
• Portfolio Website: Created personal portfolio showcasing 10+ development projects

CERTIFICATIONS
• AWS Certified Developer Associate (2022)
• React Developer Certification (2021)
• Google Analytics Certified (2020)
"""
    
    # Backend developer resume (should score lower for frontend role)
    backend_resume = """
JANE DOE
Backend Developer
📧 jane.doe@email.com | 📱 (555) 987-6543

PROFESSIONAL SUMMARY
Experienced Backend Developer with 4+ years of expertise in Python, Django, PostgreSQL, and cloud technologies.
Strong background in API development and database optimization.

TECHNICAL SKILLS
• Backend: Python, Django, Flask, FastAPI
• Databases: PostgreSQL, MySQL, Redis, MongoDB
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, Jenkins, Postman, Linux

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
    
    # Write the files
    with open('sample_frontend_resume.txt', 'w', encoding='utf-8') as f:
        f.write(frontend_resume)
    
    with open('sample_backend_resume.txt', 'w', encoding='utf-8') as f:
        f.write(backend_resume)
    
    print("✅ Created sample resume files:")
    print("   📄 sample_frontend_resume.txt (should score HIGH for frontend role)")
    print("   📄 sample_backend_resume.txt (should score LOW for frontend role)")
    print("\n💡 You can now test these files with option 1 or 2")

def compare_files():
    """Compare analysis results of multiple files"""
    
    resume_files = []
    for file in os.listdir('.'):
        if file.lower().endswith(('.pdf', '.docx', '.doc', '.txt')):
            resume_files.append(file)
    
    if len(resume_files) < 2:
        print("❌ Need at least 2 resume files to compare")
        print("💡 Use option 3 to create sample files first")
        return
    
    print(f"📊 COMPARISON ANALYSIS")
    print("=" * 50)
    
    results = []
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
    
    for file in resume_files:
        try:
            file_ext = os.path.splitext(file)[1].lower()
            extracted_text = ""
            
            if file_ext == '.pdf':
                extracted_text = DocumentProcessor.extract_text_from_pdf(file)
            elif file_ext in ['.docx', '.doc']:
                extracted_text = DocumentProcessor.extract_text_from_docx(file)
            elif file_ext == '.txt':
                with open(file, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
            
            if len(extracted_text) > 0:
                analysis = analyzer.analyze_resume_for_job(extracted_text, job_description, job_requirements)
                results.append({
                    'file': file,
                    'text_length': len(extracted_text),
                    'overall_score': analysis['overall_score'],
                    'skills_score': analysis['skill_match_score'],
                    'experience_score': analysis['experience_score'],
                    'education_score': analysis['education_score']
                })
        except Exception as e:
            print(f"❌ Error processing {file}: {str(e)}")
    
    # Sort by overall score
    results.sort(key=lambda x: x['overall_score'], reverse=True)
    
    print(f"\n📊 RANKING RESULTS:")
    for i, result in enumerate(results, 1):
        print(f"\n🏆 RANK #{i}: {result['file']}")
        print(f"   Overall: {result['overall_score']}%")
        print(f"   Skills: {result['skills_score']}%")
        print(f"   Experience: {result['experience_score']}%")
        print(f"   Education: {result['education_score']}%")
        print(f"   Text Length: {result['text_length']} chars")

def main():
    while True:
        show_menu()
        
        try:
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == '1':
                file_path = input("Enter resume file path: ").strip()
                test_file(file_path)
                
            elif choice == '2':
                test_all_files()
                
            elif choice == '3':
                create_sample_resumes()
                
            elif choice == '4':
                compare_files()
                
            elif choice == '5':
                print("👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()
