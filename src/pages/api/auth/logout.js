import { removeAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Clear the auth cookie
    removeAuthCookie({ req, res });
    
    // Return success response
    return res.status(200).json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
