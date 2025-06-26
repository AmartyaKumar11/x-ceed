"""
Test service with environment loaded
"""
import os

# Load environment variables from .env.local
def load_env_file():
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print("✅ Environment variables loaded")
        return True
    except Exception as e:
        print(f"❌ Could not load .env.local: {e}")
        return False

def test_with_environment():
    print("🧪 Testing Video AI Service with environment...")
    
    # Load environment
    if not load_env_file():
        return False
    
    # Check if API key is available
    if not os.getenv('GEMINI_API_KEY'):
        print("❌ GEMINI_API_KEY not found in environment")
        return False
    
    print("✅ GEMINI_API_KEY found")
    
    try:
        # Import and initialize service
        import video_ai_service
        service = video_ai_service.VideoAIService()
        print("✅ Service initialized successfully")
        
        print("\n🎉 Video AI Service is ready!")
        return True
        
    except Exception as e:
        print(f"❌ Service error: {e}")
        return False

if __name__ == "__main__":
    success = test_with_environment()
    if success:
        print("\n🚀 Ready to start the service with: python video_ai_service.py")
    else:
        print("\n❌ Service setup needs attention")
