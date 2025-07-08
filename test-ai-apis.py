"""
Test Groq API Connection
This will verify that your Groq API key is working correctly
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def test_groq_api():
    print("🧠 Testing Groq API Connection...")
    print("=" * 40)
    
    groq_api_key = os.getenv('GROQ_API_KEY')
    
    if not groq_api_key:
        print("❌ GROQ_API_KEY not found in .env.local")
        return False
    
    if not groq_api_key.startswith('gsk_'):
        print("❌ Invalid Groq API key format (should start with 'gsk_')")
        return False
    
    print(f"📍 Using Groq API key: {groq_api_key[:10]}...")
    
    try:
        # Test Groq API with a simple request
        headers = {
            'Authorization': f'Bearer {groq_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'Hello from X-ceed!' in exactly 3 words."
                }
            ],
            "model": "llama3-8b-8192",
            "max_tokens": 10
        }
        
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print("✅ Groq API is working!")
            print(f"🤖 Test response: {message}")
            return True
        else:
            print(f"❌ Groq API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def test_openrouter_api():
    print("\n🎭 Testing OpenRouter API Connection...")
    print("=" * 40)
    
    openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
    
    if not openrouter_api_key:
        print("❌ OPENROUTER_API_KEY not found in .env.local")
        return False
    
    if not openrouter_api_key.startswith('sk-or-'):
        print("❌ Invalid OpenRouter API key format (should start with 'sk-or-')")
        return False
    
    print(f"📍 Using OpenRouter API key: {openrouter_api_key[:10]}...")
    
    try:
        # Test OpenRouter API
        headers = {
            'Authorization': f'Bearer {openrouter_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "model": "meta-llama/llama-3.2-3b-instruct:free",
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'OpenRouter works!' in exactly 2 words."
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
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print("✅ OpenRouter API is working!")
            print(f"🤖 Test response: {message}")
            return True
        else:
            print(f"❌ OpenRouter API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing AI API Keys")
    print("=" * 40)
    
    groq_success = test_groq_api()
    openrouter_success = test_openrouter_api()
    
    print("\n📊 Summary:")
    print(f"{'✅' if groq_success else '❌'} Groq API: {'Working' if groq_success else 'Failed'}")
    print(f"{'✅' if openrouter_success else '❌'} OpenRouter API: {'Working' if openrouter_success else 'Failed'}")
    
    if groq_success and openrouter_success:
        print("\n🎉 All AI APIs are configured correctly!")
        print("🔄 Your application should now have full AI functionality!")
    else:
        print("\n⚠️  Some APIs need attention. Check the errors above.")
