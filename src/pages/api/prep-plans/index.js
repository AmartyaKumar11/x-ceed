import clientPromise, { getDatabase } from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Check authentication first
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ message: auth.error });
  }

  // Only applicants can manage prep plans
  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ message: 'Only applicants can manage prep plans' });
  }

  // Connect to the database
  const db = await getDatabase();

  switch (req.method) {
    case 'GET':
      try {
        // Get prep plans for the applicant
        const prepPlans = await db.collection('prepPlans')
          .find({ applicantId: auth.user.userId })
          .sort({ createdAt: -1 })
          .toArray();

        // Get job details for prep plans
        const jobIds = prepPlans
          .filter(plan => plan.jobId && ObjectId.isValid(plan.jobId))
          .map(plan => new ObjectId(plan.jobId));

        const jobs = jobIds.length > 0 ? await db.collection('jobs')
          .find({ _id: { $in: jobIds } })
          .toArray() : [];

        // Combine prep plan data with job details
        const prepPlansWithDetails = prepPlans.map(plan => {
          const job = jobs.find(j => j._id.toString() === plan.jobId);
          return {
            ...plan,
            jobDetails: job || null
          };
        });

        return res.status(200).json({
          success: true,
          data: prepPlansWithDetails
        });
      } catch (error) {
        console.error('Error fetching prep plans:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    case 'POST':
      try {        const { 
          jobId, 
          jobTitle, 
          companyName, 
          jobDescription, 
          requirements,
          location,
          salaryRange,
          jobType,
          department,
          level,
          workMode,
          duration = 4, // Add duration with default value
          source // 'resume-match' or 'saved-jobs'
        } = req.body;

        if (!jobTitle) {
          return res.status(400).json({ message: 'Job title is required' });
        }

        // Use a fallback for company name if not provided
        const finalCompanyName = companyName || 'Company Not Specified';        // Check if prep plan already exists for this job
        const existingPlan = await db.collection('prepPlans').findOne({
          applicantId: auth.user.userId,
          $or: [
            { jobId: jobId },
            { 
              jobTitle: jobTitle,
              companyName: finalCompanyName
            }
          ]
        });

        if (existingPlan) {
          return res.status(409).json({ 
            message: 'Prep plan already exists for this job',
            prepPlanId: existingPlan._id
          });
        }        // Create the prep plan record
        const prepPlan = {
          applicantId: auth.user.userId,
          jobId: jobId || null,
          jobTitle: jobTitle,
          companyName: finalCompanyName,
          jobDescription: jobDescription || '',
          requirements: requirements || [],
          location: location || '',
          salaryRange: salaryRange || '',
          jobType: jobType || '',
          department: department || '',
          level: level || '',
          workMode: workMode || '',
          duration: duration, // Add duration to the prep plan
          source: source || 'unknown',
          status: 'active',
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('prepPlans').insertOne(prepPlan);

        return res.status(201).json({
          success: true,
          message: 'Prep plan created successfully',
          data: {
            ...prepPlan,
            _id: result.insertedId
          }
        });
      } catch (error) {
        console.error('Error creating prep plan:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Valid prep plan ID is required' });
        }

        // Delete the prep plan
        const result = await db.collection('prepPlans').deleteOne({
          _id: new ObjectId(id),
          applicantId: auth.user.userId // Ensure user can only delete their own plans
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Prep plan not found' });
        }

        return res.status(200).json({
          success: true,
          message: 'Prep plan deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting prep plan:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    case 'PUT':
      try {
        const { id } = req.query;
        const { progress, status, notes } = req.body;

        if (!id || !ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Valid prep plan ID is required' });
        }

        const updateData = {
          updatedAt: new Date()
        };

        if (typeof progress === 'number') updateData.progress = Math.max(0, Math.min(100, progress));
        if (status) updateData.status = status;
        if (notes) updateData.notes = notes;

        const result = await db.collection('prepPlans').updateOne(
          {
            _id: new ObjectId(id),
            applicantId: auth.user.userId
          },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Prep plan not found' });
        }

        return res.status(200).json({
          success: true,
          message: 'Prep plan updated successfully'
        });
      } catch (error) {
        console.error('Error updating prep plan:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
      return res.status(405).json({ message: 'Method not allowed' });
  }
}
