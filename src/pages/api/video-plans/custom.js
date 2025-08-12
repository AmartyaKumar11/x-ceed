import { connectToDatabase } from '../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method } = req;

  console.log(`🚀 Video Plans API called with method: ${method}`);
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { db } = await connectToDatabase();
    console.log('✅ Successfully connected to database');

    switch (method) {
      case 'POST':
        // Save custom video plan
        const { userId, jobId, videos, totalDuration, jobTitle, companyName } = req.body;

        console.log('📊 POST request data:', { 
          userId, 
          jobId, 
          videosCount: videos?.length, 
          totalDuration, 
          jobTitle, 
          companyName 
        });

        if (!userId || !jobId || !videos || !Array.isArray(videos)) {
          console.log('❌ Missing required fields');
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: userId, jobId, videos' 
          });
        }

        const videoPlan = {
          userId,
          jobId,
          videos,
          totalDuration,
          jobTitle,
          companyName,
          createdAt: new Date(),
          updatedAt: new Date(),
          watchedVideos: [], // Track which videos have been watched
          isActive: true
        };

        // Check if a plan already exists for this user and job
        const existingPlan = await db.collection('customVideoPlans').findOne({
          userId,
          jobId,
          isActive: true
        });

        let result;
        if (existingPlan) {
          // Update existing plan
          result = await db.collection('customVideoPlans').updateOne(
            { _id: existingPlan._id },
            { 
              $set: {
                videos,
                totalDuration,
                updatedAt: new Date()
              }
            }
          );
          
          return res.status(200).json({
            success: true,
            message: 'Video plan updated successfully',
            planId: existingPlan._id
          });
        } else {
          // Create new plan
          result = await db.collection('customVideoPlans').insertOne(videoPlan);
          
          return res.status(201).json({
            success: true,
            message: 'Video plan saved successfully',
            planId: result.insertedId
          });
        }

      case 'GET':
        // Retrieve custom video plan
        const { userId: getUserId, jobId: getJobId } = req.query;

        if (!getUserId || !getJobId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required query parameters: userId, jobId' 
          });
        }

        const foundVideoPlan = await db.collection('customVideoPlans').findOne({
          userId: getUserId,
          jobId: getJobId,
          isActive: true
        });

        if (!foundVideoPlan) {
          return res.status(404).json({
            success: false,
            message: 'No video plan found for this user and job'
          });
        }

        return res.status(200).json({
          success: true,
          videoPlan: foundVideoPlan
        });

      case 'PUT':
        // Update watched videos
        const { planId, watchedVideos } = req.body;

        if (!planId || !Array.isArray(watchedVideos)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: planId, watchedVideos' 
          });
        }

        await db.collection('customVideoPlans').updateOne(
          { _id: new ObjectId(planId) },
          { 
            $set: {
              watchedVideos,
              updatedAt: new Date()
            }
          }
        );

        return res.status(200).json({
          success: true,
          message: 'Watch progress updated successfully'
        });

      case 'DELETE':
        // Delete video plan
        const { planId: deletePlanId } = req.query;

        if (!deletePlanId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required query parameter: planId' 
          });
        }

        await db.collection('customVideoPlans').updateOne(
          { _id: new ObjectId(deletePlanId) },
          { 
            $set: {
              isActive: false,
              updatedAt: new Date()
            }
          }
        );

        return res.status(200).json({
          success: true,
          message: 'Video plan deleted successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          success: false, 
          error: `Method ${method} Not Allowed` 
        });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
