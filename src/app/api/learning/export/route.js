import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const learningMaterials = await request.json();
    
    console.log('📚 Exporting learning session:', {
      skill: learningMaterials.session?.skill,
      bookmarks: learningMaterials.bookmarks?.length,
      notes: learningMaterials.notes?.length,
      clips: learningMaterials.clips?.length
    });

    // Generate a comprehensive learning report
    const report = generateLearningReport(learningMaterials);
    
    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(report, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${learningMaterials.session.skill}_learning_session.json"`
      }
    });

  } catch (error) {
    console.error('Export learning materials error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export learning materials'
    }, { status: 500 });
  }
}

function generateLearningReport(materials) {
  const { session, bookmarks, notes, clips, screenshots, chatHistory } = materials;
  
  return {
    // Session metadata
    session: {
      ...session,
      exportDate: new Date().toISOString(),
      totalBookmarks: bookmarks?.length || 0,
      totalNotes: notes?.length || 0,
      totalClips: clips?.length || 0,
      totalScreenshots: screenshots?.length || 0,
      totalChatMessages: chatHistory?.length || 0
    },
    
    // Organized learning materials
    learningMaterials: {
      bookmarks: (bookmarks || []).map(bookmark => ({
        ...bookmark,
        type: 'bookmark',
        exportNote: `Bookmarked at ${formatTime(bookmark.timestamp)} during ${session.skill} learning`
      })),
      
      notes: (notes || []).map(note => ({
        ...note,
        type: 'note',
        exportNote: `Note taken at ${formatTime(note.timestamp)} while learning ${session.skill}`
      })),
      
      clips: (clips || []).map(clip => ({
        ...clip,
        type: 'clip',
        duration: clip.endTime - clip.startTime,
        youtubeUrl: `https://www.youtube.com/watch?v=${clip.videoId}&t=${Math.floor(clip.startTime)}s`,
        exportNote: `Video clip saved from ${formatTime(clip.startTime)} to ${formatTime(clip.endTime)}`
      })),
      
      screenshots: (screenshots || []).map(screenshot => ({
        ...screenshot,
        type: 'screenshot',
        exportNote: `Screenshot captured at ${formatTime(screenshot.timestamp)}`
      }))
    },
    
    // AI conversation summary
    aiInteraction: {
      totalMessages: chatHistory?.length || 0,
      userQuestions: chatHistory?.filter(msg => msg.type === 'user').length || 0,
      aiResponses: chatHistory?.filter(msg => msg.type === 'ai').length || 0,
      conversationSummary: generateConversationSummary(chatHistory),
      keyTopicsDiscussed: extractKeyTopics(chatHistory, session.skill)
    },
    
    // Learning analytics
    analytics: {
      studyDuration: session.duration,
      engagementMetrics: {
        bookmarksPerHour: calculateRate(bookmarks?.length, session.duration),
        notesPerHour: calculateRate(notes?.length, session.duration),
        clipsPerHour: calculateRate(clips?.length, session.duration),
        questionsPerHour: calculateRate(chatHistory?.filter(msg => msg.type === 'user').length, session.duration)
      },
      learningPattern: analyzeLearningPattern(bookmarks, notes, clips)
    },
    
    // Recommended next steps
    recommendations: generateRecommendations(materials),
    
    // Full chat history for reference
    fullChatHistory: chatHistory || [],
    
    // Export metadata
    export: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      format: 'X-CEED Learning Session Export'
    }
  };
}

function generateConversationSummary(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) {
    return 'No conversation recorded in this session.';
  }
  
  const userMessages = chatHistory.filter(msg => msg.type === 'user');
  const aiMessages = chatHistory.filter(msg => msg.type === 'ai');
  
  const commonTopics = extractCommonTopics(userMessages);
  
  return `Learning conversation included ${userMessages.length} questions and ${aiMessages.length} AI responses. Main topics discussed: ${commonTopics.join(', ')}.`;
}

function extractKeyTopics(chatHistory, skill) {
  if (!chatHistory) return [];
  
  const topics = new Set();
  const keywords = ['explain', 'what is', 'how to', 'why', 'concept', 'example', 'practice'];
  
  chatHistory.forEach(message => {
    if (message.type === 'user') {
      keywords.forEach(keyword => {
        if (message.message.toLowerCase().includes(keyword)) {
          topics.add(keyword);
        }
      });
    }
  });
  
  return Array.from(topics);
}

function extractCommonTopics(userMessages) {
  const topics = [];
  const commonWords = ['explain', 'concept', 'example', 'question', 'help', 'understand'];
  
  userMessages.forEach(msg => {
    commonWords.forEach(word => {
      if (msg.message.toLowerCase().includes(word)) {
        topics.push(word);
      }
    });
  });
  
  return [...new Set(topics)];
}

function calculateRate(count, duration) {
  if (!count || !duration) return 0;
  const durationInHours = parseDuration(duration) / 3600;
  return Math.round((count / durationInHours) * 100) / 100;
}

function parseDuration(duration) {
  // Parse duration string like "15:30" to seconds
  if (typeof duration === 'string') {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }
  return 0;
}

function analyzeLearningPattern(bookmarks, notes, clips) {
  const totalActivities = (bookmarks?.length || 0) + (notes?.length || 0) + (clips?.length || 0);
  
  if (totalActivities === 0) {
    return 'Passive learning - mostly watching without interaction';
  }
  
  const bookmarkRatio = (bookmarks?.length || 0) / totalActivities;
  const noteRatio = (notes?.length || 0) / totalActivities;
  const clipRatio = (clips?.length || 0) / totalActivities;
  
  if (noteRatio > 0.5) {
    return 'Note-taking focused - actively documenting learning';
  } else if (bookmarkRatio > 0.5) {
    return 'Bookmark-heavy - marking important moments for review';
  } else if (clipRatio > 0.5) {
    return 'Clip-saving focused - preserving key explanations';
  } else {
    return 'Balanced learning - using multiple engagement methods';
  }
}

function generateRecommendations(materials) {
  const { session, bookmarks, notes, clips, chatHistory } = materials;
  const recommendations = [];
  
  // Based on engagement level
  const totalEngagement = (bookmarks?.length || 0) + (notes?.length || 0) + (clips?.length || 0);
  
  if (totalEngagement < 3) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      suggestion: 'Try to be more active while learning - bookmark important moments, take notes, and ask questions to the AI assistant.'
    });
  }
  
  // Based on note-taking
  if (!notes || notes.length === 0) {
    recommendations.push({
      type: 'note-taking',
      priority: 'medium',
      suggestion: 'Consider taking more notes to reinforce your learning. Notes help with retention and review.'
    });
  }
  
  // Based on AI interaction
  const userQuestions = chatHistory?.filter(msg => msg.type === 'user').length || 0;
  if (userQuestions < 2) {
    recommendations.push({
      type: 'ai-interaction',
      priority: 'medium',
      suggestion: 'Ask more questions to the AI assistant! It can help explain concepts, suggest practice exercises, and provide additional context.'
    });
  }
  
  // Based on clips saved
  if (clips && clips.length > 0) {
    recommendations.push({
      type: 'review',
      priority: 'high',
      suggestion: `You saved ${clips.length} video clips. Review these clips and practice the concepts shown to reinforce your learning.`
    });
  }
  
  // General next steps
  recommendations.push({
    type: 'practice',
    priority: 'high',
    suggestion: `Now that you've learned about ${session.skill}, try building a small project or completing exercises to apply what you've learned.`
  });
  
  return recommendations;
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
