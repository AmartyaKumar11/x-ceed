import { google } from 'googleapis';

// Google API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

/**
 * Create Google Auth client using service account or OAuth
 */
async function getGoogleAuth() {
  try {
    // For server-side authentication, we'll use service account
    // You'll need to set up a service account and add the credentials
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
      return auth;
    }
    
    // Fallback to OAuth (requires user interaction)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }
    
    return oauth2Client;
  } catch (error) {
    console.error('Error setting up Google Auth:', error);
    throw new Error('Failed to authenticate with Google APIs');
  }
}

/**
 * Create a new Google Doc
 */
export async function createGoogleDoc(title) {
  try {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    
    // Create the document
    const response = await docs.documents.create({
      resource: {
        title: title
      }
    });
    
    const documentId = response.data.documentId;
    
    return {
      documentId,
      documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
      title: response.data.title || title
    };
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw new Error('Failed to create Google Doc');
  }
}

/**
 * Write content to Google Doc
 */
export async function writeToGoogleDoc(documentId, content, insertAtEnd = true) {
  try {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    
    // Get document to find insertion point
    const doc = await docs.documents.get({ documentId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;
    
    // Prepare batch update requests
    const requests = [];
    
    if (insertAtEnd) {
      // Insert content at the end
      requests.push({
        insertText: {
          location: { index: endIndex },
          text: content
        }
      });
    } else {
      // Insert at beginning (after title)
      requests.push({
        insertText: {
          location: { index: 1 },
          text: content + '\n\n'
        }
      });
    }
    
    // Apply the updates
    const response = await docs.documents.batchUpdate({
      documentId,
      resource: { requests }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error writing to Google Doc:', error);
    throw new Error('Failed to write to Google Doc');
  }
}

/**
 * Add formatted notes to Google Doc with proper styling
 */
export async function addFormattedNotesToDoc(documentId, notes, videoTitle, videoId, videoChannel) {
  try {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    
    // Get document to find insertion point
    const doc = await docs.documents.get({ documentId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex - 1;
    
    // Prepare the formatted content
    const timestamp = new Date().toLocaleString();
    const separator = '\n' + '='.repeat(50) + '\n';
    
    const formattedContent = `${separator}📹 VIDEO NOTES - ${timestamp}${separator}
🎬 Title: ${videoTitle}
📺 Channel: ${videoChannel}
🆔 Video ID: ${videoId}
📅 Generated: ${timestamp}

${notes}

`;
    
    // Create batch update requests
    const requests = [];
    
    // Insert the formatted content
    requests.push({
      insertText: {
        location: { index: endIndex },
        text: formattedContent
      }
    });
    
    // Apply formatting to the title
    const titleStartIndex = endIndex + separator.length;
    const titleEndIndex = titleStartIndex + `📹 VIDEO NOTES - ${timestamp}`.length;
    
    requests.push({
      updateTextStyle: {
        range: {
          startIndex: titleStartIndex,
          endIndex: titleEndIndex
        },
        textStyle: {
          bold: true,
          fontSize: { magnitude: 16, unit: 'PT' }
        },
        fields: 'bold,fontSize'
      }
    });
    
    // Apply the updates
    const response = await docs.documents.batchUpdate({
      documentId,
      resource: { requests }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error adding formatted notes to Google Doc:', error);
    throw new Error('Failed to add formatted notes to Google Doc');
  }
}

/**
 * Create a folder in Google Drive
 */
export async function createGoogleDriveFolder(folderName, parentFolderId = null) {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }
    
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });
    
    return {
      folderId: response.data.id,
      folderName: response.data.name,
      folderUrl: response.data.webViewLink
    };
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw new Error('Failed to create Google Drive folder');
  }
}

/**
 * Upload a file to Google Drive
 */
export async function uploadToGoogleDrive(fileName, content, mimeType, folderId = null) {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: fileName,
    };
    
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    const media = {
      mimeType: mimeType,
      body: content,
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });
    
    return {
      fileId: response.data.id,
      fileName: response.data.name,
      fileUrl: response.data.webViewLink
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload to Google Drive');
  }
}

/**
 * Search for existing docs or folders
 */
export async function searchGoogleDrive(query, mimeType = null) {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    let searchQuery = `name contains '${query}'`;
    if (mimeType) {
      searchQuery += ` and mimeType='${mimeType}'`;
    }
    
    const response = await drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'createdTime desc'
    });
    
    return response.data.files;
  } catch (error) {
    console.error('Error searching Google Drive:', error);
    throw new Error('Failed to search Google Drive');
  }
}

/**
 * Get or create a Google Doc for video notes
 */
export async function getOrCreateVideoNotesDoc(videoTitle, videoChannel, userEmail = null) {
  try {
    const docTitle = `${videoTitle} - Video Notes`;
    
    // First, search for existing document
    const existingDocs = await searchGoogleDrive(
      docTitle, 
      'application/vnd.google-apps.document'
    );
    
    if (existingDocs.length > 0) {
      return {
        documentId: existingDocs[0].id,
        documentUrl: existingDocs[0].webViewLink,
        title: existingDocs[0].name,
        isNew: false
      };
    }
    
    // Create new document if none exists
    const newDoc = await createGoogleDoc(docTitle);
    
    // Share with user if email provided
    if (userEmail) {
      try {
        await shareGoogleDoc(newDoc.documentId, userEmail, 'writer');
        console.log(`Document shared with ${userEmail}`);
      } catch (shareError) {
        console.warn('Could not share document:', shareError.message);
      }
    }
    
    // Add initial content to the document
    const initialContent = `# 📝 Video Notes: ${videoTitle}\n\n**Channel:** ${videoChannel}\n**Created:** ${new Date().toLocaleString()}\n\n---\n\nAI-generated notes will appear below:\n\n`;
    
    await writeToGoogleDoc(newDoc.documentId, initialContent, false);
    
    return {
      ...newDoc,
      isNew: true
    };
  } catch (error) {
    console.error('Error getting/creating video notes doc:', error);
    throw new Error('Failed to manage video notes document');
  }
}

/**
 * Share a Google Doc with a user
 */
export async function shareGoogleDoc(documentId, emailAddress, role = 'writer') {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const permission = {
      type: 'user',
      role: role, // 'reader', 'writer', or 'owner'
      emailAddress: emailAddress
    };
    
    const response = await drive.permissions.create({
      fileId: documentId,
      resource: permission,
      sendNotificationEmail: false // Don't send email notification
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sharing Google Doc:', error);
    throw new Error('Failed to share Google Doc');
  }
}
