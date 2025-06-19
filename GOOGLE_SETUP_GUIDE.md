# Google Docs & Drive Integration Setup Guide

This guide will help you set up Google Docs and Google Drive integration for your video AI assistant, allowing the AI to write notes directly into Google Docs.

## Prerequisites

1. A Google Cloud Console account
2. Access to Google Docs and Google Drive APIs

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Google Docs API**
   - **Google Drive API**

## Step 3: Set Up Authentication

### Option A: Service Account (Recommended for Server-side)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Grant the service account the "Editor" role
6. Click "Done"
7. Click on your service account name
8. Go to the "Keys" tab
9. Click "Add Key" > "Create New Key" > "JSON"
10. Download the JSON key file
11. Copy the entire JSON content and add it to your `.env.local` file:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Option B: OAuth2 (For User-based Authentication)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the consent screen if prompted
4. Select "Web application" as the application type
5. Add authorized redirect URIs:
   - `http://localhost:3002/api/auth/google/callback`
6. Download the client configuration
7. Add to your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback
```

## Step 4: Configure Environment Variables

Update your `.env.local` file with the appropriate Google API credentials:

```bash
# Option A: Service Account (Recommended)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Option B: OAuth2
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

## Step 5: Grant Permissions (Service Account Only)

If using a service account, you need to share your Google Docs and Drive folders with the service account email:

1. Copy the `client_email` from your service account JSON
2. For existing Google Docs: Share the document with this email address (Editor permission)
3. For Google Drive folders: Share the folder with this email address

## Step 6: Test the Integration

1. Start your Next.js application
2. Go to the Video AI Assistant
3. Generate some notes for a video
4. You should see Google Integration options appear
5. Click "Create Sheet" or "Create Folder" to test

## Features Available

### Google Docs Integration
- ✅ Create new Google Docs for video notes
- ✅ Write AI-generated notes directly into documents
- ✅ Formatted content with timestamps and video information
- ✅ Append new notes to existing documents
- ✅ Direct links to open documents in Google Docs

### Google Drive Integration
- ✅ Create project folders for video content
- ✅ Save notes as TXT or Markdown files
- ✅ Upload files to specific folders
- ✅ Search existing files and folders

## Troubleshooting

### Common Issues

1. **"Failed to authenticate with Google APIs"**
   - Check that your service account JSON is valid
   - Ensure the JSON is properly formatted in the environment variable
   - Verify that the required APIs are enabled

2. **"Permission denied"**
   - Make sure you've shared docs/folders with the service account email
   - Check that the service account has "Editor" permissions for documents
   - Verify that the service account has the correct permissions

3. **"API not enabled"**
   - Ensure both Google Docs API and Google Drive API are enabled in your project

4. **"Invalid credentials"**
   - Verify your environment variables are correctly set
   - Check that there are no extra spaces or formatting issues

### Testing Commands

You can test your Google API setup with these curl commands:

```bash
# Test Google Docs creation
curl -X POST http://localhost:3002/api/google-integration \
  -H "Content-Type: application/json" \
  -d '{"action":"create_doc_for_video","data":{"videoTitle":"Test Video","videoChannel":"Test Channel","videoId":"test123"}}'

# Test Google Drive folder creation
curl -X POST http://localhost:3002/api/google-integration \
  -H "Content-Type: application/json" \
  -d '{"action":"create_project_folder","data":{"videoTitle":"Test Video"}}'
```

## Security Notes

- Keep your service account JSON file secure and never commit it to version control
- Use environment variables to store all sensitive credentials
- Consider using Google Cloud Secret Manager for production deployments
- Regularly rotate your API keys and service account keys

## Next Steps

Once you have Google APIs working:

1. Customize the document formatting in `src/lib/google-api.js`
2. Add more styling options for Google Docs
3. Implement automatic backup of video notes
4. Add collaborative features for shared documents
5. Set up Google Drive webhooks for real-time sync

For more information, see the [Google APIs Documentation](https://developers.google.com/apis-explorer).
