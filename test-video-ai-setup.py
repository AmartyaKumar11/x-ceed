"""
Test script to verify video AI functionality before full setup
"""
import os
import json

def test_basic_functionality():
    """Test basic video AI concepts"""
    print("🧪 Testing Video AI Service Concepts...")
    
    # Test 1: Environment variables
    print("\n1. Checking environment variables...")
    env_file = ".env.local"
    if os.path.exists(env_file):
        print(f"✅ {env_file} exists")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'GEMINI_API_KEY' in content:
                print("✅ GEMINI_API_KEY found in .env.local")
            else:
                print("❌ GEMINI_API_KEY not found in .env.local")
    else:
        print(f"❌ {env_file} not found")
    
    # Test 2: Check Python imports
    print("\n2. Testing Python imports...")
    try:
        import fastapi
        print("✅ FastAPI available")
    except ImportError:
        print("❌ FastAPI not available - run: pip install fastapi")
    
    try:
        import google.generativeai as genai
        print("✅ Google Generative AI available")
    except ImportError:
        print("❌ Google Generative AI not available - run: pip install google-generativeai")
    
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        print("✅ YouTube Transcript API available")
    except ImportError:
        print("❌ YouTube Transcript API not available - run: pip install youtube-transcript-api")
    
    # Test 3: Sample video processing logic
    print("\n3. Testing video processing logic...")
    sample_transcript = [
        {"text": "Welcome to this tutorial", "start": 0, "duration": 3},
        {"text": "Today we'll learn about AI", "start": 3, "duration": 4},
        {"text": "Let's start with the basics", "start": 7, "duration": 3}
    ]
    
    # Test clip creation
    clips = create_sample_clips(sample_transcript)
    print(f"✅ Created {len(clips)} sample clips")
    
    # Test notes generation prompt
    notes_prompt = create_notes_prompt("Sample Video", "Test Channel")
    print("✅ Generated notes prompt template")
    
    print("\n🎉 Basic functionality test complete!")
    return True

def create_sample_clips(transcript_data):
    """Create sample clips from transcript"""
    clips = []
    for i, item in enumerate(transcript_data):
        clips.append({
            "title": f"Segment {i+1}",
            "start_time": int(item['start']),
            "end_time": int(item['start'] + item['duration']),
            "description": item['text'],
            "value": "Educational content"
        })
    return clips

def create_notes_prompt(title, channel):
    """Create a sample notes prompt"""
    return f"""
    Create comprehensive study notes for this video:
    
    Title: {title}
    Channel: {channel}
    
    Generate well-structured notes with:
    - Overview
    - Key Points
    - Important Concepts
    - Summary
    """

def format_time(seconds):
    """Format seconds to MM:SS"""
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"

if __name__ == "__main__":
    test_basic_functionality()
    
    # Demo the time formatting
    print(f"\nTime formatting demo:")
    print(f"65 seconds = {format_time(65)}")
    print(f"125 seconds = {format_time(125)}")
