import { createGoogleDriveFolder } from './src/lib/google-api.js';

async function testFolderCreation() {
  try {
    console.log('Testing folder creation with sharing...');
    const result = await createGoogleDriveFolder('Test Folder for Sharing - ' + Date.now(), null, 'kumaramartya11@gmail.com');
    console.log('Folder created successfully:', result);
    console.log('This folder should now be accessible in your Google Drive!');
    console.log('Folder URL:', result.folderUrl);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFolderCreation();
