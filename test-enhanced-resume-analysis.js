/**
 * Test Enhanced Resume Analysis with OpenRouter Integration
 * Run with: node test-enhanced-resume-analysis.js
 */

require('dotenv').config({ path: '.env.local' });

async function testEnhancedResumeAnalysis() {
    console.log('🧪 Testing Enhanced Resume Analysis with OpenRouter\n');

    const OPENROUTER_API_KEY = process.env.OPENROUTER_PREP_PLAN_API_KEY;

    console.log('🔑 OpenRouter API Key Check:', OPENROUTER_API_KEY ? 'Available' : 'Missing');

    if (!OPENROUTER_API_KEY) {
        console.error('❌ OpenRouter API Key not found in environment');
        return;
    }

    // Mock data for testing
    const testData = {
        jobTitle: 'Frontend Developer',
        jobDescription: 'We are looking for a skilled Frontend Developer with experience in React, JavaScript, TypeScript, Node.js, and modern web technologies. Must have 3+ years of experience building scalable web applications.',
        jobRequirements: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'HTML', 'CSS'],
        userSkills: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
        resumeText: `
      John Doe
      Software Developer
      
      Experience:
      - 2 years of experience in web development
      - Proficient in JavaScript, HTML, CSS, jQuery
      - Built responsive websites and basic web applications
      - Worked with REST APIs and basic database operations
      
      Skills:
      JavaScript, HTML, CSS, jQuery, Git, MySQL
      
      Education:
      Bachelor's in Computer Science, 2022
    `
    };

    const prompt = `You are an expert career advisor. Analyze the gap between this candidate's profile and job requirements to provide detailed insights.

==== JOB POSTING ====
Title: ${testData.jobTitle}
Requirements: ${testData.jobRequirements.join(', ')}
Description: ${testData.jobDescription}

==== CANDIDATE PROFILE ====
Current Skills: ${testData.userSkills.join(', ')}
Resume Content: ${testData.resumeText}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation text, no code blocks. Just raw JSON.

Return this exact JSON structure:
{
  "overallScore": 75,
  "skillsScore": 80,
  "experienceScore": 70,
  "keywordScore": 75,
  "overallSummary": "Brief summary of match quality",
  "matchedSkills": ["skills candidate has that match job"],
  "missingSkills": ["critical skills candidate lacks"],
  "skillsToImprove": ["skills candidate has but needs to advance"],
  "foundKeywords": ["job keywords found in resume"],
  "missingKeywords": ["important job keywords missing from resume"],
  "gapAnalysis": "Detailed analysis of what candidate needs to learn",
  "experienceAnalysis": {
    "resumeYears": 2,
    "requiredYears": 3,
    "details": [
      {
        "requirement": "scalable applications",
        "matched": false,
        "analysis": "No evidence of scalable application development"
      }
    ]
  },
  "suggestions": [
    {
      "title": "Learn React Framework",
      "description": "Master React to meet the primary job requirement",
      "priority": "high"
    }
  ]
}`;

    const freeModels = [
        'meta-llama/llama-3.2-3b-instruct:free',
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free'
    ];

    for (const model of freeModels) {
        try {
            console.log(`\n🤖 Testing resume analysis with: ${model}`);

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3002',
                    'X-Title': 'X-CEED Resume Gap Analysis Test'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 3000,
                }),
            });

            console.log(`📊 Response Status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;

                if (content) {
                    console.log(`✅ ${model} - SUCCESS`);
                    console.log(`📝 Response length: ${content.length} characters`);

                    // Try to parse JSON
                    try {
                        let analysisResult = null;

                        // Method 1: Direct parse
                        try {
                            analysisResult = JSON.parse(content.trim());
                        } catch (e) {
                            // Method 2: Extract JSON block
                            const jsonMatch = content.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                analysisResult = JSON.parse(jsonMatch[0]);
                            }
                        }

                        if (analysisResult && analysisResult.overallScore) {
                            console.log(`✅ JSON parsing successful`);
                            console.log(`📊 Overall Score: ${analysisResult.overallScore}%`);
                            console.log(`🎯 Skills Score: ${analysisResult.skillsScore}%`);
                            console.log(`📚 Missing Skills: ${analysisResult.missingSkills?.slice(0, 3).join(', ') || 'None'}`);
                            console.log(`🔍 Gap Analysis: ${analysisResult.gapAnalysis?.substring(0, 150)}...`);
                            console.log(`💡 Suggestions: ${analysisResult.suggestions?.length || 0} recommendations`);

                            break; // Success, no need to try other models
                        } else {
                            console.log(`⚠️ Invalid analysis structure`);
                        }
                    } catch (parseError) {
                        console.log(`⚠️ JSON parsing failed: ${parseError.message}`);
                        console.log(`🔍 First 300 chars: ${content.substring(0, 300)}...`);
                    }
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

    console.log('\n🎯 Resume analysis test completed!');
    console.log('💡 The enhanced analysis should now work when Python service fails.');
}

// Run the test
testEnhancedResumeAnalysis().catch(console.error);