/**
 * API endpoint to connect frontend to Python RAG service for resume analysis and chat
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, question, sessionId, conversationHistory, analysisContext } = req.body;

    // Get Python RAG service URL from environment
    const pythonServiceUrl = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000';
    
    let endpoint = '';
    let requestBody = {};

    if (action === 'chat') {
      // Chat endpoint
      endpoint = `${pythonServiceUrl}/chat`;
      requestBody = {
        question: question,
        session_id: sessionId || 'default',
        // Include analysis context for better responses
        context: analysisContext ? {
          job_title: analysisContext.jobTitle,
          job_description: analysisContext.jobDescription,
          analysis_result: analysisContext.analysisResult
        } : null
      };
    } else if (action === 'analyze') {
      // Analysis endpoint
      endpoint = `${pythonServiceUrl}/analyze`;
      requestBody = req.body; // Pass through the analysis request
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "chat" or "analyze".' });
    }

    console.log(`🔍 Calling Python RAG service: ${endpoint}`);
    console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));

    // Call Python RAG service
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Python service error (${response.status}):`, errorText);
      
      // Return a user-friendly error message
      return res.status(response.status).json({
        error: 'AI service temporarily unavailable',
        details: response.status === 500 ? 'Internal server error' : `Service returned ${response.status}`,
        success: false
      });
    }

    const result = await response.json();
    console.log('✅ Python service response received');

    // Return the result from Python service
    return res.status(200).json({
      success: true,
      data: result,
      // For backward compatibility, also include response at root level
      response: result.response || result.answer || result.message
    });

  } catch (error) {
    console.error('❌ Resume RAG API error:', error);
    
    // Handle connection errors specifically
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      return res.status(503).json({
        error: 'AI service is not running',
        details: 'Please start the Python RAG service on port 8000',
        success: false,
        hint: 'Run: python simplified_rag_service.py'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      success: false
    });
  }
}
