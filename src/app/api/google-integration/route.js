import { NextResponse } from 'next/server';
import { 
  createGoogleDoc, 
  writeToGoogleDoc,
  addFormattedNotesToDoc,
  shareGoogleDoc,
  createGoogleDriveFolder, 
  uploadToGoogleDrive,
  uploadBinaryToGoogleDrive,
  getOrCreateVideoNotesDoc,
  getOrCreateProjectFolder,
  searchGoogleDrive,
  createGoogleDocInFolder,
  listDocsInFolder
} from '@/lib/google-api';

export async function POST(request) {
  try {
    const { action, data } = await request.json();    switch (action) {
      case 'create_doc_for_video':
        return await createDocForVideo(data);
      
      case 'add_notes_to_doc':
        return await addNotesToDoc(data);
      
      case 'share_document':
        return await shareDocument(data);
      
      case 'create_project_folder':
        return await createProjectFolder(data);
      
      case 'create_doc_in_folder':
        return await createDocInFolder(data);
        case 'list_docs_in_folder':
        return await listProjectDocs(data);
      
      case 'upload_screenshot':
        return await uploadScreenshot(data);
      
      case 'save_notes_to_drive':
        return await saveNotesToDrive(data);
      
      case 'search_existing':
        return await searchExisting(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Google API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process Google API request'
    }, { status: 500 });
  }
}

async function createDocForVideo({ videoTitle, videoChannel, videoId, userEmail, docTitle, notes }) {
  try {
    const title = docTitle || `${videoTitle} - Notes ${new Date().toLocaleDateString()}`;
    const doc = await getOrCreateVideoNotesDoc(title, videoChannel, userEmail);
    
    // Add notes to the document if provided
    if (notes) {
      await addFormattedNotesToDoc(doc.documentId, notes, videoTitle, videoId, videoChannel);
    }
    
    return NextResponse.json({
      success: true,
      doc: doc,
      message: doc.isNew ? 'New Google Doc created and notes added!' : 'Notes added to existing Google Doc'
    });
  } catch (error) {
    throw new Error(`Failed to create/get doc: ${error.message}`);
  }
}

async function addNotesToDoc({ documentId, notes, videoTitle, videoId, videoChannel }) {
  try {
    await addFormattedNotesToDoc(documentId, notes, videoTitle, videoId, videoChannel);
    
    return NextResponse.json({
      success: true,
      message: 'Notes added to Google Doc successfully!'
    });
  } catch (error) {
    throw new Error(`Failed to add notes to doc: ${error.message}`);
  }
}

async function createProjectFolder({ projectName, videoTitle, userEmail }) {
  try {
    const folderName = projectName || `${videoTitle} - Video Project`;
    const folder = await getOrCreateProjectFolder(folderName, userEmail);
    
    return NextResponse.json({
      success: true,
      folder: folder,
      message: folder.isNew ? 'New project folder created and shared with you!' : 'Using existing project folder'
    });
  } catch (error) {
    throw new Error(`Failed to create folder: ${error.message}`);
  }
}

async function saveNotesToDrive({ folderId, notes, videoTitle, videoId, format = 'txt' }) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${videoTitle} - Notes - ${timestamp}.${format}`;
    
    let content, mimeType;
    
    if (format === 'txt') {
      content = `Video Notes: ${videoTitle}\nVideo ID: ${videoId}\nGenerated: ${new Date().toLocaleString()}\n\n${notes}`;
      mimeType = 'text/plain';
    } else if (format === 'md') {
      content = `# Video Notes: ${videoTitle}\n\n**Video ID:** ${videoId}  \n**Generated:** ${new Date().toLocaleString()}\n\n---\n\n${notes}`;
      mimeType = 'text/markdown';
    }
    
    const file = await uploadToGoogleDrive(fileName, content, mimeType, folderId);
    
    return NextResponse.json({
      success: true,
      file: file,
      message: 'Notes saved to Google Drive successfully!'
    });
  } catch (error) {
    throw new Error(`Failed to save to Drive: ${error.message}`);
  }
}

async function searchExisting({ query, type }) {
  try {
    let mimeType = null;
    
    if (type === 'doc') {
      mimeType = 'application/vnd.google-apps.document';
    } else if (type === 'folder') {
      mimeType = 'application/vnd.google-apps.folder';
    }
    
    const results = await searchGoogleDrive(query, mimeType);
    
    return NextResponse.json({
      success: true,
      results: results
    });
  } catch (error) {
    throw new Error(`Failed to search: ${error.message}`);
  }
}

async function shareDocument({ documentId, userEmail }) {
  try {
    await shareGoogleDoc(documentId, userEmail, 'writer');
    
    return NextResponse.json({
      success: true,
      message: `Document shared with ${userEmail}!`
    });
  } catch (error) {
    throw new Error(`Failed to share document: ${error.message}`);
  }
}

async function createDocInFolder({ videoTitle, videoChannel, videoId, folderId, docTitle, userEmail, notes }) {
  try {
    const title = docTitle || `${videoTitle} - Notes ${new Date().toLocaleDateString()}`;
    const doc = await createGoogleDocInFolder(title, folderId, userEmail);
    
    // Add notes to the document if provided
    if (notes) {
      await addFormattedNotesToDoc(doc.documentId, notes, videoTitle, videoId, videoChannel);
    }
    
    return NextResponse.json({
      success: true,
      doc: doc,
      message: 'Google Doc created in project folder and notes added!'
    });
  } catch (error) {
    throw new Error(`Failed to create doc in folder: ${error.message}`);
  }
}

async function listProjectDocs({ folderId }) {
  try {
    const docs = await listDocsInFolder(folderId);
    
    return NextResponse.json({
      success: true,
      docs: docs
    });
  } catch (error) {
    throw new Error(`Failed to list docs in folder: ${error.message}`);
  }
}

async function uploadScreenshot({ imageData, fileName, folderId, videoTitle, videoId, videoChannel }) {
  try {
    console.log('Upload screenshot request:', {
      fileName,
      folderId,
      videoTitle,
      imageDataLength: imageData?.length,
      hasImageData: !!imageData
    });

    if (!imageData) {
      throw new Error('No image data provided');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    console.log('Created buffer with size:', buffer.length);
    
    // Upload the screenshot to Google Drive
    const file = await uploadBinaryToGoogleDrive({
      buffer: buffer,
      filename: fileName,
      mimeType: 'image/jpeg',
      folderId: folderId,
      description: `Screenshot from video: ${videoTitle} (${videoChannel})`
    });
    
    console.log('File uploaded successfully:', file.id);
    
    // Make the file accessible with the link
    await shareGoogleDoc(file.id, 'anyone');
    
    return NextResponse.json({
      success: true,
      file: file,
      message: 'Screenshot uploaded to Google Drive!'
    });
  } catch (error) {
    console.error('Upload screenshot error:', error);
    throw new Error(`Failed to upload screenshot: ${error.message}`);
  }
}
