import { authMiddleware } from '../../../lib/middleware';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Check authentication
    const auth = await authMiddleware(req);
    if (!auth.isAuthenticated) {
      return res.status(auth.status).json({ 
        success: false, 
        message: auth.error 
      });
    }

    // Only recruiters can use AI shortlisting
    if (auth.user.userType !== 'recruiter') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only recruiters can use AI shortlisting' 
      });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const client = await clientPromise;
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
    const db = client.db(dbName);

    // Get job details
    const job = await db.collection('jobs').findOne({
      _id: new ObjectId(jobId),
      recruiterId: auth.user.userId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or you do not have permission to access it'
      });
    }

    // Get all applications for this job
    const applications = await db.collection('applications').find({
      jobId: jobId
    }).toArray();

    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No applications found for this job',
        shortlist: []
      });
    }

    // Call Python AI service for analysis
    const aiAnalysisUrl = process.env.AI_SERVICE_URL || 'http://localhost:8003';
    
    try {
      const response = await fetch(`${aiAnalysisUrl}/analyze-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job: {
            id: job._id.toString(),
            title: job.title,
            department: job.department,
            level: job.level,
            description: job.description || '',
            jobDescriptionText: job.jobDescriptionText || '',
            requirements: job.requirements || []
          },
          candidates: applications.map(app => ({
            _id: app._id.toString(),
            applicantId: app.applicantId,
            applicantName: app.applicantName,
            applicantEmail: app.applicantEmail,
            skills: app.skills || [],
            experience: app.experience || '',
            education: app.education || '',
            coverLetter: app.coverLetter || '',
            resumeUrl: app.resumeUrl || '',
            appliedAt: app.appliedAt,
            status: app.status || 'pending'
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const aiResults = await response.json();

      // Store AI analysis results in database for future reference
      const analysisRecord = {
        jobId: jobId,
        recruiterId: auth.user.userId,
        analysisDate: new Date(),
        candidateCount: applications.length,
        aiResults: aiResults.shortlist || [],
        metadata: {
          aiModel: 'gpt-3.5-turbo',
          analysisVersion: '1.0',
          criteria: aiResults.criteria || []
        }
      };

      await db.collection('ai_analysis').insertOne(analysisRecord);

      return res.status(200).json({
        success: true,
        message: 'AI analysis completed successfully',
        shortlist: aiResults.shortlist || [],
        analysisId: analysisRecord._id,
        metadata: {
          totalCandidates: applications.length,
          analysisDate: analysisRecord.analysisDate,
          criteria: aiResults.criteria || []
        }
      });

    } catch (aiError) {
      console.error('AI Service Error:', aiError);
      
      // Fallback: Return basic candidate list without AI scoring
      const fallbackShortlist = applications.map((app, index) => ({
        candidate_id: app._id.toString(),
        candidate_name: app.applicantName || 'Unknown',
        overall_score: Math.max(50, 100 - (index * 5)), // Simple fallback scoring
        skill_match_score: 60,
        experience_score: 55,
        education_score: 50,
        criteria_analysis: {
          technical_skills: {
            score: 60,
            found_skills: app.skills || [],
            missing_skills: [],
            reasoning: "AI analysis unavailable - showing basic candidate info"
          },
          experience: {
            score: 55,
            years_found: 0,
            relevant_experience: [app.experience || ''],
            reasoning: "AI analysis unavailable - showing basic candidate info"
          },
          education: {
            score: 50,
            qualifications: [app.education || ''],
            reasoning: "AI analysis unavailable - showing basic candidate info"
          },
          soft_skills: {
            score: 50,
            identified_skills: [],
            reasoning: "AI analysis unavailable - showing basic candidate info"
          }
        },
        strengths: ["Application submitted", "Basic information provided"],
        weaknesses: ["AI analysis unavailable"],
        recommendation: "Manual review recommended - AI service unavailable"
      }));

      return res.status(200).json({
        success: true,
        message: 'Basic candidate list returned (AI analysis unavailable)',
        shortlist: fallbackShortlist,
        metadata: {
          totalCandidates: applications.length,
          analysisDate: new Date(),
          criteria: ["Basic candidate ranking"],
          aiStatus: 'unavailable'
        }
      });
    }

  } catch (error) {
    console.error('Error in AI shortlisting:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
