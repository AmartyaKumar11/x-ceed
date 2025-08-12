/**
 * Test OpenRouter Integration for Prep Plan Generation
 * Run with: node test-openrouter-integration.js
 */

require('dotenv').config({ path: '.env.local' });

async function testOpenRouterIntegration() {
  console.log('🧪 Testing OpenRouter Integration for Prep Plan Generation\n');
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;
  
  console.log('🔑 API Key Check:', OPENROUTER_API_KEY ? 'Available' : 'Missing');
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API Key not found in environment');
    return;
  }
  
  const testPrompt = `Create a simple 4-week study plan for a Frontend Developer position.

Job Requirements: React, JavaScript, HTML/CSS
Candidate Skills: Basic JavaScript, HTML

Return JSON format:
{
  "gapAnalysis": {
    "missingSkills": ["React", "Advanced JavaScript"],
    "criticalLearningPath": "Focus on React fundamentals and JavaScript ES6+"
  },
  "weeklyProgression": {
    "week1": {
      "focus": "JavaScript ES6+ fundamentals",
      "topics": ["Arrow functions", "Promises", "Async/await"]
    },
    "week2": {
      "focus": "React basics",
      "topics": ["Components", "Props", "State"]
    }
  }
}`;

  const freeModels = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'google/gemma-2-9b-it:free'
  ];
  
  for (const model of freeModels) {
    try {
      console.log(`\n🤖 Testing model: ${model}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3002',
          'X-Title': 'X-CEED Prep Plan Generator Test'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: testPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      console.log(`📊 Response Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          console.log(`✅ ${model} - SUCCESS`);
          console.log(`📝 Response length: ${content.length} characters`);
          console.log(`🔍 First 200 chars: ${content.substring(0, 200)}...`);
          
          // Try to parse JSON
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log(`✅ JSON parsing successful`);
              console.log(`📋 Gap Analysis: ${parsed.gapAnalysis?.criticalLearningPath || 'Not found'}`);
            } else {
              console.log(`⚠️ No JSON structure found in response`);
            }
          } catch (parseError) {
            console.log(`⚠️ JSON parsing failed: ${parseError.message}`);
          }
          
          break; // Success, no need to try other models
        } else {
          console.log(`❌ ${model} - No content in response`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ ${model} - Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${model} - Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Test completed!');
}

// Run the test
testOpenRouterIntegration().catch(console.error);