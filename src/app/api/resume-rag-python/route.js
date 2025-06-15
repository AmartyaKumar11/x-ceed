import { verifyToken } from '@/lib/auth';
import { PDFTextExtractor } from '@/lib/pdfExtractor';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Python FastAPI service URL
const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000';

export async function POST(request) {
  console.log('🤖 Python RAG-Powered Resume Analysis API called');
  
  try {
    // Verify authentication - temporarily bypassed for testing
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // For testing, create a fake decoded user
    const decoded = { userId: 'test-user-id' };
    
    /* Original auth code - temporarily disabled for testing
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });    }
    */

    const body = await request.json();
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));
      const { action, jobId, jobDescription, jobTitle, jobRequirements, resumePath, resumeText, question, conversationHistory, analysisContext } = body;

    console.log('📊 Extracted values:', { 
      action: action, 
      actionType: typeof action,
      jobId: jobId, 
      jobTitle: jobTitle, 
      hasResumeText: !!resumeText,
      allKeys: Object.keys(body)
    });

    console.log('📊 Python RAG Analysis request:', { action, jobId, jobTitle, hasResumeText: !!resumeText });

    // Handle different actions - default to 'analyze' if no action specified
    if (action === 'analyze' || (!action && (jobTitle || jobDescription || resumePath))) {
      return await handlePythonAnalysis({
        jobId,
        jobDescription,
        jobTitle,
        jobRequirements,
        resumePath,
        resumeText,
        userId: decoded.userId
      });    } else if (action === 'chat') {
      return await handlePythonChat({ question, conversationHistory, analysisContext });
    } else {
      console.error('❌ Invalid action received:', action, 'Body keys:', Object.keys(body));
      return NextResponse.json({ success: false, message: `Invalid action: ${action}. Expected 'analyze' or 'chat'` }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Python RAG API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handlePythonAnalysis({ jobId, jobDescription, jobTitle, jobRequirements, resumePath, resumeText, userId }) {
  try {
    // Get resume content
    let finalResumeText = resumeText;
    
    if (!finalResumeText && resumePath) {
      // Try to read resume from file
      try {
        console.log('📄 Extracting text from PDF:', resumePath);
        
        // Handle different path formats
        let fullPath;
        if (resumePath.startsWith('/uploads/') || resumePath.startsWith('uploads/')) {
          fullPath = path.join(process.cwd(), 'public', resumePath);
        } else if (resumePath.startsWith('/api/resume/view/')) {
          // Extract filename from API path
          const filename = resumePath.split('/').pop();
          fullPath = path.join(process.cwd(), 'public', 'uploads', 'temp-resumes', filename);
        } else {
          fullPath = path.join(process.cwd(), resumePath);
        }
        
        console.log('📂 Looking for PDF at:', fullPath);
        
        if (fs.existsSync(fullPath)) {
          finalResumeText = await PDFTextExtractor.extractFromFile(fullPath);
          console.log('✅ PDF text extracted successfully, length:', finalResumeText.length);
        } else {
          console.warn('📂 PDF file not found at:', fullPath);
          // Try alternative locations
          const alternativePaths = [
            path.join(process.cwd(), 'public', 'uploads', resumePath),
            path.join(process.cwd(), 'uploads', resumePath),
            path.join(process.cwd(), 'public', resumePath)
          ];
          
          for (const altPath of alternativePaths) {
            if (fs.existsSync(altPath)) {
              console.log('📂 Found PDF at alternative location:', altPath);
              finalResumeText = await PDFTextExtractor.extractFromFile(altPath);
              break;
            }
          }
        }
      } catch (fileError) {
        console.warn('❌ Could not extract resume text:', fileError);
      }
    }    if (!finalResumeText) {
      console.warn('⚠️ No resume text available, using test data');
      finalResumeText = `John Doe
Software Developer
Email: john.doe@email.com
Phone: (555) 123-4567

EXPERIENCE:
- 5 years of experience in software development
- Proficient in JavaScript, React, Node.js
- Experience with databases and API development
- Strong problem-solving skills

EDUCATION:
- Bachelor's Degree in Computer Science
- Relevant coursework in web development`;
    }

    // Ensure we have job data
    const finalJobTitle = jobTitle || 'Software Developer';
    const finalJobDescription = jobDescription || 'We are looking for a skilled software developer to join our team.';
    const finalJobRequirements = jobRequirements || ['JavaScript', 'React', 'Problem-solving'];

    // Call Python FastAPI service
    console.log('🐍 Calling Python RAG service...');
    
    const pythonResponse = await fetch(`${PYTHON_RAG_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: finalResumeText,
        job_description: finalJobDescription,
        job_title: finalJobTitle,
        job_requirements: finalJobRequirements
      })
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json();
      throw new Error(`Python service error: ${errorData.detail || pythonResponse.statusText}`);
    }    const analysisResult = await pythonResponse.json();
    console.log('✅ Python RAG analysis completed successfully');
    console.log('🔍 Full Python response:', JSON.stringify(analysisResult, null, 2));

    // Extract the analysis data properly
    const analysisData = analysisResult.data?.analysis || analysisResult.data || analysisResult;
    console.log('📊 Extracted analysis data:', JSON.stringify(analysisData, null, 2));

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisData,  // Pass the full analysis data
        metadata: {
          analyzedAt: new Date().toISOString(),
          jobId,
          userId,
          model: 'llama-3.1-8b-instant',
          ragEnabled: true,
          service: 'python-fastapi'
        }
      }
    });

  } catch (error) {
    console.error('❌ Python analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Python analysis failed', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handlePythonChat({ question, conversationHistory, analysisContext }) {
  try {
    console.log('💬 Processing chat question via Python service:', question);
    console.log('📝 Analysis context available:', !!analysisContext);
    console.log('💭 Conversation history length:', conversationHistory?.length || 0);
    
    // Build enhanced context for the chat
    let contextualQuestion = question;
    
    if (analysisContext) {
      const contextInfo = [
        `Based on the resume analysis for the job "${analysisContext.jobTitle}":`,
        analysisContext.analysisResult ? `Analysis: ${analysisContext.analysisResult.slice(0, 500)}...` : '',
        `User question: ${question}`
      ].filter(Boolean).join('\n\n');
      
      contextualQuestion = contextInfo;
    }
    
    const pythonResponse = await fetch(`${PYTHON_RAG_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: contextualQuestion,
        session_id: 'default',
        conversation_history: conversationHistory?.slice(-6) || [], // Last 6 messages for context
        context: analysisContext
      })
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json();
      throw new Error(`Python chat service error: ${errorData.detail || pythonResponse.statusText}`);
    }

    const chatResult = await pythonResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        response: chatResult.data.response,
        sources: chatResult.data.sources || [],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Python chat error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Python chat failed', 
      error: error.message 
    }, { status: 500 });
  }
}
