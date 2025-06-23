"""
Test the AI Resume Analyzer with actual resume file reading
"""

from ai_resume_analyzer import AIResumeAnalyzer
import os

def test_with_actual_resume():
    analyzer = AIResumeAnalyzer()
    
    # Check if test resume exists
    test_resume_path = "test-resume.pdf"
    resume_exists = os.path.exists(test_resume_path)
    
    print(f"🔍 Test resume file exists: {resume_exists}")
    if resume_exists:
        print(f"📄 Test resume file: {os.path.abspath(test_resume_path)}")
    
    # Test job data
    sample_job = {
        'title': 'Senior Frontend Developer',
        'department': 'Engineering', 
        'level': 'senior',
        'description': 'We are looking for a Senior Frontend Developer with expertise in React, TypeScript, JavaScript, HTML, CSS, and modern web technologies. Experience with Node.js and MongoDB is a plus.'
    }
    
    # Test candidates - one with resume file path
    sample_candidates = [
        {
            '_id': '12345',
            'applicantName': 'John Doe',
            'applicantEmail': 'john@example.com',
            'skills': ['React', 'JavaScript', 'TypeScript', 'CSS'],
            'experience': '6 years in frontend development',
            'education': 'Bachelor in Computer Science',
            'resumePath': '/uploads/application-resumes/test-resume.pdf' if resume_exists else None
        },
        {
            '_id': '67890', 
            'applicantName': 'Jane Smith',
            'applicantEmail': 'jane@example.com',
            'skills': ['Python', 'Django', 'PostgreSQL'],
            'experience': '4 years in backend development',
            'education': 'Master in Software Engineering'
        }
    ]
    
    try:
        print("🚀 Starting AI shortlisting analysis...")
        shortlisted = analyzer.shortlist_candidates(sample_job, sample_candidates)
        
        print("\n" + "="*60)
        print("📊 AI SHORTLISTING RESULTS")
        print("="*60)
        
        for i, candidate in enumerate(shortlisted, 1):
            print(f"\n🏆 RANK #{i}: {candidate.candidate_name}")
            print(f"   Overall Score: {candidate.overall_score}%")
            print(f"   Skills Match: {candidate.skill_match_score}%")
            print(f"   Experience: {candidate.experience_score}%")
            print(f"   Education: {candidate.education_score}%")
            print(f"   Recommendation: {candidate.recommendation}")
            print(f"   Strengths: {', '.join(candidate.strengths[:3])}")
            print(f"   Weaknesses: {', '.join(candidate.weaknesses[:2])}")
            
        print("\n✅ AI Analysis completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during AI analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_with_actual_resume()
