import clientPromise from '../../../lib/mongodb';
import { authMiddleware } from '../../../lib/middleware';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Check authentication first
  const auth = await authMiddleware(req);
  if (!auth.isAuthenticated) {
    return res.status(auth.status).json({ success: false, message: auth.error });
  }

  // Only allow applicants to access this endpoint
  if (auth.user.userType !== 'applicant') {
    return res.status(403).json({ success: false, message: 'Only applicants can access this endpoint' });
  }

  // Connect to the database
  const client = await clientPromise;
  const db = client.db();

  switch (req.method) {
    case 'GET':
      try {
        // Get the applicant's profile data
        const user = await db.collection('users').findOne(
          { _id: new ObjectId(auth.user.userId) },
          { 
            projection: { 
              password: 0 // Exclude password from response
            } 
          }
        );

        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Structure the response data to match frontend expectations
        const profileData = {
          // Personal Information
          firstName: user.personal?.name?.split(' ')[0] || '',
          lastName: user.personal?.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.contact?.phone || '',
          address: user.personal?.address || '',
          city: user.personal?.city || '',
          state: user.personal?.state || '',
          zipCode: user.personal?.zipCode || '',
          dateOfBirth: user.personal?.dob || '',
          
          // Education - convert from old format if needed
          education: user.education || [],
          
          // Work Experience - ensure proper format
          workExperience: user.workExperience || [],
          
          // Skills - ensure it's an array
          skills: Array.isArray(user.skills) ? user.skills : (user.skills ? [user.skills] : []),
          
          // Certifications
          certifications: user.certifications || []
        };

        return res.status(200).json({ 
          success: true, 
          data: profileData 
        });

      } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

    case 'PUT':
      try {
        const {
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          dateOfBirth,
          education,
          workExperience,
          skills,
          certifications
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
          return res.status(400).json({ 
            success: false, 
            message: 'First name, last name, and email are required' 
          });
        }

        // Ensure skills is an array
        const skillsArray = Array.isArray(skills) ? skills : [];

        // Prepare update data
        const updateData = {
          email,
          personal: {
            name: `${firstName} ${lastName}`.trim(),
            address,
            city,
            state,
            zipCode,
            dob: dateOfBirth ? new Date(dateOfBirth) : null
          },
          contact: {
            phone,
            email
          },
          education: education || [],
          workExperience: workExperience || [],
          skills: skillsArray,
          certifications: certifications || [],
          updatedAt: new Date()
        };

        // Update the user profile
        const result = await db.collection('users').updateOne(
          { _id: new ObjectId(auth.user.userId) },
          { $set: updateData }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({ success: false, message: 'User not found or no changes made' });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Profile updated successfully' 
        });

      } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }
}