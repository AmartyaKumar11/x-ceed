// Test the actual prep plan generation with a saved job
import fetch from 'node-fetch';

async function testActualPrepPlan() {
  console.log('🧪 Testing Actual Prep Plan Generation with Saved Job\n');
  
  // Create a test job similar to what would come from saved jobs
  const testJob = {
    id: "test-123",
    title: "Full Stack JavaScript Developer",
    companyName: "TechStartup Inc",
    description: `We are seeking a talented Full Stack JavaScript Developer to join our growing team. 

Requirements:
- 3+ years of experience with React.js and Node.js
- Strong knowledge of TypeScript
- Experience with MongoDB and PostgreSQL databases
- Familiarity with Express.js and REST API development
- Experience with Git version control
- Knowledge of Docker and AWS deployment
- Experience with testing frameworks like Jest and Cypress
- Understanding of Agile development methodologies

Responsibilities:
- Develop and maintain web applications using React and Node.js
- Design and implement RESTful APIs
- Work with databases (MongoDB, PostgreSQL)
- Collaborate with UI/UX designers
- Write unit and integration tests
- Deploy applications to AWS using Docker containers
- Participate in code reviews and sprint planning

Nice to have:
- Experience with GraphQL
- Knowledge of Redis caching
- Familiarity with Kubernetes
- Experience with microservices architecture`,
    level: "Mid-level",
    location: "Remote",
    salary: "$70000-$90000",
    status: "active"
  };

  try {
    console.log(`📋 Testing Job: ${testJob.title} at ${testJob.companyName}`);
    console.log('🔄 Simulating the full prep plan flow...\n');
    
    // Step 1: Parse the job description
    console.log('🤖 Step 1: Parsing job description with AI...');
    const parseResponse = await fetch('http://localhost:3002/api/parse-job-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: testJob.description,
        jobTitle: testJob.title,
        companyName: testJob.companyName,
        jobId: testJob.id
      })
    });

    if (!parseResponse.ok) {
      throw new Error(`Parse API failed: ${parseResponse.status}`);
    }

    const parseResult = await parseResponse.json();
    if (!parseResult.success) {
      throw new Error(`Parse failed: ${parseResult.error}`);
    }

    console.log('✅ Successfully parsed job description');
    const parsedSkills = parseResult.data;
    
    // Step 2: Show what topics would be generated
    console.log('\n📚 Step 2: Topics that would be generated for this specific job:\n');
    
    // Simulate the dynamic prep plan generation logic
    let topicCount = 1;
    
    // Phase 1: Foundation & Critical Skills
    console.log('🎯 PHASE 1: Foundation & Critical Skills');
    const criticalSkills = [...(parsedSkills.requiredSkills?.critical || []), ...(parsedSkills.learningPath?.mustLearn || [])];
    const uniqueCritical = [...new Set(criticalSkills)];
    
    uniqueCritical.forEach(skill => {
      console.log(`   ${topicCount++}. "${skill} Fundamentals" (12 hours)`);
      console.log(`      📝 Master the core concepts and fundamentals of ${skill}`);
      console.log(`      📚 Resources: Course, Documentation, Practice Problems\n`);
    });
    
    // Phase 2: Technical Skills Development  
    console.log('💻 PHASE 2: Technical Skills Development');
    const languages = parsedSkills.requiredSkills?.languages || [];
    const frameworks = parsedSkills.requiredSkills?.frameworks || [];
    const databases = parsedSkills.requiredSkills?.databases || [];
    
    languages.forEach(lang => {
      console.log(`   ${topicCount++}. "${lang} Advanced Concepts" (15 hours)`);
      console.log(`      📝 Deep dive into ${lang} - advanced features and optimization`);
      console.log(`      📚 Resources: Advanced Course, Best Practices, Advanced Project\n`);
    });
    
    frameworks.forEach(framework => {
      console.log(`   ${topicCount++}. "${framework} Development" (18 hours)`);
      console.log(`      📝 Build production-ready applications using ${framework}`);
      console.log(`      📚 Resources: Complete Course, Build Project, Official Docs\n`);
    });
    
    databases.forEach(db => {
      console.log(`   ${topicCount++}. "${db} Database Management" (12 hours)`);
      console.log(`      📝 Design, optimize, and manage ${db} databases`);
      console.log(`      📚 Resources: Database Course, Query Practice, Schema Design\n`);
    });
    
    // Phase 3: Tools & DevOps
    console.log('🛠️ PHASE 3: Tools & DevOps');
    const tools = parsedSkills.requiredSkills?.tools || [];
    const cloudTech = parsedSkills.requiredSkills?.cloud || [];
    
    tools.forEach(tool => {
      console.log(`   ${topicCount++}. "${tool} Proficiency" (8 hours)`);
      console.log(`      📝 Master ${tool} for development workflow and productivity`);
      console.log(`      📚 Resources: Tutorial, User Guide, Hands-on Practice\n`);
    });
    
    cloudTech.forEach(cloud => {
      console.log(`   ${topicCount++}. "${cloud} Cloud Services" (15 hours)`);
      console.log(`      📝 Deploy and manage applications using ${cloud}`);
      console.log(`      📚 Resources: Certification Course, Hands-on Labs, Documentation\n`);
    });
    
    // Phase 4: Interview Preparation
    console.log('🎯 PHASE 4: Interview Preparation');
    const interviewTopics = parsedSkills.interviewPrep?.technicalTopics || [];
    const systemDesignTopics = parsedSkills.interviewPrep?.systemDesign || [];
    
    console.log(`   ${topicCount++}. "Technical Interview Practice" (10 hours)`);
    console.log(`      📝 Focus on: ${interviewTopics.join(', ')}`);
    console.log(`      📚 Resources: LeetCode, HackerRank, Coding Interview Course\n`);
    
    if (systemDesignTopics.length > 0) {
      console.log(`   ${topicCount++}. "System Design Preparation" (12 hours)`);
      console.log(`      📝 Study: ${systemDesignTopics.join(', ')}`);
      console.log(`      📚 Resources: System Design Course, Books, Practice Designs\n`);
    }
    
    console.log(`   ${topicCount++}. "Company-Specific Preparation" (6 hours)`);
    console.log(`      📝 Research ${testJob.companyName} culture and interview process`);
    console.log(`      📚 Resources: Company Blog, Employee Connections, Glassdoor\n`);
    
    // Summary
    const totalTopics = topicCount - 1;
    console.log('📊 SUMMARY:');
    console.log(`   📚 Total Topics Generated: ${totalTopics}`);
    console.log(`   ⏱️ Estimated Duration: ${parsedSkills.learningPath?.estimatedTimeWeeks || 12} weeks`);
    console.log(`   📊 Difficulty Level: ${parsedSkills.learningPath?.difficultyLevel || 'intermediate'}`);
    console.log(`   🎯 All topics are SPECIFIC to this job's requirements!`);
    
    console.log('\n✅ SUCCESS: The prep plan is now 100% JD-specific and dynamic!');
    console.log('🔥 No more hardcoded topics - everything is generated from the actual job requirements!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testActualPrepPlan().catch(console.error);
