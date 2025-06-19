"""
Simple test to verify the Python service can start
"""
import sys
import os

def test_video_service():
    try:
        # Load environment variables from .env.local
        if os.path.exists('.env.local'):
            print("Loading environment variables from .env.local...")
            with open('.env.local', 'r') as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
        
        # Add current directory to path
        sys.path.insert(0, os.getcwd())
        
        # Test the import
        print("Testing video AI service import...")
        import video_ai_service
        print("✅ Import successful")
        
        # Test initialization
        service = video_ai_service.VideoAIService()
        print("✅ Service initialization successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_video_service()
    if success:
        print("\n🎉 Service is ready to run!")
    else:
        print("\n❌ Service has issues that need to be fixed")
