import { connectToDatabase } from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      // Verify authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      // Verify user is a recruiter
      if (decoded.role !== 'recruiter') {
        return res.status(403).json({ success: false, message: 'Only recruiters can create jobs' });
      }

      const {
        title,
        department,
        level,
        description,
        workMode,
        location,
        jobType,
        duration,
        salaryMin,
        salaryMax,
        currency,
        benefits,
        numberOfOpenings,
        applicationStart,
        applicationEnd,
        priority,
        status = 'active'
      } = req.body;

      // Validate required fields
      if (!title || !department || !level || !workMode || !jobType || !duration || 
          !salaryMin || !salaryMax || !numberOfOpenings || !applicationStart || !applicationEnd) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      // Validate salary range
      if (parseInt(salaryMin) >= parseInt(salaryMax)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Maximum salary must be greater than minimum salary' 
        });
      }

      // Validate dates
      const startDate = new Date(applicationStart);
      const endDate = new Date(applicationEnd);
      if (startDate >= endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Application end date must be after start date' 
        });
      }

      const { db } = await connectToDatabase();

      const job = {
        recruiterId: decoded.userId,
        title,
        department,
        level,
        description: description || '',
        workMode,
        location: location || '',
        jobType,
        duration,
        salaryMin: parseInt(salaryMin),
        salaryMax: parseInt(salaryMax),
        currency: currency || 'USD',
        benefits: benefits || '',
        numberOfOpenings: parseInt(numberOfOpenings),
        applicationStart: startDate,
        applicationEnd: endDate,
        priority: priority || 'medium',
        status,
        applicationsCount: 0,
        viewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('jobs').insertOne(job);

      return res.status(201).json({
        success: true,
        data: { ...job, _id: result.insertedId },
        message: 'Job created successfully'
      });

    } else if (req.method === 'GET') {
      // Get jobs for recruiter
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      const { db } = await connectToDatabase();

      const jobs = await db.collection('jobs')
        .find({ 
          recruiterId: decoded.userId,
          status: { $ne: 'deleted' }
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        data: jobs
      });

    } else if (req.method === 'PUT') {
      // Update job
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      if (decoded.role !== 'recruiter') {
        return res.status(403).json({ success: false, message: 'Only recruiters can update jobs' });
      }

      const { jobId, ...updateData } = req.body;

      if (!jobId) {
        return res.status(400).json({ success: false, message: 'Job ID is required' });
      }

      const { db } = await connectToDatabase();

      const result = await db.collection('jobs').updateOne(
        { 
          _id: new ObjectId(jobId), 
          recruiterId: decoded.userId 
        },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date() 
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Job updated successfully'
      });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Jobs API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
