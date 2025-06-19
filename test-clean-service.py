"""
Test the clean video AI service
"""
import sys
import os

def test_clean_service():
    try:
        print("Testing clean video AI service...")
        import video_ai_service
        print("✅ Import successful")
        
        # Test initialization
        service = video_ai_service.VideoAIService()
        print("✅ Service initialization successful")
        
        print("\n🎉 Clean service is working!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_clean_service()
