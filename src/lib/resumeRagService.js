import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

class ResumeRAGService {
  constructor() {
    this.resumeContent = "";
    this.jobDescription = "";
    this.analysisData = null;
    this.llm = null;
  }

  // Initialize Groq LLM lazily
  initializeLLM() {
    if (!this.llm) {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is required');
      }
      
      this.llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama3-70b-8192", // High-performance model for analysis
        temperature: 0.1,
      });
      
      console.log('🤖 Groq LLM initialized successfully');
    }
    return this.llm;
  }

  // Initialize RAG with resume and job description
  async initialize(resumeText, jobDescription, jobTitle, jobRequirements = []) {
    this.resumeContent = resumeText;
    this.jobDescription = jobDescription;
    this.jobTitle = jobTitle;
    this.jobRequirements = jobRequirements;

    console.log('🤖 RAG Service initialized with:', {
      resumeLength: resumeText.length,
      jobTitle,
      requirementsCount: jobRequirements.length
    });

    // Perform comprehensive analysis
    this.analysisData = await this.performComprehensiveAnalysis();
    
    return this.analysisData;
  }
  // Comprehensive Resume Analysis
  async performComprehensiveAnalysis() {
    const analysisPrompt = PromptTemplate.fromTemplate(`
You are an expert HR professional and career advisor. Analyze this resume against the job description.

JOB INFORMATION:
Title: {jobTitle}  
Description: {jobDescription}
Requirements: {jobRequirements}

RESUME CONTENT:
{resumeContent}

IMPORTANT: Return ONLY valid JSON in the exact format below. Do not include any text before or after the JSON.

{{
  "overallMatch": {{
    "score": 85,
    "level": "Good",
    "summary": "Strong candidate with relevant experience"
  }},
  "keyStrengths": [
    {{"skill": "React Development", "relevance": "High", "evidence": "3 years experience mentioned in resume"}}
  ],
  "skillsAnalysis": {{
    "matchingSkills": [
      {{"skill": "React", "proficiency": "Advanced", "keywords": ["React", "components"]}}
    ],
    "missingSkills": [
      {{"skill": "Testing", "importance": "Important", "suggestion": "Learn Jest and React Testing Library"}}
    ],    "additionalSkills": [
      {{"skill": "TypeScript", "value": "Adds type safety and scalability"}}
    ]
  }},
  "experienceAnalysis": {{
    "relevantExperience": [
      {{"role": "Frontend Developer", "company": "TechCorp", "relevance": "High", "keyAchievements": ["Built responsive web apps", "Improved performance by 30%"]}}
    ],
    "experienceGaps": [
      {{"gap": "Backend experience", "impact": "Medium", "suggestion": "Learn Node.js basics"}}
    ],
    "totalRelevantYears": 3
  }},
  "educationAnalysis": {{
    "relevance": "High",
    "qualifications": [
      {{"degree": "Bachelor of Computer Science", "field": "Computer Science", "relevance": "Strong technical foundation"}}
    ],
    "recommendations": ["Consider additional certifications", "Stay updated with latest frameworks"]
  }},
  "improvementSuggestions": [
    {{
      "category": "Skills",
      "priority": "High", 
      "suggestion": "Add testing frameworks knowledge",
      "impact": "Better code quality and maintainability"
    }}
  ],
  "redFlags": [
    {{"issue": "Employment gap", "severity": "Low", "explanation": "Minor gap in employment history"}}
  ],
  "competitiveAdvantages": [
    {{"advantage": "Full-stack awareness", "value": "Can work across the entire application stack"}}
  ],
  "interviewPreparation": {{
    "strengthsToHighlight": ["React expertise", "Problem-solving skills"],
    "weaknessesToAddress": ["Limited testing experience"],
    "questionsToExpect": ["Tell me about a challenging React project", "How do you optimize React performance?"],
    "storiesToPrepare": ["Successfully implemented complex UI", "Debugged performance issues"]
  }},
  "salaryInsights": {{
    "marketPosition": "At market rate",
    "negotiationPoints": ["Strong technical skills", "Relevant experience"],
    "valueProposition": "Experienced developer with proven track record"
  }}
}}

Return only the JSON above, properly formatted and with actual analysis based on the provided resume and job description.
`);const chain = RunnableSequence.from([
      analysisPrompt,
      this.initializeLLM(),
      new StringOutputParser(),
    ]);

    try {
      const result = await chain.invoke({
        jobTitle: this.jobTitle,
        jobDescription: this.jobDescription,
        jobRequirements: this.jobRequirements.join(", "),
        resumeContent: this.resumeContent      });

      console.log('🤖 RAG Analysis result length:', result.length);
      console.log('🤖 RAG Analysis preview:', result.substring(0, 200) + '...');

      // Clean and parse JSON response
      let cleanedResult = result.trim();
      
      // Remove any markdown code blocks
      cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const jsonStr = jsonMatch[0];
      console.log('🔍 Attempting to parse JSON...');
      
      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError.message);
        console.error('📄 Raw JSON String:', jsonStr.substring(0, 500) + '...');
        throw new Error(`JSON parsing failed: ${parseError.message}`);
      }
    } catch (error) {
      console.error("❌ Analysis failed:", error.message);
      return this.getFallbackAnalysis();
    }
  }
  // Chat interface for questions about resume and job
  async chat(question, conversationHistory = []) {
    const chatPrompt = PromptTemplate.fromTemplate(`
You are an expert career advisor helping a job candidate. You have access to their resume and the job description they're applying for.

CONTEXT:
Job Title: {jobTitle}
Job Description: {jobDescription}
Job Requirements: {jobRequirements}
Resume Content: {resumeContent}

CONVERSATION HISTORY:
{conversationHistory}

CURRENT QUESTION: {question}

Provide a helpful, specific response based on the resume and job description. Reference specific details from both documents when relevant. Be conversational but professional.

RESPONSE:
`);    const chain = RunnableSequence.from([
      chatPrompt,
      this.initializeLLM(),
      new StringOutputParser(),
    ]);

    try {
      const historyText = conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join("\n");

      const response = await chain.invoke({
        jobTitle: this.jobTitle,
        jobDescription: this.jobDescription,
        jobRequirements: this.jobRequirements.join(", "),
        resumeContent: this.resumeContent,
        conversationHistory: historyText,
        question: question
      });

      return response.trim();
    } catch (error) {
      console.error("Chat failed:", error);
      return "I apologize, but I'm having trouble processing your question right now. Please try again.";
    }
  }

  // Fallback analysis if AI fails
  getFallbackAnalysis() {
    return {
      overallMatch: {
        score: 75,
        level: "Good",
        summary: "Analysis in progress - please try again"
      },
      keyStrengths: [
        { skill: "Professional Experience", relevance: "High", evidence: "Based on resume content" }
      ],
      skillsAnalysis: {
        matchingSkills: [],
        missingSkills: [],
        additionalSkills: []
      },
      experienceAnalysis: {
        relevantExperience: [],
        experienceGaps: [],
        totalRelevantYears: 0
      },
      educationAnalysis: {
        relevance: "Medium",
        qualifications: [],
        recommendations: []
      },
      improvementSuggestions: [
        {
          category: "Resume Format",
          priority: "Medium",
          suggestion: "Consider updating resume format",
          impact: "Better presentation"
        }
      ],
      redFlags: [],
      competitiveAdvantages: [],
      interviewPreparation: {
        strengthsToHighlight: [],
        weaknessesToAddress: [],
        questionsToExpected: [],
        storiesToPrepare: []
      },
      salaryInsights: {
        marketPosition: "At market rate",
        negotiationPoints: [],
        valueProposition: "Strong candidate profile"
      }
    };
  }
}

export default ResumeRAGService;
