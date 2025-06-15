import ResumeRAGService from '@/lib/resumeRagService';
import { verifyToken } from '@/lib/auth';
import { PDFTextExtractor } from '@/lib/pdfExtractor';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Initialize RAG service instance
let ragService = null;

export async function POST(request) {
  console.log('🤖 RAG-Powered Resume Analysis API called');
    try {
    // Verify authentication - temporarily bypassed for testing
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // For testing, create a fake decoded user
    const decoded = { userId: 'test-user-id' };
    
    /* Original auth code - temporarily disabled
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    */

    const body = await request.json();
    const { action, jobId, jobDescription, jobTitle, jobRequirements, resumePath, resumeText, question, conversationHistory } = body;

    console.log('📊 RAG Analysis request:', { action, jobId, jobTitle, hasResumeText: !!resumeText });

    // Handle different actions
    if (action === 'analyze') {
      return await handleAnalysis({
        jobId,
        jobDescription,
        jobTitle,
        jobRequirements,
        resumePath,
        resumeText,
        userId: decoded.userId
      });
    } else if (action === 'chat') {
      return await handleChat({ question, conversationHistory });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ RAG API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handleAnalysis({ jobId, jobDescription, jobTitle, jobRequirements, resumePath, resumeText, userId }) {
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
    }

    if (!finalResumeText) {
      return NextResponse.json({ 
        success: false, 
        message: 'Resume content not available' 
      }, { status: 400 });
    }

    // Initialize RAG service
    ragService = new ResumeRAGService();
    
    console.log('🚀 Starting comprehensive RAG analysis...');
    const analysisResult = await ragService.initialize(
      finalResumeText,
      jobDescription,
      jobTitle,
      jobRequirements || []
    );    console.log('✅ RAG analysis completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        metadata: {
          analyzedAt: new Date().toISOString(),
          jobId,
          userId,
          model: 'llama3-70b-8192',
          ragEnabled: true
        }
      }
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handleChat({ question, conversationHistory }) {
  try {
    if (!ragService) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please run analysis first before chatting' 
      }, { status: 400 });
    }

    console.log('💬 Processing chat question:', question);
    const response = await ragService.chat(question, conversationHistory || []);

    return NextResponse.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Chat failed', 
      error: error.message 
    }, { status: 500 });
  }
}
