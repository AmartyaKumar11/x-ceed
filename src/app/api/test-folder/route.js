import { NextResponse } from 'next/server';
import { createGoogleDriveFolder } from '@/lib/google-api';

export async function GET() {
  try {
    console.log('Testing folder creation with sharing...');
    
    const testFolderName = `Test Folder - ${new Date().toISOString()}`;
    const userEmail = 'kumaramartya11@gmail.com';
    
    const result = await createGoogleDriveFolder(testFolderName, null, userEmail);
    
    return NextResponse.json({
      success: true,
      message: 'Folder created and shared successfully!',
      folder: result,
      instructions: 'Check your Google Drive - this folder should be accessible without asking for permission.'
    });
  } catch (error) {
    console.error('Test folder creation failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
