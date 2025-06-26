"""
Debug script to test the AI Resume Analyzer import
"""
import sys
import os

print("Python version:", sys.version)
print("Current working directory:", os.getcwd())
print("Python path:", sys.path)

try:
    print("Attempting to import the module...")
    import ai_resume_analyzer
    print("Module imported successfully!")
    print("Module attributes:", dir(ai_resume_analyzer))
    
    # Try to get the class
    if hasattr(ai_resume_analyzer, 'AIResumeAnalyzer'):
        print("AIResumeAnalyzer class found!")
        analyzer_class = getattr(ai_resume_analyzer, 'AIResumeAnalyzer')
        print("Class type:", type(analyzer_class))
    else:
        print("AIResumeAnalyzer class NOT found!")
        
except Exception as e:
    print(f"Error importing module: {e}")
    import traceback
    traceback.print_exc()
