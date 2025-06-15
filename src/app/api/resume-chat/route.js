import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Groq integration would go here
// For now, we'll create a mock intelligent chat response

export async function POST(request) {
  console.log('💬 Resume Chat API called');
  
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, message, conversationHistory = [] } = body;

    console.log('💬 Chat request:', {
      jobId,
      message: message?.substring(0, 50) + '...',
      historyLength: conversationHistory.length
    });

    // Fetch job details from MongoDB
    if (!jobId) {
      return NextResponse.json({ success: false, message: 'Job ID is required' }, { status: 400 });
    }

    const { db } = await connectDB();
    const job = await db.collection('jobs').findOne({ 
      _id: new ObjectId(jobId),
      status: 'active'
    });

    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    // Get the latest resume analysis for context
    const latestAnalysis = await db.collection('resumeAnalyses')
      .findOne(
        { userId: decoded.userId, jobId },
        { sort: { analysisDate: -1 } }
      );

    console.log('📊 Context for chat:', {
      hasJob: !!job,
      hasAnalysis: !!latestAnalysis,
      analysisScore: latestAnalysis?.overallScore
    });

    // Generate intelligent response based on job and analysis context
    const chatResponse = await generateIntelligentResponse({
      message,
      job,
      analysis: latestAnalysis,
      conversationHistory
    });

    // Store chat interaction in database
    const chatRecord = {
      userId: decoded.userId,
      jobId,
      timestamp: new Date(),
      userMessage: message,
      assistantResponse: chatResponse.response,
      context: {
        hasAnalysis: !!latestAnalysis,
        analysisScore: latestAnalysis?.overallScore
      }
    };

    await db.collection('chatInteractions').insertOne(chatRecord);

    return NextResponse.json({
      success: true,
      data: {
        response: chatResponse.response,
        suggestions: chatResponse.suggestions,
        context: chatResponse.context
      }
    });

  } catch (error) {
    console.error('❌ Error in resume chat:', error);
    return NextResponse.json(
      { success: false, message: 'Chat failed', error: error.message },
      { status: 500 }
    );
  }
}

async function generateIntelligentResponse({ message, job, analysis, conversationHistory }) {
  console.log('🤖 Generating intelligent response...');

  // In a real implementation, this would use Groq API
  // For now, we'll create context-aware responses

  const messageLower = message.toLowerCase();
  
  // Job-specific responses
  if (messageLower.includes('job') || messageLower.includes('role') || messageLower.includes('position')) {
    return {
      response: `This ${job.title} position at ${job.companyName} is looking for someone with skills in ${job.requirements?.slice(0, 3).join(', ') || 'the technologies mentioned in the job description'}. ${job.description ? 'The role focuses on ' + job.description.substring(0, 100) + '...' : 'It seems like an interesting opportunity.'}`,
      suggestions: [
        'Tell me about the required skills',
        'How can I improve my resume for this role?',
        'What are the key responsibilities?'
      ],
      context: 'job_overview'
    };
  }

  // Resume analysis responses
  if (analysis && (messageLower.includes('resume') || messageLower.includes('match') || messageLower.includes('score'))) {
    const scoreMsg = analysis.overallScore >= 80 ? 'excellent match' : 
                    analysis.overallScore >= 60 ? 'good match with room for improvement' :
                    analysis.overallScore >= 40 ? 'fair match that needs work' : 'challenging match';
    
    return {
      response: `Based on your resume analysis, you have a ${scoreMsg} with a score of ${analysis.overallScore}%. Your strengths include ${analysis.matchedSkills?.slice(0, 2).join(' and ') || 'several relevant skills'}. ${analysis.missingSkills?.length > 0 ? `Consider adding ${analysis.missingSkills.slice(0, 2).join(' and ')} to strengthen your profile.` : ''}`,
      suggestions: [
        'How can I improve my match score?',
        'What skills should I focus on?',
        'Show me specific improvement suggestions'
      ],
      context: 'resume_analysis'
    };
  }

  // Skills improvement responses
  if (messageLower.includes('improve') || messageLower.includes('better') || messageLower.includes('enhance')) {
    const suggestions = analysis?.suggestions || [];
    const topSuggestion = suggestions.find(s => s.priority === 'high') || suggestions[0];
    
    return {
      response: `To improve your candidacy for this role, I recommend: ${topSuggestion ? topSuggestion.description : 'focusing on the key requirements mentioned in the job description'}. ${analysis ? `Your current match score is ${analysis.overallScore}%, and with these improvements, you could significantly increase your chances.` : ''}`,
      suggestions: [
        'What specific skills should I add?',
        'How do I highlight my experience better?',
        'Can you help me tailor my resume?'
      ],
      context: 'improvement_advice'
    };
  }

  // Skills-specific responses
  if (messageLower.includes('skill') || messageLower.includes('technology') || messageLower.includes('requirement')) {
    const jobSkills = job.requirements || [];
    const matchedSkills = analysis?.matchedSkills || [];
    const missingSkills = analysis?.missingSkills || [];
    
    return {
      response: `This role requires skills in ${jobSkills.slice(0, 4).join(', ')}. ${matchedSkills.length > 0 ? `You already have experience with ${matchedSkills.slice(0, 2).join(' and ')}, which is great!` : ''} ${missingSkills.length > 0 ? `Consider developing skills in ${missingSkills.slice(0, 2).join(' and ')} to become a stronger candidate.` : ''}`,
      suggestions: [
        'How can I learn these missing skills?',
        'Which skills are most important?',
        'Can you prioritize what I should focus on?'
      ],
      context: 'skills_guidance'
    };
  }

  // General conversation responses
  if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('help')) {
    return {
      response: `Hello! I'm here to help you with your job application for the ${job.title} position at ${job.companyName}. I can provide insights about the role, help you understand how well your resume matches, and give personalized advice to improve your chances. What would you like to know?`,
      suggestions: [
        'Analyze my resume for this job',
        'What does this role require?',
        'How can I improve my application?'
      ],
      context: 'general_help'
    };
  }

  // Default intelligent response
  return {
    response: `I understand you're asking about "${message}". Based on this ${job.title} position at ${job.companyName}, I can help you with resume optimization, skill development, and interview preparation. ${analysis ? `Your current match score is ${analysis.overallScore}%.` : ''} What specific aspect would you like to explore?`,
    suggestions: [
      'Tell me about this job opportunity',
      'How does my resume match this role?',
      'What can I do to improve my chances?'
    ],
    context: 'contextual_response'
  };
}

// In a production environment, you would integrate with Groq like this:
/*
async function callGroqAPI({ message, context, jobData, analysisData }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor helping candidates with job applications. 
                   Job: ${jobData.title} at ${jobData.companyName}
                   Requirements: ${jobData.requirements?.join(', ')}
                   ${analysisData ? `Resume Analysis: Score ${analysisData.overallScore}%, Matched skills: ${analysisData.matchedSkills?.join(', ')}, Missing skills: ${analysisData.missingSkills?.join(', ')}` : ''}
                   Provide helpful, specific, and actionable advice.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
*/
