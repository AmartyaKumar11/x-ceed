// Test script to check API connectivity
const QUIZ_SERVICE_URL = 'http://localhost:8006';

async function testQuizService() {
    console.log('🧪 Testing Quiz Service Connectivity...');
    
    try {
        // Test 1: Health check
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await fetch(`${QUIZ_SERVICE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test 2: Root endpoint
        console.log('2️⃣ Testing root endpoint...');
        const rootResponse = await fetch(`${QUIZ_SERVICE_URL}/`);
        const rootData = await rootResponse.json();
        console.log('✅ Root endpoint:', rootData);
        
        // Test 3: Quiz generation
        console.log('3️⃣ Testing quiz generation...');
        const quizRequest = {
            video_id: "test-123",
            video_title: "Test Quiz",
            transcript: "This is a test transcript about machine learning algorithms and neural networks.",
            num_questions: 3,
            question_types: ["mcq"],
            difficulty_level: "medium"
        };
        
        const quizResponse = await fetch(`${QUIZ_SERVICE_URL}/generate-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quizRequest)
        });
        
        if (!quizResponse.ok) {
            throw new Error(`Quiz generation failed: ${quizResponse.status}`);
        }
        
        const quizData = await quizResponse.json();
        console.log('✅ Quiz generation successful:', {
            quiz_id: quizData.quiz_id,
            questions: quizData.total_questions,
            first_question: quizData.questions[0]?.question
        });
        
        console.log('🎉 All tests passed! Quiz service is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testQuizService();
