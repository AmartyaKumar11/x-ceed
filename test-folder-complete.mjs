import { createGoogleDriveFolder, shareGoogleDriveFolder } from './src/lib/google-api.js';

async function testCompleteFlow() {
  try {
    console.log('=== TESTING GOOGLE DRIVE FOLDER CREATION AND SHARING ===');
    
    // Step 1: Create folder without sharing
    console.log('\n1. Creating folder without sharing...');
    const folderName = `Test Folder ${Date.now()}`;
    const folderResult = await createGoogleDriveFolder(folderName);
    console.log('Folder created:', folderResult);
    
    // Step 2: Share the folder
    console.log('\n2. Sharing folder with user...');
    const shareResult = await shareGoogleDriveFolder(
      folderResult.folderId, 
      'kumaramartya11@gmail.com', 
      'writer'
    );
    console.log('Folder shared:', shareResult);
    
    console.log('\n=== TEST COMPLETED ===');
    console.log('Folder URL:', folderResult.folderUrl);
    console.log('Please check your Google Drive and try to access this folder.');
    
  } catch (error) {
    console.error('Error in test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompleteFlow();
