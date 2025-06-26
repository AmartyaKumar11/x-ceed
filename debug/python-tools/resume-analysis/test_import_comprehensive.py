"""
Test import of AIResumeAnalyzer class
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.getcwd())

print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path[:3]}")

# Check if .env.local exists and load it
env_file = ".env.local"
if os.path.exists(env_file):
    print(f"✅ Found {env_file}")
    with open(env_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
                if key == 'GEMINI_API_KEY':
                    print(f"✅ GEMINI_API_KEY loaded: {value[:10]}...")
else:
    print(f"❌ {env_file} not found")

# Test import
try:
    print("\n🔍 Attempting to import ai_resume_analyzer module...")
    import ai_resume_analyzer
    print("✅ Module imported successfully")
    
    print("\n🔍 Checking module contents...")
    print(f"Module file: {ai_resume_analyzer.__file__}")
    print(f"Module attributes: {dir(ai_resume_analyzer)}")
    
    # Check if AIResumeAnalyzer class exists
    if hasattr(ai_resume_analyzer, 'AIResumeAnalyzer'):
        print("✅ AIResumeAnalyzer class found in module")
        AIResumeAnalyzer = ai_resume_analyzer.AIResumeAnalyzer
        print(f"Class type: {type(AIResumeAnalyzer)}")
        
        # Try to instantiate
        print("\n🔍 Attempting to create AIResumeAnalyzer instance...")
        analyzer = AIResumeAnalyzer()
        print("✅ AIResumeAnalyzer instance created successfully")
        print(f"Instance type: {type(analyzer)}")
        
    else:
        print("❌ AIResumeAnalyzer class not found in module")
        print("Available classes/functions:")
        for attr in dir(ai_resume_analyzer):
            if not attr.startswith('_'):
                print(f"  - {attr}: {type(getattr(ai_resume_analyzer, attr))}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
