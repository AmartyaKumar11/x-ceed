"""
Test OpenRouter API with different header formats
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def test_openrouter_formats():
    print("🎭 Testing OpenRouter API with different formats...")
    print("=" * 50)
    
    openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
    print(f"📍 Using key: {openrouter_api_key[:15]}...")
    
    # Test Format 1: Standard Bearer token
    try:
        headers = {
            'Authorization': f'Bearer {openrouter_api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3002',
            'X-Title': 'X-ceed Resume Application'
        }
        
        data = {
            "model": "meta-llama/llama-3.2-3b-instruct:free",
            "messages": [
                {
                    "role": "user",
                    "content": "Say hello in 2 words."
                }
            ],
            "max_tokens": 10
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print("✅ OpenRouter API is working!")
            print(f"🤖 Test response: {message}")
            return True
        else:
            print(f"❌ Failed with standard format")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_openrouter_formats()
