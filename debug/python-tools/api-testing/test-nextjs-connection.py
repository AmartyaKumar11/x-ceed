"""
Test the Next.js API route directly with the ML video
"""
import requests
import json

def test_nextjs_api_with_ml_video():
    """Test Next.js API with ML video to see if it connects to Python service"""
    
    payload = {
        "message": "Create detailed notes for this machine learning video with timestamps",
        "videoId": "i_LwzRVP7bg",
        "videoTitle": "Machine Learning for Everybody – Full Course",
        "videoChannel": "freeCodeCamp.org",
        "conversationHistory": []
    }
    
    print(f"🧪 Testing Next.js API Route with ML Video")
    print(f"📹 Video: {payload['videoTitle']}")
    print(f"🌐 API: http://localhost:3002/api/video-ai-assistant")
    
    try:
        response = requests.post(
            'http://localhost:3002/api/video-ai-assistant',
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ SUCCESS!")
            print(f"🔗 Source: {data.get('source', 'unknown')}")
            
            if data.get('source') == 'python_service':
                print(f"🎉 CONNECTED TO PYTHON SERVICE!")
                
                if data.get('notes'):
                    print(f"📋 Notes generated: {len(data['notes'])} characters")
                    print(f"📄 Notes preview:")
                    print("=" * 50)
                    print(data['notes'][:300] + "...")
                    print("=" * 50)
                
                if data.get('clips'):
                    print(f"✂️ Clips generated: {len(data['clips'])} clips")
                    for i, clip in enumerate(data['clips'][:2]):
                        print(f"   {i+1}. {clip['title'][:50]}...")
                        print(f"      ⏰ {clip['start_time']}s-{clip['end_time']}s")
            else:
                print(f"⚠️ Fell back to Gemini (no transcript access)")
                print(f"📝 Response: {data.get('response', '')[:200]}...")
            
            return data.get('source') == 'python_service'
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_nextjs_api_with_ml_video()
    
    if success:
        print(f"\n🎉 Next.js API successfully connects to Python service!")
        print(f"🌐 You can now use the frontend with full transcript access")
    else:
        print(f"\n❌ Next.js API is not connecting to Python service")
        print(f"🔧 Check the Next.js server logs for more details")
