# Firebase Setup Guide for Video AI Assistant

## Quick Access to Chat Logs

**🔥 Firebase Console**: https://console.firebase.google.com/project/x-ceed-18c97/firestore/data  
**📋 Chat Sessions**: Click `chatSessions` collection to see all video sessions  
**💬 Chat Messages**: Click `chatMessages` collection to see all conversation messages  

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "video-ai-assistant")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can add security rules later)
4. Select a location for your database (choose one close to your users)
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (Settings) → "Project settings"
2. Scroll down to "Your apps" section
3. Click on the web icon (`</>`) to add a web app
4. Enter an app nickname (e.g., "video-ai-web")
5. Click "Register app"
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 4: Update Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Open `.env.local` and update the Firebase values:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```

## Step 5: Test the Setup

1. Start your Next.js application:
   ```bash
   npm run dev
   ```

2. Go to the video AI assistant page
3. Load a YouTube video
4. Start a chat conversation
5. Check the Firebase console → Firestore Database to see if collections `chatSessions` and `chatMessages` are created

## How to View Chat Logs in Firebase

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: Click on "x-ceed-18c97" 
3. **Open Firestore Database**: Click on "Firestore Database" in the left sidebar
4. **View Collections**: You'll see two main collections:

### View Chat Sessions
- Click on the **`chatSessions`** collection
- Each document represents a unique video chat session
- Document ID format: `{videoId}_{base64EncodedTitle}`
- Click on any document to see session details (video title, channel, timestamps, etc.)

### View Chat Messages  
- Click on the **`chatMessages`** collection
- Each document is an individual message (user or AI)
- You can filter by `sessionId` to see messages for a specific video
- Messages contain: content, timestamp, type (user/ai), actions, clips, notes

### Filtering Messages by Video
To see all messages for a specific video:
1. In `chatMessages` collection, click "Filter" 
2. Set: Field = `sessionId`, Operator = `==`, Value = `your_session_id`
3. Click "Apply"

### Real-time Updates
- Messages appear in real-time as you chat in the app
- Refresh the Firebase console to see new messages
- Sessions are created automatically when you start chatting

## Firestore Collections Structure

Your Firebase will automatically create these collections:

### `chatSessions`
- Document ID: `{videoId}_{base64Title}`
- Fields:
  - `videoId`: string
  - `videoTitle`: string  
  - `videoChannel`: string
  - `projectFolder`: object (optional)
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### `chatMessages`
- Document ID: auto-generated
- Fields:
  - `sessionId`: string (references chat session)
  - `type`: string ("user" or "ai")
  - `content`: string
  - `timestamp`: timestamp
  - `actions`: array
  - `clips`: array
  - `notes`: string
  - `isWelcome`: boolean
  - `showProjectSetup`: boolean

## Security Rules (Optional)

For production, add these security rules in Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to chat sessions and messages
    match /chatSessions/{sessionId} {
      allow read, write: if true;
    }
    match /chatMessages/{messageId} {
      allow read, write: if true;
    }
  }
}
```

## Google Drive Integration Setup

Your app uses a service account to access Google Drive. To fix the "access" issue:

### Quick Fix - Share with Service Account

1. **Go to Google Drive**: https://drive.google.com
2. **Create or select a folder** where you want the video projects to be saved
3. **Right-click the folder** → "Share"
4. **Add this email**: `video-ai-service@x-ceed.iam.gserviceaccount.com`
5. **Set permission to**: "Editor"
6. **Click "Send"**

### Alternative - Create a Shared Folder

1. Create a new folder in Google Drive called "Video AI Projects"
2. Share it with: `video-ai-service@x-ceed.iam.gserviceaccount.com` (Editor access)
3. The app will now be able to create subfolders and documents inside this folder

### Test the Integration

1. Start your app: `npm run dev`
2. Go to video AI assistant page
3. Load a YouTube video
4. Try creating a project folder - it should work now!

