"""
Test the enhanced Gemini chat service with resume and job context
"""
import requests
import json

def test_enhanced_gemini_chat():
    url = "http://localhost:8001/chat"
    
    # Sample data that mimics what the frontend would send
    test_data = {
        "question": "Based on my resume, what are my strongest qualifications for this job? What should I improve?",
        "session_id": "test-session",
        "conversation_history": [],
        "context": {
            "jobTitle": "Senior Software Engineer",
            "jobDescription": "We are seeking a Senior Software Engineer with 5+ years of experience in Python, JavaScript, React, and Node.js. Experience with AWS, Docker, and microservices architecture is required. The role involves leading a team of 3-5 developers and architecting scalable solutions.",
            "jobRequirements": ["Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "Microservices", "Team Leadership"],
            "resumeText": "John Doe - Software Engineer\\n\\nExperience:\\n- 4 years at TechCorp as Full Stack Developer\\n- Built web applications using React, Node.js, and Python\\n- Worked with AWS services including EC2, S3, Lambda\\n- Experience with Docker containers\\n- Led 2 junior developers on recent project\\n\\nSkills: Python, JavaScript, React, Node.js, AWS, Docker, Git, MongoDB\\n\\nEducation: BS Computer Science, State University",
            "analysisResult": "Good technical match with 85% compatibility. Strong in required programming languages but lacks microservices experience and needs more leadership experience.",
            "structuredAnalysis": {
                "overallMatch": {
                    "score": 85,
                    "level": "Good"
                }
            }
        }
    }
    
    try:
        print("🧪 Testing Enhanced Gemini Chat Service...")
        print(f"📡 Sending request to: {url}")
        
        response = requests.post(url, json=test_data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                print("✅ Enhanced Gemini Chat Service is working!")
                print(f"📝 Response: {result.get('response', 'No response')[:500]}...")
                
                # Check if the response mentions specific details from the context
                response_text = result.get('response', '').lower()
                
                checks = [
                    ("job title", "senior software engineer" in response_text),
                    ("resume content", any(skill.lower() in response_text for skill in ["python", "javascript", "react", "node.js"])),
                    ("job requirements", any(req.lower() in response_text for req in ["aws", "docker", "microservices"])),
                    ("analysis context", "85" in result.get('response', '') or "good" in response_text)
                ]
                
                print("\n🔍 Context Integration Check:")
                for check_name, passed in checks:
                    status = "✅" if passed else "❌"
                    print(f"   {status} {check_name}: {'PASSED' if passed else 'FAILED'}")
                
                return True
            else:
                print(f"❌ Service error: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Gemini chat service on port 8001")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_enhanced_gemini_chat()
