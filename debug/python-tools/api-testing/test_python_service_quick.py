import requests
import json

def test_python_service():
    """Quick test of the Python service"""
    try:
        # Test health check
        response = requests.get("http://localhost:8000/")
        print("✅ Health check:", response.json())
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    test_python_service()
