// Test Google Service Account Authentication
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGoogleAuth() {
  console.log('Testing Google Service Account Authentication...');
  
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not found in environment');
    }
    
    console.log('✅ Service account key found in environment');
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    console.log('✅ Service account key parsed successfully');
    console.log('📧 Service account email:', credentials.client_email);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ],
    });
    
    const authClient = await auth.getClient();
    console.log('✅ Auth client created successfully');
    
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    // Test by listing some files
    const response = await drive.files.list({
      pageSize: 5,
      fields: 'files(id, name, mimeType)'
    });
    
    console.log('✅ Successfully authenticated with Google Drive');
    console.log('📁 Files accessible:', response.data.files.length);
    
    if (response.data.files.length > 0) {
      console.log('📄 Sample files:');
      response.data.files.forEach(file => {
        console.log(`  - ${file.name} (${file.mimeType})`);
      });
    } else {
      console.log('⚠️  No files found - this might be because the service account doesn\'t have access to any shared folders');
      console.log('💡 Make sure to share a Google Drive folder with: ' + credentials.client_email);
    }
    
  } catch (error) {
    console.error('❌ Error testing Google auth:', error.message);
    if (error.code) {
      console.error('� Error code:', error.code);
    }
  }
}

testGoogleAuth();
