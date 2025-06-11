import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // TEMPORARY: For testing purposes, provide sample data if no token
    if (!token) {
      console.log('⚠️ No token provided, using test data for resume matching');
      return NextResponse.json({
        success: true,
        data: {
          resumePath: null,
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express.js'],
          experience: [
            {
              title: 'Frontend Developer',
              company: 'Tech Corp',
              duration: '2 years',
              description: 'Developed web applications using React and JavaScript'
            }
          ],
          education: [
            {
              degree: 'Bachelor of Computer Science',
              institution: 'University of Technology',
              year: '2022'
            }
          ],
          personal: {
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { db } = await connectDB();
    
    // Get user's profile with resume information
    const user = await db.collection('users').findOne(
      { _id: decoded.userId },
      { 
        projection: { 
          resumePath: 1, 
          skills: 1, 
          experience: 1, 
          education: 1,
          personal: 1
        } 
      }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        resumePath: user.resumePath,
        skills: user.skills || [],
        experience: user.experience || [],
        education: user.education || [],
        personal: user.personal || {}
      }
    });

  } catch (error) {
    console.error('Error fetching user resume data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}
