"""
Test transcript availability for different YouTube videos
"""
from youtube_transcript_api import YouTubeTranscriptApi
import os

def test_video_transcripts():
    """Test transcript availability for various YouTube videos"""
    
    # Test videos with different transcript availability
    test_videos = [
        {"id": "_uQrJ0TkZlc", "title": "Python Full Course - Programming with Mosh"},
        {"id": "kqtD5dpn9C8", "title": "Python for Beginners - freeCodeCamp"},
        {"id": "rfscVS0vtbw", "title": "Learn Python - Full Course for Beginners"},
        {"id": "dQw4w9WgXcQ", "title": "Rick Roll"},
        {"id": "9bZkp7q19f0", "title": "PSY - Gangnam Style"}
    ]
    
    print("🧪 Testing YouTube Transcript Availability\n")
    
    working_videos = []
    
    for video in test_videos:
        video_id = video["id"]
        title = video["title"]
        
        print(f"📹 Testing: {title}")
        print(f"🔗 Video ID: {video_id}")
        
        try:
            # Try to list available transcripts
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            print(f"✅ Transcripts available:")
            
            # Check for manual transcripts
            manual_transcripts = []
            generated_transcripts = []
            
            for transcript in transcript_list:
                if transcript.is_generated:
                    generated_transcripts.append(transcript.language_code)
                else:
                    manual_transcripts.append(transcript.language_code)
            
            if manual_transcripts:
                print(f"   📝 Manual: {', '.join(manual_transcripts)}")
            if generated_transcripts:
                print(f"   🤖 Auto-generated: {', '.join(generated_transcripts)}")
              # Try to fetch English transcript
            try:
                transcript = transcript_list.find_transcript(['en'])
                transcript_data = transcript.fetch()
                print(f"   📊 English transcript: {len(transcript_data)} segments")
                print(f"   📄 Sample: {transcript_data[0]['text'][:100]}...")
                working_videos.append(video)
                
            except Exception as e:
                print(f"   ⚠️ Could not fetch English transcript: {e}")
                
                # Try auto-generated
                try:
                    transcript = transcript_list.find_generated_transcript(['en'])
                    transcript_data = transcript.fetch()
                    print(f"   📊 Auto-generated English: {len(transcript_data)} segments")
                    print(f"   📄 Sample: {transcript_data[0]['text'][:100]}...")
                    working_videos.append(video)
                except Exception as e2:
                    print(f"   ❌ No English transcript available: {e2}")
                    
        except Exception as e:
            print(f"❌ No transcripts available: {e}")
        
        print()
    
    print(f"📊 Summary:")
    print(f"✅ Videos with working transcripts: {len(working_videos)}")
    
    if working_videos:
        print(f"\n🎯 Recommended test videos:")
        for video in working_videos:
            print(f"   • {video['title']} ({video['id']})")
    
    return working_videos

if __name__ == "__main__":
    working_videos = test_video_transcripts()
    
    if working_videos:
        print(f"\n🚀 You can test the video AI service with these video IDs:")
        for video in working_videos:
            print(f"   http://localhost:3002/video-ai-assistant?videoId={video['id']}&title={video['title'].replace(' ', '%20')}&channel=TestChannel")
