const { google } = require('googleapis');
require('dotenv').config({ path: './.env.local' });

console.log('🧪 Testing Google Drive Integration...');
console.log('=====================================');

async function testGoogleDriveConnection() {
  try {
    // Check if credentials are loaded
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not found in .env.local');
    }
    
    console.log('✅ Service Account Key found');
    
    // Parse credentials
    const credentials = JSON.parse(serviceAccountKey);
    console.log('✅ Credentials parsed successfully');
    console.log('📧 Service Account Email:', credentials.client_email);
    console.log('🏗️ Project ID:', credentials.project_id);
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ],
    });
    
    console.log('✅ Auth client created');
    
    // Get authenticated client
    const authClient = await auth.getClient();
    console.log('✅ Authentication successful');
    
    // Test Drive API
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    console.log('🔍 Testing Google Drive access...');
    
    // List some files (limit to 5 for testing)
    const response = await drive.files.list({
      pageSize: 5,
      fields: 'files(id, name, mimeType)',
    });
    
    const files = response.data.files;
    console.log('✅ Google Drive API working!');
    console.log(`📁 Found ${files.length} files in your Drive:`);
    
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.mimeType})`);
    });
    
    // Test creating a folder
    console.log('\n🗂️ Testing folder creation...');
    
    const folderMetadata = {
      name: 'X-Ceed Test Folder',
      mimeType: 'application/vnd.google-apps.folder',
    };
    
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink',
    });
    
    console.log('✅ Test folder created successfully!');
    console.log('📁 Folder Name:', folder.data.name);
    console.log('🔗 Folder URL:', folder.data.webViewLink);
    console.log('🆔 Folder ID:', folder.data.id);
    
    // Clean up - delete the test folder
    console.log('\n🧹 Cleaning up test folder...');
    await drive.files.delete({
      fileId: folder.data.id,
    });
    console.log('✅ Test folder deleted');
    
    console.log('\n🎉 GOOGLE DRIVE INTEGRATION TEST PASSED!');
    console.log('==========================================');
    console.log('✅ Authentication working');
    console.log('✅ Drive API access confirmed');
    console.log('✅ Folder creation/deletion working');
    console.log('✅ Video AI Assistant Google Drive features should now work!');
    
  } catch (error) {
    console.error('\n❌ GOOGLE DRIVE INTEGRATION TEST FAILED');
    console.error('=========================================');
    console.error('Error:', error.message);
    
    if (error.message.includes('credentials')) {
      console.error('\n💡 Solution: Check your service account JSON in .env.local');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Solution: Verify your service account has the correct permissions');
    } else if (error.message.includes('API')) {
      console.error('\n💡 Solution: Make sure Google Drive API is enabled in Google Cloud Console');
    }
    
    process.exit(1);
  }
}

testGoogleDriveConnection();
