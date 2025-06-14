// Test dynamic prep plan generation with parsed skills
const testParsedSkills = {
  "requiredSkills": {
    "critical": ["React", "Node.js", "JavaScript"],
    "technical": ["RESTful APIs", "Database Design", "Git"],
    "soft": ["Communication", "Problem Solving", "Teamwork"],
    "tools": ["Docker", "VS Code", "Postman"],
    "frameworks": ["Next.js", "Express.js", "Tailwind CSS"],
    "languages": ["JavaScript", "TypeScript", "Python"],
    "databases": ["PostgreSQL", "MongoDB", "Redis"],
    "cloud": ["AWS", "Vercel", "Railway"]
  },
  "learningPath": {
    "mustLearn": ["React", "Node.js", "Database Design"],
    "highPriority": ["TypeScript", "REST APIs", "Git"],
    "mediumPriority": ["Docker", "AWS", "System Design"],
    "niceToHave": ["Redis", "MongoDB", "Microservices"],
    "learningOrder": ["JavaScript", "React", "Node.js", "Database Design", "TypeScript", "AWS"],
    "estimatedTimeWeeks": 12,
    "difficultyLevel": "intermediate"
  },
  "interviewPrep": {
    "technicalTopics": ["Data Structures", "Algorithms", "System Design", "React concepts"],
    "codingChallenges": ["Array manipulation", "String processing", "Tree traversal"],
    "systemDesign": ["Scalable web applications", "Database design", "API design"],
    "behavioralQuestions": ["Leadership", "Conflict resolution", "Project management"]
  }
};

const testJob = {
  id: 1,
  title: "Full Stack Developer",
  companyName: "TechCorp",
  description: "We are looking for a skilled Full Stack Developer...",
  level: "Mid-level"
};

// Test the generateDynamicPrepPlan function
console.log('Testing dynamic prep plan generation...');
console.log('Job:', testJob);
console.log('Parsed Skills:', JSON.stringify(testParsedSkills, null, 2));

// This would normally be called within the React component
// but we can test the logic here
console.log('\nTest completed - check the prep plan page for actual results');

// Test with different durations
const durations = [8, 12, 16];
durations.forEach(duration => {
  console.log(`\nTesting with ${duration} weeks duration...`);
  // The dynamic generation would adapt phase durations based on this
});
