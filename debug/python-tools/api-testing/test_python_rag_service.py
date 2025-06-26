"""
Test script for the Python RAG service
"""

import requests
import json

# Test data
sample_resume = """
John Doe
Software Engineer

Experience:
- 3+ years of React development at TechCorp Inc.
- Built multiple Next.js applications with server-side rendering
- Strong JavaScript and TypeScript skills
- Experience with HTML5, CSS3, and responsive design
- Worked with REST APIs and GraphQL
- Used Git for version control

Education:
- Bachelor of Computer Science, MIT (2019)
- GPA: 3.8/4.0

Skills:
- Frontend: React, Next.js, JavaScript, TypeScript, HTML5, CSS3
- Styling: Sass, Tailwind CSS, Bootstrap
- Backend: Node.js, Express.js (basic)
- Databases: MongoDB, PostgreSQL (basic)
- Tools: Git, GitHub, VS Code, Webpack
- Development: Agile methodology, Test-driven development
"""

sample_job = """
Frontend Developer Position

We are looking for a skilled Frontend Developer with expertise in React, Next.js, and modern JavaScript. 
The ideal candidate should have experience with UI/UX design principles and be comfortable working in an agile environment.

Requirements:
- 2+ years of React experience
- Experience with Next.js framework
- Strong JavaScript/TypeScript skills
- Knowledge of HTML5, CSS3, and responsive design
- Experience with version control (Git)
- Understanding of responsive design principles
- Agile development experience
- Good communication skills

Nice to have:
- Experience with testing frameworks (Jest, React Testing Library)
- Knowledge of state management (Redux, Zustand)
- Backend development experience
- Cloud platform experience (AWS, Vercel)
"""

def test_python_service():
    """Test the Python RAG service"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Python RAG Service...")
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Health check: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test analysis
    try:
        print("\n🚀 Testing analysis...")
        analysis_data = {
            "resume_text": sample_resume,
            "job_description": sample_job,
            "job_title": "Frontend Developer",
            "job_requirements": ["React", "Next.js", "JavaScript", "HTML/CSS", "Git"]
        }
        
        response = requests.post(f"{base_url}/analyze", json=analysis_data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis successful!")
            print(f"📊 Analysis preview: {result['data']['analysis']['comprehensiveAnalysis'][:200]}...")
        else:
            print(f"❌ Analysis failed: {response.status_code} - {response.text}")
            return
            
    except Exception as e:
        print(f"❌ Analysis test failed: {e}")
        return
    
    # Test chat
    try:
        print("\n💬 Testing chat...")
        chat_data = {
            "question": "What are the main strengths of this candidate?",
            "session_id": "test"
        }
        
        response = requests.post(f"{base_url}/chat", json=chat_data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Chat successful!")
            print(f"💬 Chat response: {result['data']['response'][:200]}...")
        else:
            print(f"❌ Chat failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Chat test failed: {e}")
    
    print("\n🎉 Python service test completed!")

if __name__ == "__main__":
    test_python_service()
