"""
Simple test to get enhanced notes with proper error handling
"""
import requests
import json

def test_notes_simple():
    video_id = "_uQrJ0TkZlc"  # Short test video
    
    print(f"🧪 Testing notes for video: {video_id}")
    
    try:
        # Test with a very long timeout
        response = requests.post(
            "http://localhost:8005/generate-notes",
            json={"video_id": video_id},
            timeout=120  # 2 minutes timeout
        )
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            notes = result.get('notes', '')
            
            print("✅ Enhanced notes generated!")
            print(f"📄 Notes length: {len(notes)} characters")
            print(f"🎬 Video title: {result.get('video_title', 'Unknown')}")
            
            # Save notes to file for inspection
            with open('enhanced_notes_sample.md', 'w', encoding='utf-8') as f:
                f.write(notes)
            
            print("\n" + "="*50)
            print("FIRST 2000 CHARACTERS OF ENHANCED NOTES:")
            print("="*50)
            print(notes[:2000])
            print("...")
            print("="*50)
            print("📝 Full notes saved to 'enhanced_notes_sample.md'")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - this might mean the AI is taking a long time to generate notes")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_notes_simple()
