import requests
import json

def test_python_analysis():
    """Test the Python analysis endpoint directly"""
    
    test_data = {
        "resume_text": "John Doe\nSoftware Developer\n5 years experience in Python, JavaScript, React\nEducation: BS Computer Science",
        "job_description": "We are looking for a Senior Software Developer with experience in Python and React.",
        "job_title": "Senior Software Developer",
        "job_requirements": ["Python", "React", "5+ years experience"]
    }
    
    try:
        print("🧪 Testing Python analysis service...")
        response = requests.post(
            "http://localhost:8000/analyze",
            json=test_data,
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis successful!")
            print(f"📝 Response structure: {json.dumps(result, indent=2)}")
            
            # Check what we get
            if result.get('success'):
                analysis_data = result.get('data', {}).get('analysis', {})
                if analysis_data.get('comprehensiveAnalysis'):
                    print("🎯 Found comprehensive analysis!")
                    print(f"📄 Analysis preview: {analysis_data['comprehensiveAnalysis'][:200]}...")
                else:
                    print("⚠️ No comprehensive analysis found")
                    print(f"🔍 Available keys: {list(analysis_data.keys())}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_python_analysis()
