import requests
import json

def test_python_connection():
    """Test if Python service is accessible"""
    try:
        # Test health check
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"📋 Service info: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_analysis_endpoint():
    """Test the analysis endpoint with sample data"""
    if not test_python_connection():
        return False
    
    try:
        test_data = {
            "resume_text": "John Doe\nSoftware Developer\n5 years React experience",
            "job_description": "Looking for React developer with 3+ years experience",
            "job_title": "React Developer",
            "job_requirements": ["React", "JavaScript"]
        }
        
        print("\n🧪 Testing analysis endpoint...")
        response = requests.post(
            "http://localhost:8000/analyze",
            json=test_data,
            timeout=30
        )
        
        print(f"📊 Analysis response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis successful!")
            print(f"🔍 Response structure: {list(result.keys())}")
            if result.get('success'):
                analysis = result.get('data', {}).get('analysis', {})
                print(f"📈 Analysis keys: {list(analysis.keys())}")
                if analysis.get('comprehensiveAnalysis'):
                    print(f"📄 Analysis preview: {analysis['comprehensiveAnalysis'][:100]}...")
                    return True
            return False
        else:
            print(f"❌ Analysis failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Analysis test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Python RAG Service Connection...")
    success = test_analysis_endpoint()
    print(f"\n{'✅ All tests passed!' if success else '❌ Tests failed!'}")
