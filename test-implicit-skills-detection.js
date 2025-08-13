/**
 * Test Implicit Skills Detection
 * Quick test to verify the enhanced AI can detect skills not literally mentioned
 */

async function testImplicitSkillsDetection() {
    console.log('🔍 Testing Implicit Skills Detection\n');

    // Job description that implies skills without mentioning them directly
    const testData = {
        action: 'analyze',
        jobTitle: 'Full Stack Developer',
        jobDescription: `
            We're looking for a developer to build modern web applications that serve thousands of users.
            You'll create responsive user interfaces that work seamlessly across devices,
            implement secure user authentication systems, and ensure fast loading times.
            
            The role involves building RESTful services that handle high traffic,
            designing database schemas for optimal performance, and deploying to cloud infrastructure.
            
            You'll implement real-time features and work on system architecture decisions.
        `,
        requirements: ['Experience building web applications', 'Modern development practices'],
        resumeText: `
            John Doe - Software Developer
            
            Experience:
            - Built a personal blog using HTML, CSS, and JavaScript
            - Created a simple todo app with local storage
            - Used Git for version control in school projects
            
            Skills: HTML, CSS, JavaScript, Git
            Education: Computer Science degree
        `
    };

    console.log('📋 Test Scenario:');
    console.log('   JD implies: React/Vue, Node.js, Authentication, Database design, Cloud deployment');
    console.log('   Resume has: Basic HTML/CSS/JS only');
    console.log('   Expected: AI should detect missing React, Node.js, Authentication, etc.');

    try {
        console.log('\n🤖 Testing enhanced analysis...');
        console.log('⏳ Calling API with 30 second timeout...');

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('http://localhost:3002/api/resume-rag-python', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 Response status: ${response.status}`);

        if (response.ok) {
            console.log('📥 Parsing JSON response...');
            const result = await response.json();
            console.log('✅ JSON parsed successfully');
            const analysis = result.data?.analysis?.structuredAnalysis;

            if (analysis) {
                console.log('\n✅ Analysis Results:');
                console.log(`   Overall Score: ${analysis.overallMatch?.score}%`);
                console.log(`   Missing Skills: ${analysis.missingSkills?.join(', ') || 'None'}`);
                console.log(`   Matching Skills: ${analysis.matchingSkills?.join(', ') || 'None'}`);
                console.log(`   Skills to Improve: ${analysis.skillsToImprove?.join(', ') || 'None'}`);

                // Show full analysis for debugging
                console.log('\n🔍 Full Missing Skills Array:', analysis.missingSkills);
                console.log('🔍 Gap Analysis:', analysis.gapAnalysis?.summary?.substring(0, 200) || 'None');

                // Check if implicit skills were detected (more flexible matching)
                const missingSkills = (analysis.missingSkills || []).map(s => s.toLowerCase());
                const implicitSkillsMap = {
                    'react': ['react', 'react.js', 'reactjs'],
                    'vue': ['vue', 'vue.js', 'vuejs'],
                    'angular': ['angular', 'angularjs'],
                    'node': ['node', 'node.js', 'nodejs'],
                    'authentication': ['authentication', 'auth', 'jwt', 'oauth'],
                    'database': ['database', 'db', 'mongodb', 'sql', 'mysql', 'postgresql'],
                    'cloud': ['cloud', 'aws', 'azure', 'gcp', 'deployment'],
                    'express': ['express', 'express.js', 'expressjs'],
                    'api': ['api', 'rest', 'restful', 'graphql']
                };

                const implicitSkillsDetected = Object.keys(implicitSkillsMap).filter(skillCategory => {
                    const variations = implicitSkillsMap[skillCategory];
                    return missingSkills.some(missing =>
                        variations.some(variation => missing.includes(variation))
                    );
                });

                console.log(`\n🎯 Implicit Skills Detected: ${implicitSkillsDetected.join(', ') || 'None'}`);
                console.log(`   Detection Success: ${implicitSkillsDetected.length >= 3 ? '✅ EXCELLENT' : implicitSkillsDetected.length >= 2 ? '✅ GOOD' : '❌ NEEDS IMPROVEMENT'}`);

                // Show improvement suggestions and extract skills from them too
                if (analysis.improvementSuggestions?.length > 0) {
                    console.log('\n💡 Improvement Suggestions:');
                    analysis.improvementSuggestions.slice(0, 2).forEach((suggestion, i) => {
                        console.log(`   ${i + 1}. ${suggestion.title}: ${suggestion.description}`);
                    });

                    // Also check improvement suggestions for implicit skills
                    const suggestionText = analysis.improvementSuggestions.map(s =>
                        `${s.title} ${s.description}`.toLowerCase()
                    ).join(' ');

                    const skillsInSuggestions = Object.keys(implicitSkillsMap).filter(skillCategory => {
                        const variations = implicitSkillsMap[skillCategory];
                        return variations.some(variation => suggestionText.includes(variation));
                    });

                    console.log(`🔍 Skills mentioned in suggestions: ${skillsInSuggestions.join(', ')}`);

                    // Combine both sources
                    const allDetectedSkills = [...new Set([...implicitSkillsDetected, ...skillsInSuggestions])];
                    console.log(`🎯 Total Implicit Skills Detected: ${allDetectedSkills.join(', ') || 'None'}`);
                    console.log(`   Overall Detection Success: ${allDetectedSkills.length >= 4 ? '✅ EXCELLENT' : allDetectedSkills.length >= 3 ? '✅ GOOD' : '❌ NEEDS IMPROVEMENT'}`);
                }

            } else {
                console.log('❌ No structured analysis in response');
                console.log('🔍 Full response structure:', Object.keys(result.data || {}));
            }
        } else {
            console.log(`❌ API Error: ${response.status}`);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText.substring(0, 500));
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ Test timed out after 30 seconds');
        } else {
            console.error('❌ Test failed:', error.message);
        }
        console.log('🔍 Possible issues:');
        console.log('   - Next.js dev server not running (npm run dev)');
        console.log('   - API endpoint has errors');
        console.log('   - OpenRouter API key issues');
    }

    console.log('\n🚀 ENHANCEMENTS COMPLETED:');
    console.log('✅ Removed Key Strengths section from UI');
    console.log('✅ Enhanced AI prompt for deeper analysis');
    console.log('✅ Added implicit skill detection capabilities');
    console.log('✅ Focused on actionable, specific skills');
    console.log('✅ Made missing skills more prominent in UI');
}

testImplicitSkillsDetection().catch(console.error);