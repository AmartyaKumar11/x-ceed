"""
Test script to verify Gemini chat service is working
"""
import requests
import json

# Test the Gemini chat service
def test_gemini_chat():
    url = "http://localhost:8001/chat"
    
    test_data = {
        "question": "Hello, can you help me analyze my resume for a software engineer position?",
        "session_id": "test-session",
        "conversation_history": [],
        "context": {
            "job_title": "Software Engineer",
            "job_description": "We are looking for a skilled software engineer with experience in Python and JavaScript.",
            "analysis_result": "Good match for technical skills"
        }
    }
    
    try:
        print("🧪 Testing Gemini Chat Service...")
        print(f"📡 Sending request to: {url}")
        
        response = requests.post(url, json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Gemini Chat Service responded!")
            print(f"📋 Full response: {json.dumps(result, indent=2)}")
            
            if result.get('success'):
                print(f"📝 Response content: {result.get('response', 'No response')[:200]}...")
                return True
            else:
                print(f"❌ Service error: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Gemini chat service on port 8001")
        print("Make sure the service is running: python gemini_resume_chat_service.py")
        return False
    except Exception as e:
        print(f"❌ Error testing chat service: {e}")
        return False

if __name__ == "__main__":
    test_gemini_chat()
