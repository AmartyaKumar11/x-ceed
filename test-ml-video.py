"""
Test the Machine Learning video specifically
"""
import requests
import json

def test_ml_video():
    """Test with the Machine Learning course video"""
    
    video_id = "i_LwzRVP7bg"
    video_title = "Machine Learning for Everybody – Full Course"
    
    # Test chat request for notes
    payload = {
        "message": "Create comprehensive notes for this machine learning course with specific timestamps and clip suggestions",
        "video_id": video_id,
        "video_title": video_title,
        "video_channel": "freeCodeCamp.org",
        "conversation_history": []
    }
    
    print(f"🧪 Testing ML Course Video")
    print(f"📹 Video: {video_title}")
    print(f"🆔 ID: {video_id}")
    
    try:
        response = requests.post(
            'http://localhost:8001/chat',
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ SUCCESS!")
            print(f"📝 Response length: {len(data['response'])} characters")
            
            if data.get('notes'):
                print(f"📋 Notes generated: {len(data['notes'])} characters")
                print(f"📄 Notes preview:")
                print("=" * 80)
                print(data['notes'])
                print("=" * 80)
            
            if data.get('clips'):
                print(f"✂️ Clips generated: {len(data['clips'])} clips")
                for i, clip in enumerate(data['clips']):
                    mins = clip['start_time'] // 60
                    secs = clip['start_time'] % 60
                    print(f"   {i+1}. {clip['title']}")
                    print(f"      ⏰ {mins:02d}:{secs:02d} - {clip['end_time']//60:02d}:{clip['end_time']%60:02d}")
                    print(f"      📝 {clip['description'][:100]}...")
                    print()
            
            return True
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_ml_video()
    
    if success:
        print(f"\n🎉 ML Video AI is working!")
        print(f"🌐 Frontend URL:")
        print(f"   http://localhost:3002/video-ai-assistant?videoId=i_LwzRVP7bg&title=Machine%20Learning%20Full%20Course&channel=freeCodeCamp")
    else:
        print(f"\n❌ Test failed.")
