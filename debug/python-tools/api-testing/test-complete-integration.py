"""
Test the complete video AI integration by making requests to both services
"""
import requests
import json
import time

def test_python_service():
    """Test the Python video AI service directly"""
    print("🧪 Testing Python Video AI Service...")
    
    # Test health endpoint
    try:
        health_response = requests.get('http://localhost:8001/health', timeout=5)
        if health_response.status_code == 200:
            print("✅ Python service health check passed")
        else:
            print(f"❌ Health check failed: {health_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot reach Python service: {e}")
        return False
    
    # Test chat endpoint with a sample YouTube video
    test_video_id = "dQw4w9WgXcQ"  # Rick Roll - widely available
    test_payload = {
        "message": "Can you help me create notes for this video?",
        "video_id": test_video_id,
        "video_title": "Rick Astley - Never Gonna Give You Up",
        "video_channel": "RickAstleyVEVO", 
        "conversation_history": []
    }
    
    try:
        print(f"📹 Testing with video ID: {test_video_id}")
        chat_response = requests.post(
            'http://localhost:8001/chat',
            json=test_payload,
            timeout=30
        )
        
        if chat_response.status_code == 200:
            data = chat_response.json()
            print("✅ Chat endpoint responded successfully")
            print(f"📝 Response preview: {data.get('response', '')[:100]}...")
            
            if data.get('notes'):
                print("📋 Notes generation: ✅")
            if data.get('clips'):
                print(f"✂️ Clips generated: {len(data.get('clips', []))} clips")
            
            return True
        else:
            print(f"❌ Chat request failed: {chat_response.status_code}")
            print(f"Response: {chat_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chat request error: {e}")
        return False

def test_nextjs_api():
    """Test the Next.js API route"""
    print("\n🌐 Testing Next.js API Integration...")
    
    test_payload = {
        "message": "What is this video about?",
        "videoId": "dQw4w9WgXcQ",
        "videoTitle": "Rick Astley - Never Gonna Give You Up", 
        "videoChannel": "RickAstleyVEVO",
        "conversationHistory": []
    }
    
    try:
        api_response = requests.post(
            'http://localhost:3002/api/video-ai-assistant',
            json=test_payload,
            timeout=30
        )
        
        if api_response.status_code == 200:
            data = api_response.json()
            print("✅ Next.js API responded successfully")
            print(f"🔗 Data source: {data.get('source', 'unknown')}")
            print(f"📝 Response preview: {data.get('response', '')[:100]}...")
            return True
        else:
            print(f"❌ Next.js API failed: {api_response.status_code}")
            print(f"Response: {api_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Next.js API error: {e}")
        return False

def main():
    print("🚀 Testing Complete Video AI Integration\n")
    
    # Test Python service
    python_success = test_python_service()
    
    # Test Next.js API
    nextjs_success = test_nextjs_api()
    
    print(f"\n📊 Test Results:")
    print(f"Python Service: {'✅ PASS' if python_success else '❌ FAIL'}")
    print(f"Next.js API: {'✅ PASS' if nextjs_success else '❌ FAIL'}")
    
    if python_success and nextjs_success:
        print(f"\n🎉 All tests passed! The video AI assistant is ready to use.")
        print(f"🌐 Frontend: http://localhost:3002/video-ai-assistant")
        print(f"🔧 Python API: http://localhost:8001")
    else:
        print(f"\n❌ Some tests failed. Check the services and try again.")

if __name__ == "__main__":
    main()
