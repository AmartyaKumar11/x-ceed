"""
Pre-Setup Health Check
Run this before starting your fresh database setup
"""

import requests
import time

def check_service_health():
    services = {
        "Frontend (Next.js)": "http://localhost:3002",
        "RAG Service": "http://localhost:8000/docs",
        "Video AI Service": "http://localhost:8002/docs", 
        "Gemini Chat": "http://localhost:8003/docs",
        "AI Service": "http://localhost:8004/docs",
        "Job Description Service": "http://localhost:8008/docs"
    }
    
    print("🔍 Checking Service Health Before Fresh Setup")
    print("=" * 50)
    
    all_healthy = True
    
    for service_name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {service_name}: Running")
            else:
                print(f"⚠️  {service_name}: Responding but status {response.status_code}")
                all_healthy = False
        except requests.exceptions.RequestException:
            print(f"❌ {service_name}: Not responding")
            all_healthy = False
    
    print("\n" + "=" * 50)
    if all_healthy:
        print("🎉 All services are healthy!")
        print("✅ Ready to start fresh database setup")
        print("\n📋 Next steps:")
        print("1. Open http://localhost:3002")
        print("2. Register a new account")
        print("3. Upload your resume")
        print("4. Test AI features")
    else:
        print("⚠️  Some services are not running")
        print("💡 Run 'npm run dev:full' to start all services")
    
    return all_healthy

if __name__ == "__main__":
    check_service_health()
