import { authMiddleware } from '../../../lib/middleware';

export default async function handler(req, res) {
  console.log('🧪 SIMPLE TEST API CALLED');
  console.log('🧪 Method:', req.method);
  console.log('🧪 Content-Type:', req.headers['content-type']);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('🧪 Checking authentication...');
    const auth = await authMiddleware(req);
    
    if (!auth.isAuthenticated) {
      console.log('🧪 Auth failed:', auth.error);
      return res.status(401).json({ success: false, message: auth.error });
    }
    
    console.log('🧪 Auth success for user:', auth.user.email);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Simple test successful',
      user: auth.user.email,
      userType: auth.user.userType 
    });
    
  } catch (error) {
    console.error('🧪 Error in simple test:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}
