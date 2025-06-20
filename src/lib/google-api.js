import { google } from 'googleapis';

// Google API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive', // Full Drive access needed for sharing
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
    const drive = google.drive({ version: 'v3', auth });
    
    // Create the document
    const response = await docs.documents.create({
      resource: {
        title: title
      }
    });
    
    const documentId = response.data.documentId;
    
    // Make document publicly accessible with link
    try {
      await drive.permissions.create({
        fileId: documentId,
        resource: {
          role: 'writer',
          type: 'anyone'
        },
        fields: 'id'
      });
      console.log(`Document made publicly accessible with link`);
    } catch (publicError) {
      console.warn('Failed to make document publicly accessible:', publicError.message);
    }
    
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
export async function createGoogleDriveFolder(folderName, parentFolderId = null, userEmail = null) {
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

    // Make folder publicly accessible with link
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'writer',
          type: 'anyone'
        },
        fields: 'id'
      });
      console.log(`Folder made publicly accessible with link`);
    } catch (publicError) {
      console.warn('Failed to make folder publicly accessible:', publicError.message);
      
      // Fallback: try to share with user if email provided
      if (userEmail) {
        try {
          await shareGoogleDriveFolder(response.data.id, userEmail, 'writer');
          console.log(`Folder shared with ${userEmail}`);
        } catch (shareError) {
          console.warn('Primary sharing failed, trying alternative approach:', shareError.message);
          try {
            await shareGoogleDriveFolderAlternative(response.data.id, userEmail, 'writer');
            console.log(`Folder shared using alternative approach with ${userEmail}`);
          } catch (altError) {
            console.warn('Alternative sharing also failed:', altError.message);
          }
        }
      }
    }
    
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
 * Upload binary data (like images) to Google Drive
 */
export async function uploadBinaryToGoogleDrive({ buffer, filename, mimeType, folderId = null, description = null }) {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    // Ensure buffer is properly formatted
    let finalBuffer;
    if (typeof buffer === 'string') {
      // If it's a base64 string, convert to Buffer
      finalBuffer = Buffer.from(buffer, 'base64');
    } else if (Buffer.isBuffer(buffer)) {
      finalBuffer = buffer;
    } else {
      throw new Error('Invalid buffer format provided');
    }

    // Create file metadata
    const fileMetadata = {
      name: filename,
    };
    
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    if (description) {
      fileMetadata.description = description;
    }

    // Try a different approach using the older API style that works better with buffers
    const response = await drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: mimeType,
        body: finalBuffer,
      },
      fields: 'id, name, webViewLink, webContentLink',
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink
    };
  } catch (error) {
    console.error('Error uploading binary to Google Drive:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      bufferType: typeof buffer,
      bufferLength: Buffer.isBuffer(buffer) ? buffer.length : (typeof buffer === 'string' ? buffer.length : 'unknown'),
      filename,
      mimeType,
      folderId
    });    // Fallback: Try a different approach using form data if the first method fails
    if (error.message.includes('pipe')) {
      console.log('Trying fallback approach with base64 conversion...');
      try {
        // Re-initialize auth and drive for fallback approach
        const fallbackAuth = await getGoogleAuth();
        const fallbackDrive = google.drive({ version: 'v3', auth: fallbackAuth });
        
        // Recreate file metadata for fallback approach
        const fallbackFileMetadata = {
          name: filename,
        };
        
        if (folderId) {
          fallbackFileMetadata.parents = [folderId];
        }
        
        if (description) {
          fallbackFileMetadata.description = description;
        }
        
        // Re-process the buffer for fallback approach
        let fallbackBuffer;
        if (typeof buffer === 'string') {
          // If it's a base64 string, convert to Buffer
          fallbackBuffer = Buffer.from(buffer, 'base64');
        } else if (Buffer.isBuffer(buffer)) {
          fallbackBuffer = buffer;
        } else {
          throw new Error('Invalid buffer format provided');
        }
        
        // Convert buffer to base64 data URL and use that
        const base64Data = fallbackBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        
        const fallbackResponse = await fallbackDrive.files.create({
          resource: fallbackFileMetadata,
          media: {
            mimeType: mimeType,
            body: dataUrl,
          },
          fields: 'id, name, webViewLink, webContentLink',
        });
        
        return {
          id: fallbackResponse.data.id,
          name: fallbackResponse.data.name,
          webViewLink: fallbackResponse.data.webViewLink,
          webContentLink: fallbackResponse.data.webContentLink
        };
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        throw new Error(`All upload methods failed: ${fallbackError.message}`);
      }
    }
    
    throw new Error(`Failed to upload binary file to Google Drive: ${error.message}`);
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
    
    let permission;
    
    if (emailAddress === 'anyone') {
      // Make file accessible to anyone with the link
      permission = {
        type: 'anyone',
        role: 'reader' // For 'anyone', we usually use 'reader' for security
      };
    } else {
      // Share with specific user
      permission = {
        type: 'user',
        role: role, // 'reader', 'writer', or 'owner'
        emailAddress: emailAddress
      };
    }
    
    const response = await drive.permissions.create({
      fileId: documentId,
      resource: permission,
      sendNotificationEmail: false // Don't send email notification
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sharing Google Doc:', error);
    console.error('Share details:', { documentId, emailAddress, role });
    throw new Error(`Failed to share Google Doc: ${error.message}`);
  }
}

