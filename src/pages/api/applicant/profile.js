import clientPromise, { getDatabase } from '../../../lib/mongodb';
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
    return res.status(403).json({ success: false, message: 'Only applicants can access this endpoint' });  }

  // Connect to the database
  const db = await getDatabase();
  
  switch (req.method) {case 'GET':
      try {        
        // Use the user data from auth middleware instead of querying again
        let user;
        if (auth.user.details) {
          // User data is already available from middleware
          user = auth.user.details;
        } else {
          // Fallback to database query if not available
          user = await db.collection('users').findOne(
            { _id: new ObjectId(auth.user.userId) },
            { 
              projection: { 
                password: 0 // Exclude password from response
              } 
            }
          );
        }

        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }        // Format response data for the frontend
        const profileData = {
          firstName: user.personal?.name?.split(' ')[0] || '',
          lastName: user.personal?.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.contact?.phone || '',
          address: user.personal?.address || '',
          city: user.personal?.city || '',
          state: user.personal?.state || '',
          zipCode: user.personal?.zipCode || '',
          dateOfBirth: user.personal?.dob || '',
          gender: user.personal?.gender || '',
          
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
      }    case 'PUT':
      try {
        console.log('🔄 PUT Profile - Request received');
        console.log('🔄 PUT Profile - User ID from auth:', auth.user.userId);
        console.log('🔄 PUT Profile - Request body:', JSON.stringify(req.body, null, 2));
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
          gender,
          education,
          workExperience,
          skills,
          certifications
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
          console.log('❌ PUT Profile - Validation failed: Missing required fields');
          return res.status(400).json({ 
            success: false, 
            message: 'First name, last name, and email are required' 
          });
        }

        // Ensure skills is an array
        const skillsArray = Array.isArray(skills) ? skills : [];        // Prepare update data
        const updateData = {
          email,
          personal: {
            name: `${firstName} ${lastName}`.trim(),
            address,
            city,
            state,
            zipCode,
            dob: dateOfBirth ? new Date(dateOfBirth) : null,
            gender
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
          console.log('🔄 PUT Profile - Processing update for userId:', auth.user.userId);
        console.log('🔄 PUT Profile - Update data:', JSON.stringify(updateData, null, 2));
        
        try {          // Validate ObjectId format
          const userObjectId = new ObjectId(auth.user.userId);
          
          // Update the user profile
          const result = await db.collection('users').updateOne(
            { _id: userObjectId },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
          }

          if (result.modifiedCount === 0) {
            return res.status(200).json({ 
              success: true, 
              message: 'No changes were made to the profile' 
            });
          }

          return res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully' 
          });
          
        } catch (objectIdError) {
          console.error('❌ PUT Profile - Invalid ObjectId:', objectIdError);
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid user ID format'
          });
        }
      } catch (error) {
        console.error('❌ Error updating profile:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }
}