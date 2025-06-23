#!/usr/bin/env python3
"""
Simple script to test a single resume file
"""
import sys
import os
from ai_resume_analyzer import AIResumeAnalyzer

def test_resume(file_path):
    """Test a single resume file"""
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    print(f"🔍 Testing resume: {file_path}")
    print("=" * 60)
    
    analyzer = AIResumeAnalyzer()
    
    try:
        # Parse the resume
        print("📄 Parsing resume...")
        result = analyzer.parse_resume(file_path)
        
        if result and result.get('text'):
            print(f"✅ Successfully parsed! Text length: {len(result['text'])} characters")
            print("\n📝 First 500 characters:")
            print("-" * 40)
            print(result['text'][:500])
            print("-" * 40)
            
            # Test AI analysis
            print("\n🤖 Testing AI analysis...")
            analysis = analyzer.analyze_resume_content(result['text'])
            
            if analysis:
                print("✅ AI analysis successful!")
                print(f"Skills found: {len(analysis.get('skills', []))}")
                print(f"Experience: {analysis.get('experience', 'N/A')}")
                print(f"Education: {analysis.get('education', 'N/A')}")
            else:
                print("❌ AI analysis failed")
                
        else:
            print("❌ Failed to parse resume - no text extracted")
            print(f"Result: {result}")
            
    except Exception as e:
        print(f"❌ Error processing resume: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_single_resume.py <resume_file_path>")
        sys.exit(1)
    
    test_resume(sys.argv[1])
