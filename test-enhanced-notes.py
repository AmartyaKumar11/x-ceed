"""
Test the enhanced notes generation with timestamps
"""
import os
import requests
import json
import time

def load_env_file():
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env_file()

def test_enhanced_notes():
    # Test with a known educational video
    video_id = "_uQrJ0TkZlc"  # freeCodeCamp Machine Learning Course
    
    print(f"🧪 Testing enhanced notes generation for video: {video_id}")
      # Test the /notes endpoint
    try:
        print("📝 Requesting enhanced notes...")
        response = requests.post(
            "http://localhost:8003/generate-notes",
            json={"video_id": video_id},
            timeout=60  # Longer timeout for notes generation
        )
        
        if response.status_code == 200:
            result = response.json()
            notes = result.get('notes', '')
            
            print("✅ Enhanced notes generated successfully!")
            print(f"📄 Notes length: {len(notes)} characters")
            print("\n" + "="*50)
            print("SAMPLE OF ENHANCED NOTES:")
            print("="*50)
            print(notes[:2000])  # Show first 2000 characters
            print("...")
            print("="*50)
            
            # Check if notes contain timestamps
            timestamp_indicators = ['[', ']', ':', 'Starting at', 'timestamp']
            has_timestamps = any(indicator in notes for indicator in timestamp_indicators)
            
            if has_timestamps:
                print("✅ Notes appear to contain timestamps!")
            else:
                print("⚠️ Notes may not contain timestamps")
                
        else:
            print(f"❌ Error response: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing enhanced notes: {e}")

def test_python_service_running():
    """Check if Python service is running"""
    try:
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code == 200:
            print("✅ Python service is running")
            return True
        else:
            print(f"❌ Python service returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Python service not reachable: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Enhanced Notes Generation")
    print("="*50)
    
    if test_python_service_running():
        test_enhanced_notes()
    else:
        print("Please start the Python service first:")
        print("python video_ai_service.py")
