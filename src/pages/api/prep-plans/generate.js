import { authMiddleware } from '../../../../lib/middleware';
import { getDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// AI-powered prep plan generation using Groq API
async function generateDetailedPrepPlan(jobData, userProfile) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const prompt = `
You are an elite career coach and learning specialist with 20+ years of experience helping candidates land their dream jobs. Create an ultra-detailed, granular study plan that will transform this candidate into the PERFECT applicant for this specific role.

**JOB INFORMATION:**
- **Position:** ${jobData.jobTitle}
- **Company:** ${jobData.companyName}
- **Department:** ${jobData.department || 'Not specified'}
- **Level:** ${jobData.level || 'Not specified'}
- **Location:** ${jobData.location || 'Not specified'}
- **Work Mode:** ${jobData.workMode || 'Not specified'}
- **Job Description:** ${jobData.jobDescription || 'Not provided'}
- **Requirements:** ${Array.isArray(jobData.requirements) ? jobData.requirements.join(', ') : 'Not specified'}

**CANDIDATE PROFILE:**
- **Skills:** ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : 'Not provided'}
- **Experience:** ${userProfile.workExperience ? JSON.stringify(userProfile.workExperience) : 'Not provided'}
- **Education:** ${userProfile.education ? JSON.stringify(userProfile.education) : 'Not provided'}
- **Name:** ${userProfile.firstName} ${userProfile.lastName}
- **Certifications:** ${userProfile.certifications ? JSON.stringify(userProfile.certifications) : 'None'}

Create an ultra-detailed, hyper-specific study plan in JSON format. This should be a COMPREHENSIVE preparation roadmap that leaves nothing to chance:

{
  "overview": {
    "title": "Ultra-Detailed Preparation Plan for [Job Title] at [Company]",
    "totalDuration": "3-4 weeks intensive preparation",
    "hoursPerDay": "3-4 hours daily commitment",
    "difficulty": "Challenging but achievable",
    "description": "A comprehensive, day-by-day transformation plan to become the ideal candidate",
    "successMetrics": ["Technical proficiency achieved", "Interview confidence built", "Industry expertise demonstrated"],
    "preparationPhilosophy": "Master the fundamentals, excel in specifics, dominate the interview"
  },
  "detailedSkillGapAnalysis": {
    "currentStrengths": {
      "technical": ["List specific technical strengths"],
      "soft": ["List soft skill strengths"],
      "industry": ["List industry knowledge strengths"]
    },
    "criticalGaps": {
      "mustHave": ["Essential skills missing"],
      "niceToHave": ["Preferred skills missing"],
      "knowledge": ["Knowledge gaps to fill"]
    },
    "competitiveAdvantages": ["Unique strengths to leverage"],
    "riskAreas": ["Potential weaknesses to address"],
    "overallStrategy": "Detailed strategy to bridge gaps and maximize strengths"
  },
  "detailedStudyPlan": {
    "week1": {
      "title": "Week 1: Foundation Mastery & Core Skills",
      "objective": "Build unshakeable fundamentals",
      "totalHours": "25-30 hours",
      "focusAreas": ["Core technical skills", "Industry fundamentals", "Company research"],
      "dailySchedule": {
        "day1": {
          "title": "Day 1: Deep Company & Industry Research",
          "totalTime": "4 hours",
          "schedule": "Split into 2 sessions: 2 hours morning, 2 hours evening",
          "tasks": [
            {
              "time": "9:00-10:30 AM",
              "task": "Comprehensive Company Analysis",
              "type": "research",
              "details": "Research company history, mission, values, recent news, leadership team, company culture, and business model",
              "resources": ["Company website", "LinkedIn company page", "Glassdoor reviews", "Recent press releases", "Annual reports"],
              "deliverable": "2-page company profile with key insights and talking points",
              "successCriteria": "Can confidently discuss company's current challenges and opportunities"
            },
            {
              "time": "10:45-12:15 PM",
              "task": "Industry Landscape Deep Dive",
              "type": "research",
              "details": "Understand market trends, competitors, challenges, opportunities, and future outlook",
              "resources": ["Industry reports", "Market analysis", "Competitor websites", "Industry publications"],
              "deliverable": "Industry analysis document with competitive landscape",
              "successCriteria": "Can speak intelligently about industry trends and company positioning"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Role-Specific Requirements Analysis",
              "type": "analysis",
              "details": "Break down job description into specific skills, create learning roadmap",
              "resources": ["Job description", "Similar job postings", "Skills assessment tools"],
              "deliverable": "Detailed skills gap analysis with priority ranking",
              "successCriteria": "Clear understanding of exactly what needs to be learned"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Learning Resource Compilation",
              "type": "preparation",
              "details": "Identify and organize all learning materials, courses, tutorials, and practice resources",
              "resources": ["Online learning platforms", "YouTube channels", "Documentation", "Practice sites"],
              "deliverable": "Organized learning resource library with schedules",
              "successCriteria": "All learning materials ready for immediate use"
            }
          ],
          "eveningReview": {
            "time": "9:30-10:00 PM",
            "activity": "Day reflection and next day preparation",
            "questions": ["What did I learn?", "What gaps did I identify?", "What's my focus tomorrow?"]
          }
        },
        "day2": {
          "title": "Day 2: Technical Foundation Building",
          "totalTime": "4 hours",
          "schedule": "Morning intensive learning, afternoon hands-on practice",
          "tasks": [
            {
              "time": "9:00-11:00 AM",
              "task": "Core Technical Concept Mastery",
              "type": "learning",
              "details": "Study fundamental concepts, frameworks, and methodologies relevant to the role",
              "resources": ["Online courses", "Official documentation", "Video tutorials", "Technical books"],
              "deliverable": "Comprehensive notes with key concepts and examples",
              "successCriteria": "Can explain core concepts clearly and confidently"
            },
            {
              "time": "11:15 AM-12:45 PM",
              "task": "Hands-On Practice Session 1",
              "type": "practice",
              "details": "Apply learned concepts through practical exercises and mini-projects",
              "resources": ["Practice platforms", "Code editors", "Sandbox environments"],
              "deliverable": "Working examples and code samples",
              "successCriteria": "Can demonstrate practical application of concepts"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Advanced Topics Introduction",
              "type": "learning",
              "details": "Explore advanced concepts and specialized knowledge areas",
              "resources": ["Advanced tutorials", "Expert articles", "Case studies"],
              "deliverable": "Advanced concept summaries with real-world applications",
              "successCriteria": "Understanding of how advanced concepts apply to the role"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Practice Problem Solving",
              "type": "practice",
              "details": "Solve role-specific problems and challenges",
              "resources": ["Practice problems", "Coding challenges", "Case study exercises"],
              "deliverable": "Solved problems with detailed explanations",
              "successCriteria": "Can tackle typical job-related challenges"
            }
          ],
          "eveningReview": {
            "time": "9:30-10:00 PM",
            "activity": "Technical knowledge assessment and gap identification",
            "questions": ["What technical concepts am I solid on?", "Where do I need more practice?", "What should I focus on tomorrow?"]
          }
        },
        "day3": {
          "title": "Day 3: Specialized Skills & Tools Mastery",
          "totalTime": "4 hours",
          "schedule": "Tool-specific learning with extensive hands-on practice",
          "tasks": [
            {
              "time": "9:00-10:30 AM",
              "task": "Essential Tools Deep Dive",
              "type": "learning",
              "details": "Master the specific tools, software, and platforms mentioned in the job description",
              "resources": ["Tool documentation", "Video tutorials", "Online courses", "Best practices guides"],
              "deliverable": "Tool proficiency checklist with usage examples",
              "successCriteria": "Comfortable using all essential tools for the role"
            },
            {
              "time": "10:45 AM-12:15 PM",
              "task": "Tool Integration Practice",
              "type": "practice",
              "details": "Practice using multiple tools together in realistic scenarios",
              "resources": ["Practice environments", "Sample projects", "Integration guides"],
              "deliverable": "Mini-project demonstrating tool integration",
              "successCriteria": "Can efficiently use tools in combination"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Industry-Specific Knowledge",
              "type": "learning",
              "details": "Study industry-specific practices, standards, and methodologies",
              "resources": ["Industry publications", "Professional blogs", "Standards documentation"],
              "deliverable": "Industry knowledge summary with key practices",
              "successCriteria": "Understanding of industry-specific requirements"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Portfolio Project Planning",
              "type": "planning",
              "details": "Plan a portfolio project that demonstrates relevant skills",
              "resources": ["Project ideas", "Requirements gathering", "Planning templates"],
              "deliverable": "Detailed project plan with timeline and milestones",
              "successCriteria": "Clear roadmap for demonstrating skills"
            }
          ],
          "eveningReview": {
            "time": "9:30-10:00 PM",
            "activity": "Skills assessment and project preparation",
            "questions": ["How comfortable am I with the tools?", "What project will best showcase my abilities?", "What do I need to prepare for tomorrow?"]
          }
        },
        "day4": {
          "title": "Day 4: Portfolio Development & Best Practices",
          "totalTime": "4 hours",
          "schedule": "Project work with continuous learning integration",
          "tasks": [
            {
              "time": "9:00-11:00 AM",
              "task": "Portfolio Project Development",
              "type": "project",
              "details": "Start building a comprehensive portfolio project that showcases relevant skills",
              "resources": ["Development environment", "Project requirements", "Design patterns"],
              "deliverable": "Initial project structure and core functionality",
              "successCriteria": "Solid foundation for portfolio project"
            },
            {
              "time": "11:15 AM-12:45 PM",
              "task": "Best Practices Implementation",
              "type": "practice",
              "details": "Implement industry best practices and coding standards",
              "resources": ["Style guides", "Best practices documentation", "Code review checklists"],
              "deliverable": "Well-structured, professional-quality code",
              "successCriteria": "Code meets industry standards and best practices"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Advanced Feature Development",
              "type": "project",
              "details": "Add advanced features and functionality to portfolio project",
              "resources": ["Advanced tutorials", "Feature documentation", "Example implementations"],
              "deliverable": "Enhanced project with advanced features",
              "successCriteria": "Project demonstrates advanced technical capabilities"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Testing & Quality Assurance",
              "type": "practice",
              "details": "Test project thoroughly and ensure quality standards",
              "resources": ["Testing frameworks", "Quality checklists", "Debugging tools"],
              "deliverable": "Thoroughly tested and debugged project",
              "successCriteria": "Project works flawlessly and meets quality standards"
            }
          ],
          "eveningReview": {
            "time": "9:30-10:00 PM",
            "activity": "Project progress review and quality assessment",
            "questions": ["Is my project showcasing the right skills?", "What quality improvements can I make?", "What's my plan for tomorrow?"]
          }
        },
        "day5": {
          "title": "Day 5: Project Completion & Initial Interview Prep",
          "totalTime": "4 hours",
          "schedule": "Finalize project and begin interview preparation",
          "tasks": [
            {
              "time": "9:00-10:30 AM",
              "task": "Project Finalization",
              "type": "project",
              "details": "Complete portfolio project with documentation and presentation materials",
              "resources": ["Documentation templates", "Presentation tools", "Portfolio platforms"],
              "deliverable": "Complete, documented portfolio project",
              "successCriteria": "Project is interview-ready and professionally presented"
            },
            {
              "time": "10:45 AM-12:15 PM",
              "task": "Project Presentation Preparation",
              "type": "preparation",
              "details": "Prepare to present and explain the project effectively",
              "resources": ["Presentation templates", "Demo scripts", "Q&A preparation"],
              "deliverable": "Polished project presentation",
              "successCriteria": "Can confidently demo and explain the project"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Technical Interview Questions Study",
              "type": "study",
              "details": "Research and prepare for common technical interview questions",
              "resources": ["Interview question databases", "Technical interview guides", "Practice platforms"],
              "deliverable": "Comprehensive Q&A preparation document",
              "successCriteria": "Ready to handle common technical questions"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Week 1 Comprehensive Review",
              "type": "review",
              "details": "Review all learning from week 1 and identify areas for week 2",
              "resources": ["Week 1 notes", "Progress checklist", "Gap analysis"],
              "deliverable": "Week 1 completion report with week 2 priorities",
              "successCriteria": "Clear understanding of progress and next steps"
            }
          ],
          "eveningReview": {
            "time": "9:30-10:00 PM",
            "activity": "Week 1 completion assessment and week 2 planning",
            "questions": ["What did I accomplish this week?", "What are my strongest areas now?", "What should I focus on in week 2?"]
          }
        }
      },
      "weeklyMilestones": [
        "Deep understanding of company and industry",
        "Solid foundation in core technical skills",
        "Proficiency with essential tools and technologies",
        "Complete portfolio project demonstrating relevant skills",
        "Initial interview preparation completed"
      ],
      "weeklyReview": {
        "assessmentCriteria": ["Technical knowledge gained", "Practical skills developed", "Portfolio quality", "Interview readiness"],
        "nextWeekPreparation": "Advanced skills development and interview mastery"
      }
    },
    "week2": {
      "title": "Week 2: Advanced Skills & Interview Mastery",
      "objective": "Develop advanced expertise and interview confidence",
      "totalHours": "28-32 hours",
      "focusAreas": ["Advanced technical concepts", "Interview skills", "Behavioral preparation"],
      "dailySchedule": {
        "day6": {
          "title": "Day 6: Advanced Technical Concepts",
          "totalTime": "4.5 hours",
          "tasks": [
            {
              "time": "9:00-11:00 AM",
              "task": "Advanced Architecture & Design Patterns",
              "type": "learning",
              "details": "Study advanced technical concepts specific to the role",
              "resources": ["Advanced courses", "Architecture documentation", "Design pattern guides"],
              "deliverable": "Advanced concepts summary with practical applications",
              "successCriteria": "Can discuss advanced technical topics confidently"
            },
            {
              "time": "11:15 AM-12:45 PM",
              "task": "Complex Problem Solving",
              "type": "practice",
              "details": "Tackle complex, real-world problems similar to job scenarios",
              "resources": ["Advanced problem sets", "Case studies", "Simulation environments"],
              "deliverable": "Solutions to complex problems with detailed explanations",
              "successCriteria": "Can solve challenging problems efficiently"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "System Design & Scalability",
              "type": "learning",
              "details": "Understand system design principles and scalability concepts",
              "resources": ["System design courses", "Scalability guides", "Real-world examples"],
              "deliverable": "System design knowledge base with examples",
              "successCriteria": "Can discuss system design trade-offs intelligently"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Performance Optimization",
              "type": "practice",
              "details": "Learn and practice performance optimization techniques",
              "resources": ["Performance guides", "Optimization tools", "Benchmarking resources"],
              "deliverable": "Performance optimization examples and best practices",
              "successCriteria": "Can identify and solve performance issues"
            }
          ]
        },
        "day7": {
          "title": "Day 7: Interview Skills Development",
          "totalTime": "4.5 hours",
          "tasks": [
            {
              "time": "9:00-10:30 AM",
              "task": "Behavioral Interview Preparation",
              "type": "preparation",
              "details": "Prepare compelling stories using STAR method for behavioral questions",
              "resources": ["STAR method guides", "Behavioral question lists", "Story templates"],
              "deliverable": "5-7 polished behavioral interview stories",
              "successCriteria": "Can confidently answer any behavioral question"
            },
            {
              "time": "10:45 AM-12:15 PM",
              "task": "Technical Interview Practice",
              "type": "practice",
              "details": "Practice technical interviews with mock scenarios",
              "resources": ["Mock interview platforms", "Technical question banks", "Practice partners"],
              "deliverable": "Improved technical interview performance",
              "successCriteria": "Can handle technical questions under pressure"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Company-Specific Interview Prep",
              "type": "preparation",
              "details": "Prepare for company-specific interview formats and questions",
              "resources": ["Glassdoor interviews", "Company interview guides", "Employee insights"],
              "deliverable": "Company-specific interview strategy",
              "successCriteria": "Ready for this company's specific interview process"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Questions to Ask Preparation",
              "type": "preparation",
              "details": "Prepare thoughtful questions to ask interviewers",
              "resources": ["Question templates", "Company research", "Role insights"],
              "deliverable": "List of insightful questions for each interview stage",
              "successCriteria": "Can ask questions that demonstrate genuine interest and knowledge"
            }
          ]
        }
      }
    },
    "week3": {
      "title": "Week 3: Expert-Level Mastery & Final Preparation",
      "objective": "Achieve expert-level proficiency and complete interview readiness",
      "totalHours": "30-35 hours",
      "focusAreas": ["Expert-level skills", "Mock interviews", "Final preparations"],
      "dailySchedule": {
        "day15": {
          "title": "Day 15: Final Interview Simulation",
          "totalTime": "4 hours",
          "tasks": [
            {
              "time": "9:00-11:00 AM",
              "task": "Full Mock Interview Session",
              "type": "simulation",
              "details": "Complete end-to-end interview simulation with feedback",
              "resources": ["Mock interview services", "Interview partners", "Recording tools"],
              "deliverable": "Interview performance analysis and improvement plan",
              "successCriteria": "Interview-ready with confidence and polish"
            },
            {
              "time": "11:15 AM-12:45 PM",
              "task": "Interview Feedback Integration",
              "type": "improvement",
              "details": "Address feedback and polish interview performance",
              "resources": ["Feedback analysis", "Improvement strategies", "Practice exercises"],
              "deliverable": "Refined interview skills based on feedback",
              "successCriteria": "All major interview weaknesses addressed"
            },
            {
              "time": "7:00-8:30 PM",
              "task": "Final Knowledge Review",
              "type": "review",
              "details": "Comprehensive review of all technical and industry knowledge",
              "resources": ["Complete study materials", "Knowledge checklists", "Quick reference guides"],
              "deliverable": "Complete knowledge validation",
              "successCriteria": "Confident in all required knowledge areas"
            },
            {
              "time": "8:45-9:30 PM",
              "task": "Interview Day Preparation",
              "type": "preparation",
              "details": "Prepare everything needed for the actual interview",
              "resources": ["Interview checklists", "Logistics planning", "Confidence building"],
              "deliverable": "Complete interview day readiness",
              "successCriteria": "Ready to excel in the actual interview"
            }
          ]
        }
      }
    }
  },
  "comprehensiveResources": {
    "essentialBooks": [
      "Book 1 with specific chapters to focus on",
      "Book 2 with reading schedule",
      "Book 3 with practical exercises"
    ],
    "onlineCourses": [
      {
        "name": "Course Name",
        "provider": "Platform",
        "duration": "X hours",
        "focus": "Specific skills covered",
        "priority": "High/Medium/Low"
      }
    ],
    "practicalResources": [
      {
        "type": "Practice Platform",
        "name": "Platform Name",
        "focus": "What to practice",
        "timeAllocation": "Hours per week"
      }
    ],
    "industryResources": [
      {
        "type": "Publication/Blog",
        "name": "Resource Name",
        "focus": "Industry insights",
        "frequency": "How often to read"
      }
    ],
    "toolsAndSoftware": [
      {
        "name": "Tool Name",
        "purpose": "What it's used for",
        "proficiencyLevel": "Beginner/Intermediate/Advanced",
        "learningTime": "Hours needed"
      }
    ]
  },
  "interviewMastery": {
    "technicalQuestions": [
      {
        "category": "Core Technical Skills",
        "questions": ["Detailed technical questions with expected answers"],
        "preparationTips": ["How to prepare for each question type"]
      }
    ],
    "behavioralQuestions": [
      {
        "category": "Leadership",
        "questions": ["Specific behavioral questions"],
        "starStories": ["Suggested story themes"]
      }
    ],
    "companySpecificQuestions": [
      {
        "category": "Company Culture",
        "questions": ["Company-specific questions"],
        "preparationStrategy": ["How to research and prepare"]
      }
    ],
    "questionsToAsk": [
      {
        "category": "Role Specifics",
        "questions": ["Thoughtful questions about the role"],
        "rationale": ["Why these questions are valuable"]
      }
    ]
  },
  "progressTracking": {
    "dailyChecklist": {
      "technical": ["Daily technical learning goals"],
      "practical": ["Daily hands-on practice goals"],
      "interview": ["Daily interview preparation goals"]
    },
    "weeklyMilestones": [
      {
        "week": 1,
        "milestone": "Foundation Complete",
        "criteria": ["Specific measurable criteria"],
        "assessment": ["How to verify completion"]
      }
    ],
    "overallProgress": {
      "knowledgeGaps": ["Track gap closure"],
      "skillDevelopment": ["Track skill improvement"],
      "interviewReadiness": ["Track interview confidence"]
    }
  },
  "successStrategies": {
    "studyTechniques": [
      "Active learning with immediate application",
      "Spaced repetition for knowledge retention",
      "Project-based learning for practical skills"
    ],
    "timeManagement": [
      "Pomodoro technique for focused learning",
      "Time-blocking for different types of activities",
      "Regular breaks to maintain effectiveness"
    ],
    "motivationMaintenance": [
      "Set daily wins and celebrate progress",
      "Visualize interview success regularly",
      "Connect with others in similar situations"
    ],
    "stressManagement": [
      "Regular exercise and healthy habits",
      "Mindfulness and relaxation techniques",
      "Adequate sleep and nutrition"
    ]
  }
}
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "day5": {
          "title": "Day 5: Review & Assessment",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "30 minutes",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "weekend": {
          "title": "Weekend: Consolidation",
          "duration": "3-4 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "1 hour",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        }
      }
    },
    "week2": {
      "title": "Week 2: Advanced Skills",
      "objectives": ["Objective 1", "Objective 2"],
      "dailyTasks": {
        "day1": {
          "title": "Day 1: Advanced Concepts",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "45 minutes",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "day2": {
          "title": "Day 2: Real-world Application",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "1 hour",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "day3": {
          "title": "Day 3: Industry Knowledge",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "45 minutes",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "day4": {
          "title": "Day 4: Portfolio Building",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "1.5 hours",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "day5": {
          "title": "Day 5: Mock Scenarios",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "1 hour",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        },
        "weekend": {
          "title": "Weekend: Project Work",
          "duration": "4-5 hours",
          "tasks": [
            {
              "task": "Task description",
              "type": "reading/practice/project/research",
              "duration": "2 hours",
              "resources": ["Resource 1", "Resource 2"],
              "deliverable": "What to produce/learn"
            }
          ]
        }
      }
    },
    "finalWeek": {
      "title": "Final Week: Interview Prep",
      "objectives": ["Master interview skills", "Final review", "Portfolio polishing"],
      "dailyTasks": {
        "day1": {
          "title": "Day 1: Company Research Deep Dive",
          "duration": "3-4 hours",
          "tasks": [
            {
              "task": "Company culture and values research",
              "type": "research",
              "duration": "1 hour",
              "resources": ["Company website", "LinkedIn company page", "Glassdoor reviews"],
              "deliverable": "Company research document"
            },
            {
              "task": "Recent company news and developments",
              "type": "research",
              "duration": "45 minutes",
              "resources": ["Company blog", "Press releases", "Industry news"],
              "deliverable": "News summary document"
            },
            {
              "task": "Competitor analysis",
              "type": "research",
              "duration": "1 hour",
              "resources": ["Industry reports", "Competitor websites"],
              "deliverable": "Competitive landscape notes"
            }
          ]
        },
        "day2": {
          "title": "Day 2: Technical Interview Prep",
          "duration": "3-4 hours",
          "tasks": [
            {
              "task": "Practice technical questions",
              "type": "practice",
              "duration": "2 hours",
              "resources": ["LeetCode", "HackerRank", "InterviewBit"],
              "deliverable": "Complete 5-10 practice problems"
            },
            {
              "task": "System design review",
              "type": "reading",
              "duration": "1 hour",
              "resources": ["System design primer", "High scalability blog"],
              "deliverable": "System design template"
            }
          ]
        },
        "day3": {
          "title": "Day 3: Behavioral Interview Prep",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "STAR method practice",
              "type": "practice",
              "duration": "1.5 hours",
              "resources": ["Common behavioral questions list"],
              "deliverable": "5 prepared STAR stories"
            },
            {
              "task": "Questions to ask interviewer",
              "type": "preparation",
              "duration": "30 minutes",
              "resources": ["Interview question guides"],
              "deliverable": "List of thoughtful questions"
            }
          ]
        },
        "day4": {
          "title": "Day 4: Portfolio & Demo Prep",
          "duration": "3-4 hours",
          "tasks": [
            {
              "task": "Portfolio presentation",
              "type": "project",
              "duration": "2 hours",
              "resources": ["Portfolio template", "Demo scripts"],
              "deliverable": "Polished portfolio presentation"
            },
            {
              "task": "Mock presentation practice",
              "type": "practice",
              "duration": "1 hour",
              "resources": ["Recording software for self-review"],
              "deliverable": "Recorded practice presentation"
            }
          ]
        },
        "day5": {
          "title": "Day 5: Final Review & Mock Interview",
          "duration": "2-3 hours",
          "tasks": [
            {
              "task": "Full mock interview",
              "type": "practice",
              "duration": "1.5 hours",
              "resources": ["Mock interview platforms", "Friend/mentor"],
              "deliverable": "Interview feedback notes"
            },
            {
              "task": "Final knowledge review",
              "type": "reading",
              "duration": "1 hour",
              "resources": ["All study materials"],
              "deliverable": "Confidence checklist"
            }
          ]
        }
      }
    }
  },
  "resources": {
    "books": ["Book 1", "Book 2"],
    "onlineCourses": ["Course 1", "Course 2"],
    "websites": ["Website 1", "Website 2"],
    "tools": ["Tool 1", "Tool 2"],
    "communities": ["Community 1", "Community 2"],
    "certifications": ["Cert 1", "Cert 2"]
  },
  "interviewPrep": {
    "technicalQuestions": ["Question 1", "Question 2"],
    "behavioralQuestions": ["Question 1", "Question 2"],
    "companySpecificQuestions": ["Question 1", "Question 2"],
    "questionsToAsk": ["Question 1", "Question 2"]
  },
  "milestones": [
    {
      "week": 1,
      "milestone": "Foundation established",
      "criteria": ["Criteria 1", "Criteria 2"]
    },
    {
      "week": 2,
      "milestone": "Advanced skills developed",
      "criteria": ["Criteria 1", "Criteria 2"]
    },
    {
      "week": 3,
      "milestone": "Interview ready",
      "criteria": ["Criteria 1", "Criteria 2"]
    }
  ],
  "tips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ]
}

**CRITICAL REQUIREMENTS FOR ULTRA-DETAILED PLANNING:**

1. **Hyper-Specific Tasks**: Every task must be specific with exact times, durations, and measurable outcomes
2. **Granular Scheduling**: Include specific time slots (e.g., "9:00-10:30 AM") for maximum structure
3. **Concrete Deliverables**: Each task must produce a specific, measurable deliverable
4. **Resource Specificity**: Provide exact resources, not generic categories
5. **Progressive Difficulty**: Tasks should build systematically from basic to advanced
6. **Real-World Application**: Focus on practical skills that directly apply to the job
7. **Company Integration**: Weave company-specific knowledge throughout the plan
8. **Interview Optimization**: Every activity should contribute to interview success
9. **Skill Validation**: Include methods to verify learning and skill development
10. **Time Efficiency**: Maximize learning impact per hour invested
11. **Confidence Building**: Structure activities to build confidence progressively
12. **Practical Application**: Emphasize hands-on practice over theoretical learning
13. **Portfolio Development**: Include substantial project work for demonstration
14. **Expert-Level Detail**: Provide the level of detail an expert coach would give
15. **Actionable Precision**: Every instruction should be immediately actionable

**CONTENT DEPTH REQUIREMENTS:**
- Each day should have 4-6 specific, timed tasks
- Each task should include exact time allocations
- Provide specific resources, not general categories
- Include exact deliverables and success criteria
- Add daily review sessions with specific reflection questions
- Create weekly milestone assessments
- Include detailed progress tracking mechanisms

**PERSONALIZATION REQUIREMENTS:**
- Adapt content specifically to the job requirements
- Address the candidate's specific skill gaps
- Leverage their existing strengths
- Consider their experience level
- Include company-specific preparation elements

Make this the most comprehensive, detailed, and actionable study plan possible. The candidate should feel like they have a world-class personal coach guiding them step-by-step to interview success.

Return ONLY the JSON object, no other text.
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // Use more powerful model for detailed output
        messages: [
          {
            role: 'system',
            content: 'You are an elite career coach and learning specialist with 20+ years of experience. You create ultra-detailed, hyper-specific study plans that transform candidates into perfect applicants. Your plans are known for their precision, actionability, and success rates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent, detailed output
        max_tokens: 16000 // Increase token limit for comprehensive plans
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    try {
      return JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw response:', generatedContent);
      
      // Fallback: create a detailed structure if JSON parsing fails
      return {
        overview: {
          title: `Ultra-Detailed Preparation Plan for ${jobData.jobTitle} at ${jobData.companyName}`,
          totalDuration: "3-4 weeks intensive preparation",
          hoursPerDay: "3-4 hours daily commitment",
          difficulty: "Challenging but achievable",
          description: "A comprehensive preparation roadmap designed to transform you into the ideal candidate",
          successMetrics: [
            "Technical proficiency in all required skills",
            "Deep understanding of company and industry",
            "Confident interview performance",
            "Portfolio project demonstrating expertise"
          ]
        },
        detailedSkillGapAnalysis: {
          currentStrengths: {
            technical: userProfile.skills || ["Technical skills to be assessed"],
            soft: ["Communication", "Problem-solving"],
            industry: ["Experience to be leveraged"]
          },
          criticalGaps: {
            mustHave: ["Skills required for the role"],
            niceToHave: ["Preferred qualifications"],
            knowledge: ["Industry-specific knowledge gaps"]
          },
          overallStrategy: "Focus on bridging critical skill gaps while leveraging existing strengths, with emphasis on practical application and interview preparation"
        },
        detailedStudyPlan: {
          week1: {
            title: "Week 1: Foundation Mastery & Deep Company Research",
            objective: "Build unshakeable fundamentals and comprehensive company knowledge",
            totalHours: "25-30 hours",
            focusAreas: ["Core technical skills", "Company deep dive", "Industry landscape"],
            dailySchedule: {
              day1: {
                title: "Day 1: Comprehensive Company & Industry Analysis",
                totalTime: "4 hours",
                schedule: "Morning intensive research, evening analysis",
                tasks: [
                  {
                    time: "9:00-11:00 AM",
                    task: "Deep Company Research & Analysis",
                    type: "research",
                    details: "Comprehensive study of company history, culture, recent developments, and strategic direction",
                    resources: ["Company website", "Annual reports", "Recent news", "LinkedIn insights", "Glassdoor reviews"],
                    deliverable: "Detailed company profile with key insights and talking points",
                    successCriteria: "Can confidently discuss company's mission, values, recent achievements, and future direction"
                  },
                  {
                    time: "7:00-9:00 PM",
                    task: "Industry Landscape & Competitive Analysis",
                    type: "research",
                    details: "Study industry trends, market dynamics, key competitors, and future outlook",
                    resources: ["Industry reports", "Market analysis", "Competitor research", "Trend publications"],
                    deliverable: "Industry analysis document with competitive positioning insights",
                    successCriteria: "Can intelligently discuss industry challenges, opportunities, and company's market position"
                  }
                ]
              }
            }
          }
        },
        error: "AI response parsing failed - using enhanced fallback structure. Please regenerate for full detailed plan.",
        fallbackNote: "This is a basic structure. Regenerating the plan will provide the full ultra-detailed preparation roadmap."
      };
    }
  } catch (error) {
    console.error('Error generating prep plan:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }

  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ message: 'Only applicants can generate prep plans' });
  }

  try {
    const { prepPlanId } = req.body;

    if (!prepPlanId) {
      return res.status(400).json({ message: 'Prep plan ID is required' });
    }

    // Get the database
    const db = await getDatabase();

    // Fetch the prep plan
    const prepPlan = await db.collection('prepPlans').findOne({
      _id: new ObjectId(prepPlanId),
      applicantId: auth.user.userId
    });

    if (!prepPlan) {
      return res.status(404).json({ message: 'Prep plan not found' });
    }

    // Fetch user profile for personalization
    const userProfile = await db.collection('users').findOne({
      _id: new ObjectId(auth.user.userId)
    });

    console.log('📚 Generating detailed prep plan for:', {
      jobTitle: prepPlan.jobTitle,
      company: prepPlan.companyName,
      userId: auth.user.userId
    });

    // Generate the detailed study plan using AI
    const detailedPlan = await generateDetailedPrepPlan(prepPlan, userProfile || {});

    // Update the prep plan with the detailed study plan
    const updateResult = await db.collection('prepPlans').updateOne(
      { _id: new ObjectId(prepPlanId) },
      {
        $set: {
          detailedPlan: detailedPlan,
          planGenerated: true,
          generatedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Failed to update prep plan' });
    }

    console.log('✅ Detailed prep plan generated successfully');

    return res.status(200).json({
      success: true,
      message: 'Detailed prep plan generated successfully',
      data: {
        prepPlanId: prepPlanId,
        detailedPlan: detailedPlan
      }
    });

  } catch (error) {
    console.error('Error generating detailed prep plan:', error);
    return res.status(500).json({ 
      message: 'Failed to generate detailed prep plan',
      error: error.message 
    });
  }
}
