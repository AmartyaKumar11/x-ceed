"""
Simple transcript test to find working video IDs
"""
from youtube_transcript_api import YouTubeTranscriptApi

def test_simple_transcript():
    """Test transcript fetching with the correct approach"""
    
    test_videos = [
        "_uQrJ0TkZlc",  # Python Full Course - Programming with Mosh
        "kqtD5dpn9C8",  # Python for Beginners - freeCodeCamp  
        "dQw4w9WgXcQ",  # Rick Roll
        "9bZkp7q19f0"   # Gangnam Style
    ]
    
    for video_id in test_videos:
        print(f"\n🎥 Testing video: {video_id}")
        
        try:
            # Simple direct fetch
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            print(f"✅ SUCCESS: {len(transcript)} transcript segments")
            print(f"📝 First segment: '{transcript[0]['text']}'")
            print(f"⏰ Duration: {transcript[0]['start']:.1f}s - {transcript[0]['start'] + transcript[0]['duration']:.1f}s")
            
            # Show this video works
            print(f"🚀 This video works! Use: http://localhost:3002/video-ai-assistant?videoId={video_id}")
            
        except Exception as e:
            print(f"❌ Failed: {e}")

if __name__ == "__main__":
    test_simple_transcript()