---

## Features Implemented

✅ **Chat History Persistence**: All conversations are saved to Firebase Firestore  
✅ **Per-Video Isolation**: Each video has its own chat session  
✅ **Real-time Sync**: Changes are saved automatically to the cloud  
✅ **Fallback Support**: Falls back to localStorage if Firebase is unavailable  
✅ **Clear History**: Clearing chat also removes data from Firebase  
✅ **Project Folder Integration**: Google Drive folder info is saved with chat sessions  

## Troubleshooting

**No collections showing up in Firebase**
- Collections are created automatically when you first use the chat
- Start the app with `npm run dev` and have a conversation with the AI
- Refresh the Firebase console to see the new collections

**Error: "Firebase project not found"**
- Check that your project ID is correct in `.env.local`
- Make sure the project exists in Firebase Console

**Error: "Permission denied"**
- Check Firestore security rules
- Make sure you're in "test mode" or have proper rules set

**Google Drive asking for access permissions**
- ✅ **Good news**: Your service account authentication is working correctly
- The "access request" you're seeing might be one of these:

**Option 1: Browser Security Warning**
- Some browsers show a security warning when redirecting to Google Drive
- This is normal - just click "Continue" or "Allow"

**Option 2: Google Drive Sharing Dialog**
- When a folder is created, Google might show a sharing confirmation
- This is just informing you that the folder was created
- You can dismiss this dialog

**Option 3: Folder URL Opening**
- The app might be trying to open the Google Drive folder URL
- This is normal behavior to show you the created folder
- The folder should open in a new tab

**To verify everything is working:**
1. Open your browser developer tools (F12)
2. Go to Console tab
3. Try creating a project folder
4. Look for any error messages in the console
5. Check if the folder actually gets created in your Google Drive

**If you see errors in console:**
- Look for messages containing "403" or "401" (authentication errors)
- Look for messages containing "permissions" or "access denied"
- Share the exact error message for more specific help

**Quick verification:**
- Go to https://drive.google.com
- Look for folders created by your app
- They should be there even if you saw the "access" dialog

**Messages not saving**
- Check browser console for errors
- Verify Firebase configuration in `.env.local`
- Check if Firestore database is created and running

**Chat history not loading**
- Clear localStorage and refresh the page
- Check if there are any console errors
- Verify the API routes are working: `/api/chat-session`

**Service Account Email**: `video-ai-service@x-ceed.iam.gserviceaccount.com`
- Add this email to any Google Drive folder you want the app to access
- Give it "Editor" permissions so it can create docs and folders

## 🔒 Security Warning - Protecting Your Credentials

### Your Firebase credentials are sensitive and should NEVER be public!

**✅ What's Protected:**
- Your `.env.local` file is protected by `.gitignore`
- Firebase credentials won't be pushed to GitHub
- The `NEXT_PUBLIC_` prefix is safe for client-side use

**❌ What to Never Do:**
- Don't commit `.env.local` to version control
- Don't share your Firebase project keys publicly
- Don't hardcode credentials in your source code

**🔍 Double-Check Security:**
1. **Verify .gitignore**: Make sure `.env*` is in your `.gitignore` file ✅
2. **Check Git Status**: Run `git status` - `.env.local` should NOT appear
3. **Environment Variables**: Use `.env.local` for local development only

**🚀 For Production Deployment:**
- **Vercel**: Add environment variables in project settings
- **Netlify**: Add environment variables in site settings  
- **Other platforms**: Use their environment variable system

**⚠️ If You Already Pushed Credentials:**
1. **Regenerate Firebase keys** in Firebase Console
2. **Update your `.env.local`** with new keys
3. **Force push** to remove old credentials from Git history

**🛡️ Firebase Security Rules:**
Your current Firestore rules allow anyone to read/write. For production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null; // Require authentication
    }
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null; // Require authentication
    }
  }
}
```
