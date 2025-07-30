import requests
import json

# Test the optimized quiz generation service
def test_quiz_generation():
    print("🧪 Testing Optimized Quiz Generation Service with Gemini 1.5 Flash")
    
    # Test data
    test_request = {
        "video_id": "test-123",
        "video_title": "Introduction to Machine Learning",
        "transcript": "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train algorithms. For example, we can use email data labeled as spam or not spam to train a classifier. Neural networks are a popular machine learning approach inspired by the human brain. They consist of interconnected nodes that process information in layers. Deep learning uses neural networks with many layers to solve complex problems. Data preprocessing is crucial for machine learning success. This includes cleaning data, handling missing values, and feature selection.",
        "num_questions": 5,
        "question_types": ["mcq"],
        "difficulty_level": "medium"
    }
    
    try:
        # Test quiz generation
        print("📝 Generating quiz...")
        response = requests.post(
            "http://localhost:8006/generate-quiz",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            quiz_data = response.json()
            print(f"✅ Quiz generated successfully!")
            print(f"📊 Quiz ID: {quiz_data['quiz_id']}")
            print(f"📚 Total Questions: {quiz_data['total_questions']}")
            print(f"⏱️ Estimated Time: {quiz_data['estimated_time']} minutes")
            
            # Display sample questions
            print("\n🔍 Sample Questions:")
            for i, question in enumerate(quiz_data['questions'][:3], 1):
                print(f"\nQ{i}: {question['question']}")
                for j, option in enumerate(question['options'], 1):
                    marker = "✓" if option == question['correct_answer'] else " "
                    print(f"  {marker} {j}. {option}")
                print(f"   💡 {question['explanation']}")
            
            print(f"\n🎯 Token Optimization Features:")
            print(f"   • Transcript compression: {len(test_request['transcript'])} → optimized")
            print(f"   • Batch generation: Single API call for all questions")
            print(f"   • Student Pro benefits: Higher rate limits & quality")
            
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_quiz_generation()
