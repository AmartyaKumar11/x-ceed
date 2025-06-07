import { IncomingForm } from 'formidable';
import { authMiddleware } from '../../../lib/middleware';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('🔍 MULTIPART TEST API CALLED');
  console.log('🔍 Method:', req.method);
  console.log('🔍 Content-Type:', req.headers['content-type']);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing authentication...');
    const auth = await authMiddleware(req);
    
    if (!auth.isAuthenticated) {
      console.log('🔍 Auth failed:', auth.error);
      return res.status(401).json({ success: false, message: auth.error });
    }
    
    console.log('🔍 Auth success for user:', auth.user.email);
    
    // Test formidable parsing
    console.log('🔍 Starting formidable parsing...');
    
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
      multiples: false
    });

    console.log('🔍 Created formidable form');

    const [fields, files] = await new Promise((resolve, reject) => {
      console.log('🔍 Starting form.parse...');
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('🔍 Form parsing error:', err);
          reject(err);
        } else {
          console.log('🔍 Form parsing successful');
          console.log('🔍 Fields keys:', Object.keys(fields));
          console.log('🔍 Files keys:', Object.keys(files));
          resolve([fields, files]);
        }
      });
    });

    console.log('🔍 Form parsed successfully');
    console.log('🔍 Fields:', fields);
    console.log('🔍 Files:', Object.keys(files));
    
    return res.status(200).json({ 
      success: true, 
      message: 'Multipart parsing successful',
      fieldsCount: Object.keys(fields).length,
      filesCount: Object.keys(files).length
    });
    
  } catch (error) {
    console.error('🔍 Error in multipart test:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Multipart test failed: ${error.message}` 
    });
  }
}
