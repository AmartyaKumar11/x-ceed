// Enhanced test for Gemini AI parsing
// Run with: node test-gemini-enhanced.js

const testJobDescription = `
Senior Full Stack Developer - TechCorp Inc

We are looking for a highly skilled Senior Full Stack Developer to join our dynamic team. 

Key Requirements:
- 5+ years of professional software development experience
- Expert-level proficiency in JavaScript, TypeScript, and Python
- Strong experience with React, Next.js, and Node.js
- Proficiency with AWS cloud services (EC2, S3, Lambda, RDS)
- Experience with PostgreSQL, MongoDB, and Redis
- Knowledge of Docker, Kubernetes, and CI/CD pipelines
- Strong understanding of system design and scalability
- Experience with testing frameworks (Jest, Cypress, pytest)
- Bachelor's degree in Computer Science or equivalent experience

Responsibilities:
- Design and develop scalable web applications using modern technologies
- Lead architecture decisions and mentor junior developers
- Collaborate with product managers and designers on feature development
- Implement robust testing strategies and maintain code quality
- Optimize application performance and troubleshoot production issues
- Participate in on-call rotation and incident response

Tech Stack:
- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js, Python, Django
- Databases: PostgreSQL, MongoDB, Redis
- Cloud: AWS (EC2, S3, Lambda, RDS, CloudFront)
- DevOps: Docker, Kubernetes, GitHub Actions, Terraform
- Monitoring: DataDog, Sentry, CloudWatch

What We Offer:
- Competitive salary $140k - $180k
- Equity package and performance bonuses
- Comprehensive health benefits
- Flexible remote work options
- $5000 annual learning budget
- Top-tier equipment and home office setup
`;

async function testGeminiEnhanced() {
    console.log('🧠 Testing Enhanced Gemini AI Parsing...\n');
    
    try {
        const response = await fetch('http://localhost:3002/api/parse-job-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobDescription: testJobDescription,
                jobTitle: 'Senior Full Stack Developer',
                companyName: 'TechCorp Inc',
                jobId: 'test-gemini-001'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Gemini AI parsing successful!\n');
            
            // Critical Skills Analysis
            if (result.data.requiredSkills?.critical) {
                console.log('🚨 CRITICAL SKILLS:');
                result.data.requiredSkills.critical.forEach((skill, index) => {
                    console.log(`   ${index + 1}. ${skill}`);
                });
                console.log('');
            }
            
            // Learning Path Analysis
            if (result.data.learningPath) {
                console.log('📚 LEARNING PATH PRIORITY:');
                
                if (result.data.learningPath.mustLearn) {
                    console.log('   🔴 Must Learn (Priority 1):');
                    result.data.learningPath.mustLearn.forEach(skill => 
                        console.log(`      • ${skill}`)
                    );
                }
                
                if (result.data.learningPath.highPriority) {
                    console.log('   🟡 High Priority (Priority 2):');
                    result.data.learningPath.highPriority.forEach(skill => 
                        console.log(`      • ${skill}`)
                    );
                }
                
                if (result.data.learningPath.mediumPriority) {
                    console.log('   🔵 Medium Priority (Priority 3):');
                    result.data.learningPath.mediumPriority.forEach(skill => 
                        console.log(`      • ${skill}`)
                    );
                }
                
                if (result.data.learningPath.estimatedTimeWeeks) {
                    console.log(`   ⏱️  Estimated Time: ${result.data.learningPath.estimatedTimeWeeks} weeks`);
                }
                
                if (result.data.learningPath.difficultyLevel) {
                    console.log(`   📈 Difficulty: ${result.data.learningPath.difficultyLevel}`);
                }
                console.log('');
            }
            
            // Job Insights
            if (result.data.jobInsights) {
                console.log('💼 JOB INSIGHTS:');
                console.log(`   Company Type: ${result.data.jobInsights.companyType}`);
                console.log(`   Work Type: ${result.data.jobInsights.workType}`);
                console.log(`   Team Size: ${result.data.jobInsights.teamSize || 'Not specified'}`);
                console.log(`   Growth Stage: ${result.data.jobInsights.growthStage || 'Not specified'}`);
                
                if (result.data.jobInsights.techStack) {
                    console.log('   Tech Stack:', result.data.jobInsights.techStack.join(', '));
                }
                console.log('');
            }
            
            // Interview Prep
            if (result.data.interviewPrep) {
                console.log('📝 INTERVIEW PREPARATION:');
                
                if (result.data.interviewPrep.technicalTopics) {
                    console.log('   Technical Topics:', result.data.interviewPrep.technicalTopics.join(', '));
                }
                
                if (result.data.interviewPrep.codingChallenges) {
                    console.log('   Coding Challenges:', result.data.interviewPrep.codingChallenges.join(', '));
                }
                
                if (result.data.interviewPrep.systemDesign) {
                    console.log('   System Design:', result.data.interviewPrep.systemDesign.join(', '));
                }
                console.log('');
            }
            
            // Market Insights
            if (result.data.marketDemand) {
                console.log('📊 MARKET INSIGHTS:');
                console.log(`   Demand Level: ${result.data.marketDemand.demandLevel}`);
                console.log(`   Competitiveness: ${result.data.marketDemand.competitiveness}`);
                
                if (result.data.marketDemand.trendingSkills) {
                    console.log('   Trending Skills:', result.data.marketDemand.trendingSkills.join(', '));
                }
                console.log('');
            }
            
            // Career Growth
            if (result.data.careerGrowth) {
                console.log('🚀 CAREER GROWTH:');
                
                if (result.data.careerGrowth.nextRoles) {
                    console.log('   Next Roles:', result.data.careerGrowth.nextRoles.join(', '));
                }
                
                if (result.data.careerGrowth.timeToPromotion) {
                    console.log(`   Time to Promotion: ${result.data.careerGrowth.timeToPromotion}`);
                }
                console.log('');
            }
            
            // AI Analysis Metadata
            console.log('🤖 AI ANALYSIS METADATA:');
            console.log(`   Source: ${result.data.source || 'Unknown'}`);
            console.log(`   Confidence: ${Math.round((result.data.confidence || 0) * 100)}%`);
            
            console.log('\n📋 FULL RESPONSE STRUCTURE:');
            console.log(JSON.stringify(result.data, null, 2));
            
        } else {
            console.error('❌ API Error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

// Run the enhanced test
testGeminiEnhanced();
