#!/usr/bin/env python3
"""
Quick test to verify video AI transcript functionality
"""
import sys
import os
sys.path.append('.')

# Load environment
def load_env_file():
    env_file = '.env.local'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env_file()

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    print("✅ YouTube Transcript API imported successfully")
except ImportError as e:
    print("❌ YouTube Transcript API not available:", e)
    print("💡 Install with: pip install youtube-transcript-api")
    sys.exit(1)

def test_transcript_extraction():
    """Test transcript extraction with known working videos"""
    
    # These are educational programming videos that typically have transcripts
    test_videos = [
        {"id": "_uQrJ0TkZlc", "title": "Python Full Course - Programming with Mosh"},
        {"id": "kqtD5dpn9C8", "title": "Python for Beginners - freeCodeCamp"},
        {"id": "rfscVS0vtbw", "title": "Learn Python - Full Course for Beginners"}
    ]
    
    print("🧪 Testing Video AI Transcript Extraction")
    print("=" * 50)
    
    working_videos = []
    
    for video in test_videos:
        video_id = video["id"]
        title = video["title"]
        
        print(f"\n📹 Testing: {title}")
        print(f"🔗 Video ID: {video_id}")
        
        try:
            # Try to get transcript
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id)
            
            if transcript_data:
                print(f"✅ SUCCESS: Found {len(transcript_data)} transcript segments")
                print(f"📝 First segment: '{transcript_data[0]['text'][:100]}...'")
                print(f"⏰ Timestamp: {transcript_data[0]['start']:.1f}s")
                
                # Test the video AI service URL
                video_ai_url = f"http://localhost:3002/video-ai-assistant?videoId={video_id}&title={title.replace(' ', '%20')}&channel=TestChannel"
                print(f"🚀 Test URL: {video_ai_url}")
                
                working_videos.append(video)
            else:
                print("❌ No transcript data returned")
                
        except Exception as e:
            print(f"❌ Failed: {e}")
    
    print(f"\n📊 Summary:")
    print(f"✅ Working videos: {len(working_videos)}/{len(test_videos)}")
    
    if working_videos:
        print(f"\n🎯 Test these videos in your video AI assistant:")
        for video in working_videos:
            print(f"   • {video['title']} (ID: {video['id']})")
    else:
        print("\n⚠️ No videos with transcripts found. This could be due to:")
        print("   - Network connectivity issues")
        print("   - YouTube API restrictions")
        print("   - Regional blocking")
    
    return working_videos

if __name__ == "__main__":
    test_transcript_extraction()
