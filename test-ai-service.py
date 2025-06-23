"""
Test the AI Resume Analysis Service
"""
import requests
import json
import os
from datetime import datetime

def load_env_file():
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env_file()

def test_ai_service_health():
    """Test if AI service is running"""
    try:
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ AI Service is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Version: {data.get('version')}")
            print(f"   AI Analyzer: {data.get('ai_analyzer_status')}")
            return True
        else:
            print(f"❌ AI Service returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI Service not reachable: {e}")
        return False

def test_ai_analysis():
    """Test AI analysis with sample data"""
    try:
        # Sample job and candidate data
        test_data = {
            "job": {
                "id": "test123",
                "title": "Senior Frontend Developer",
                "department": "Engineering",
                "level": "senior",
                "description": "We are looking for a Senior Frontend Developer with expertise in React, TypeScript, and modern web technologies.",
                "jobDescriptionText": "Required: React, JavaScript, TypeScript, CSS, HTML. Experience with Node.js is a plus.",
                "requirements": ["React", "TypeScript", "JavaScript"]
            },
            "candidates": [
                {
                    "_id": "candidate1",
                    "applicantId": "app1",
                    "applicantName": "John Doe",
                    "applicantEmail": "john@example.com",
                    "skills": ["React", "JavaScript", "TypeScript", "CSS", "Node.js"],
                    "experience": "5 years of frontend development experience with React and TypeScript",
                    "education": "Bachelor's in Computer Science",
                    "coverLetter": "I am passionate about frontend development and have extensive experience with React.",
                    "resumeUrl": "",
                    "status": "pending"
                },
                {
                    "_id": "candidate2", 
                    "applicantId": "app2",
                    "applicantName": "Jane Smith",
                    "applicantEmail": "jane@example.com",
                    "skills": ["HTML", "CSS", "jQuery"],
                    "experience": "2 years web development",
                    "education": "Associate's in Web Design",
                    "coverLetter": "I love creating beautiful websites.",
                    "resumeUrl": "",
                    "status": "pending"
                }
            ]
        }
        
        print("🧪 Testing AI analysis with sample data...")
        response = requests.post(
            "http://localhost:8003/analyze-candidates",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI Analysis completed successfully!")
            print(f"📊 Analyzed {len(result['shortlist'])} candidates")
            
            for i, candidate in enumerate(result['shortlist']):
                print(f"\n🏆 Rank #{i+1}: {candidate['candidate_name']}")
                print(f"   Overall Score: {candidate['overall_score']:.1f}%")
                print(f"   Skills Match: {candidate['skill_match_score']:.1f}%")
                print(f"   Experience: {candidate['experience_score']:.1f}%")
                print(f"   Education: {candidate['education_score']:.1f}%")
                print(f"   Strengths: {', '.join(candidate['strengths'][:2])}")
                
            return True
        else:
            print(f"❌ AI Analysis failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error testing AI analysis: {e}")
        return False

def main():
    print("🤖 Testing AI Resume Analysis Service")
    print("=" * 50)
      # Check if Gemini API key is set
    if not os.getenv('GEMINI_API_KEY'):
        print("⚠️ GEMINI_API_KEY not found in environment")
        print("Please add your Gemini API key to .env.local file")
        print("GEMINI_API_KEY=your_api_key_here")
        print("Get your free API key at: https://makersuite.google.com/app/apikey")
        print()
    
    # Test service health
    if test_ai_service_health():
        print()
        # Test AI analysis
        test_ai_analysis()
    else:
        print("Please start the AI service first:")
        print("python ai_service.py")

if __name__ == "__main__":
    main()