/**
 * Share a Google Drive folder with a user
 */
export async function shareGoogleDriveFolder(folderId, emailAddress, role = 'writer') {
  try {
    console.log(`Attempting to share folder ${folderId} with ${emailAddress} as ${role}`);
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const permission = {
      type: 'user',
      role: role, // 'reader', 'writer', or 'owner'
      emailAddress: emailAddress
    };
    
    const response = await drive.permissions.create({
      fileId: folderId,
      resource: permission,
      sendNotificationEmail: false // Don't send email notification
    });
    
    console.log(`Successfully shared folder with ${emailAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error sharing Google Drive folder:', error);
    console.error('Error details:', error.response?.data);
    throw new Error(`Failed to share Google Drive folder: ${error.message}`);
  }
}

/**
 * Alternative sharing function with more permissive settings
 */
export async function shareGoogleDriveFolderAlternative(folderId, emailAddress, role = 'writer') {
  try {
    console.log(`Attempting alternative sharing for folder ${folderId} with ${emailAddress}`);
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    // Try multiple approaches
    const approaches = [
      // Approach 1: Direct user permission
      {
        type: 'user',
        role: role,
        emailAddress: emailAddress
      },
      // Approach 2: Anyone with link can edit (if user permission fails)
      {
        type: 'anyone',
        role: 'writer',
        allowFileDiscovery: false
      }
    ];
    
    for (const permission of approaches) {
      try {
        const response = await drive.permissions.create({
          fileId: folderId,
          resource: permission,
          sendNotificationEmail: false
        });
        console.log(`Successfully applied permission:`, permission);
        return response.data;
      } catch (err) {
        console.warn(`Permission approach failed:`, permission, err.message);
        continue;
      }
    }
    
    throw new Error('All sharing approaches failed');
  } catch (error) {
    console.error('Error in alternative sharing:', error);
    throw error;
  }
}

/**
 * Get or create a project folder for video notes
 */
export async function getOrCreateProjectFolder(projectName, userEmail = null) {
  try {
    // First, search for existing folder
    const existingFolders = await searchGoogleDrive(
      projectName, 
      'application/vnd.google-apps.folder'
    );
    
    if (existingFolders.length > 0) {
      return {
        folderId: existingFolders[0].id,
        folderName: existingFolders[0].name,
        folderUrl: existingFolders[0].webViewLink,
        isNew: false
      };
    }
    
    // Create new folder if none exists
    const newFolder = await createGoogleDriveFolder(projectName, null, userEmail);
    return {
      ...newFolder,
      isNew: true
    };
  } catch (error) {
    console.error('Error getting/creating project folder:', error);
    throw new Error('Failed to manage project folder');
  }
}

/**
 * Create a Google Doc in a specific folder
 */
export async function createGoogleDocInFolder(title, folderId, userEmail = null) {
  try {
    const auth = await getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // First create the document
    const createResponse = await docs.documents.create({
      requestBody: {
        title: title,
      },
    });

    const documentId = createResponse.data.documentId;
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // Move the document to the specified folder
    await drive.files.update({
      fileId: documentId,
      addParents: folderId,
      removeParents: 'root'
    });

    // Make document publicly accessible with link
    try {
      await drive.permissions.create({
        fileId: documentId,
        resource: {
          role: 'writer',
          type: 'anyone'
        },
        fields: 'id'
      });
      console.log(`Document made publicly accessible with link`);
    } catch (publicError) {
      console.warn('Failed to make document publicly accessible:', publicError.message);
      
      // Fallback: share with user if email provided
      if (userEmail) {
        try {
          await shareGoogleDoc(documentId, userEmail, 'writer');
          console.log(`Document shared with ${userEmail}`);
        } catch (shareError) {
          console.warn('Document sharing failed:', shareError.message);
        }
      }
    }

    return {
      documentId,
      documentUrl,
      title,
      isNew: true
    };
  } catch (error) {
    console.error('Error creating Google Doc in folder:', error);
    throw new Error(`Failed to create Google Doc in folder: ${error.message}`);
  }
}

/**
 * List Google Docs in a specific folder
 */
export async function listDocsInFolder(folderId) {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id,name,webViewLink,modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    return response.data.files.map(file => ({
      documentId: file.id,
      title: file.name,
      documentUrl: file.webViewLink,
      modifiedTime: file.modifiedTime
    }));
  } catch (error) {
    console.error('Error listing docs in folder:', error);
    throw new Error(`Failed to list docs in folder: ${error.message}`);
  }
}
