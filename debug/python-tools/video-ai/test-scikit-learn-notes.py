"""
Test the enhanced notes with the specific scikit-learn video
"""
import requests
import json

def test_scikit_learn_video():
    video_id = "0B5eIE_1vpU"  # Scikit-learn Crash Course
    
    print(f"🧪 Testing enhanced notes for scikit-learn video: {video_id}")
    
    try:
        # Test with the scikit-learn video
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
            with open('scikit_learn_notes.md', 'w', encoding='utf-8') as f:
                f.write(notes)
            
            print("\n" + "="*50)
            print("FIRST 2000 CHARACTERS OF SCIKIT-LEARN NOTES:")
            print("="*50)
            print(notes[:2000])
            print("...")
            print("="*50)
            print("📝 Full notes saved to 'scikit_learn_notes.md'")
            
            # Check for actual timestamps vs estimated ones
            if 'estimated' in notes.lower() or 'placeholder' in notes.lower():
                print("⚠️ Notes still contain estimated/placeholder content")
            else:
                print("✅ Notes contain real transcript-based timestamps!")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - transcript might be very large")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_scikit_learn_video()
