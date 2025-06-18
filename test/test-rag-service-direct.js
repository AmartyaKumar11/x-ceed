// Test the RAG service directly to isolate the issue
import { config } from 'dotenv';
import ResumeRAGService from './src/lib/resumeRagService.js';

// Load environment variables first
config({ path: '.env.local' });

async function testRAGServiceDirect() {
  console.log('🧪 Testing RAG Service directly...');
  
  try {
    // Check if GROQ_API_KEY is available
    console.log('🔑 GROQ_API_KEY available:', !!process.env.GROQ_API_KEY);
    
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return;
    }
    
    // Test data
    const resumeText = `John Doe
Software Engineer

Experience:
- 3 years of React development at TechCorp
- Built multiple Next.js applications
- Strong JavaScript and TypeScript skills
- Experience with HTML, CSS, and responsive design
- Worked with REST APIs and GraphQL

Education:
- Bachelor of Computer Science, MIT (2019)

Skills:
- React, Next.js, JavaScript, TypeScript
- HTML5, CSS3, Sass, Tailwind CSS
- Node.js, Express.js
- Git, GitHub, Agile development
- MongoDB, PostgreSQL`;

    const jobDescription = `We are looking for a skilled Frontend Developer with expertise in React, Next.js, and modern JavaScript. The ideal candidate should have experience with UI/UX design principles and be comfortable working in an agile environment.

Requirements:
- 2+ years of React experience
- Experience with Next.js
- Strong JavaScript/TypeScript skills
- Knowledge of HTML5, CSS3
- Experience with version control (Git)
- Understanding of responsive design
- Agile development experience`;

    const jobTitle = 'Frontend Developer';
    const jobRequirements = ['React', 'Next.js', 'JavaScript', 'HTML/CSS', 'Git'];

    console.log('🤖 Initializing RAG service...');
    const ragService = new ResumeRAGService();
    
    console.log('🚀 Starting analysis...');
    const result = await ragService.initialize(
      resumeText,
      jobDescription,
      jobTitle,
      jobRequirements
    );

    console.log('✅ Analysis completed!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testRAGServiceDirect();
