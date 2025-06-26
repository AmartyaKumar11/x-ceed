"""
Test the working video AI service with the Python course video
"""
import requests
import json

def test_python_course_video():
    """Test with the Python Full Course video"""
    
    video_id = "_uQrJ0TkZlc"
    video_title = "Python Full Course for Beginners - Programming with Mosh"
    
    # Test chat request for notes
    payload = {
        "message": "Can you create detailed notes for this Python course video?",
        "video_id": video_id,
        "video_title": video_title,
        "video_channel": "Programming with Mosh",
        "conversation_history": []
    }
    
    print(f"🧪 Testing Video AI with Python Course")
    print(f"📹 Video: {video_title}")
    print(f"🆔 ID: {video_id}")
    print(f"💬 Request: {payload['message']}")
    
    try:
        response = requests.post(
            'http://localhost:8001/chat',
            json=payload,
            timeout=60  # Longer timeout for transcript processing
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ SUCCESS!")
            print(f"📝 Response: {data['response'][:200]}...")
            
            if data.get('notes'):
                print(f"📋 Notes generated: {len(data['notes'])} characters")
                print(f"📄 Notes preview:")
                print("=" * 50)
                print(data['notes'][:500] + "...")
                print("=" * 50)
            
            if data.get('clips'):
                print(f"✂️ Clips generated: {len(data['clips'])} clips")
                for i, clip in enumerate(data['clips'][:3]):  # Show first 3
                    print(f"   {i+1}. {clip['title']} ({clip['start_time']}s-{clip['end_time']}s)")
            
            return True
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_python_course_video()
    
    if success:
        print(f"\n🎉 Video AI is working perfectly!")
        print(f"🌐 Try it in the frontend:")
        print(f"   http://localhost:3002/video-ai-assistant?videoId=_uQrJ0TkZlc&title=Python%20Full%20Course&channel=Programming%20with%20Mosh")
    else:
        print(f"\n❌ Test failed. Check the service logs.")
