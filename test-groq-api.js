/**
 * Test Groq API directly to verify if it's working
 */

async function testGroqAPI() {
  console.log('🧪 Testing Groq API directly...');
  
  // Load Groq API key from environment variable for security
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable not set. Please set it in your .env.local or environment.');
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'Hello, can you respond with just "API working"?'
          }
        ],
        max_tokens: 10
      })
    });
    
    console.log('📊 Groq API Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Groq API is working!');
      console.log('💬 Response:', result.choices[0]?.message?.content);
    } else {
      const errorText = await response.text();
      console.log('❌ Groq API Error:', errorText);
      
      if (response.status === 429) {
        console.log('🚫 Rate limit exceeded - too many requests');
      } else if (response.status === 500) {
        console.log('🔥 Groq server error - their service is down');
      } else if (response.status === 401) {
        console.log('🔑 Authentication error - invalid API key');
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

async function testWithFallback() {
  console.log('\n🔄 Testing fallback solutions...');
  
  // Test with different model
  // Load Groq API key from environment variable for security
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable not set. Please set it in your .env.local or environment.');
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Different model
        messages: [
          {
            role: 'user',
            content: 'Test message'
          }
        ],
        max_tokens: 10
      })
    });
    
    console.log('📊 Alternative model status:', response.status);
    
    if (response.ok) {
      console.log('✅ Alternative model works!');
    } else {
      console.log('❌ Alternative model also failing');
    }
    
  } catch (error) {
    console.error('❌ Alternative model test failed:', error);
  }
}

async function runGroqTests() {
  console.log('🎯 GROQ API DIAGNOSTICS');
  console.log('=' * 30);
  
  await testGroqAPI();
  await testWithFallback();
  
  console.log('\n📝 SOLUTIONS:');
  console.log('1. If Groq is down, wait and try again later');
  console.log('2. Switch to a different model (llama3-8b-8192)');
  console.log('3. Add retry logic with exponential backoff');
  console.log('4. Implement fallback to other AI services');
  console.log('5. Return cached/fallback analysis when API fails');
}

runGroqTests();
