#!/usr/bin/env node

/**
 * Google Drive Setup Helper
 * This script helps you set up Google Drive integration for X-Ceed
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Google Drive Integration Setup for X-Ceed');
console.log('============================================\n');

console.log('📋 Before we start, make sure you have:');
console.log('1. ✅ A Google Cloud Platform account');
console.log('2. ✅ A project created in Google Cloud Console');
console.log('3. ✅ Google Drive API and Google Docs API enabled');
console.log('4. ✅ Either Service Account or OAuth2 credentials created\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupServiceAccount() {
  console.log('\n🔧 Service Account Setup (Recommended)');
  console.log('=====================================');
  
  console.log('\nSteps to get Service Account JSON:');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Navigate to APIs & Services → Credentials');
  console.log('3. Click "Create Credentials" → "Service Account"');
  console.log('4. Fill in the details and create');
  console.log('5. Click on the created service account');
  console.log('6. Go to "Keys" tab → "Add Key" → "Create new key" → JSON');
  console.log('7. Download the JSON file');
  
  const jsonPath = await askQuestion('\n📁 Enter the path to your downloaded JSON file: ');
  
  try {
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ File not found. Please check the path.');
      return null;
    }
    
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(jsonContent); // Validate JSON
    
    console.log('✅ JSON file loaded successfully!');
    console.log('📧 Service Account Email:', parsed.client_email);
    
    return JSON.stringify(parsed);
  } catch (error) {
    console.log('❌ Error reading JSON file:', error.message);
    return null;
  }
}

async function setupOAuth() {
  console.log('\n🔧 OAuth 2.0 Setup');
  console.log('==================');
  
  console.log('\nSteps to get OAuth credentials:');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Navigate to APIs & Services → Credentials');
  console.log('3. Click "Create Credentials" → "OAuth 2.0 Client ID"');
  console.log('4. Choose "Web application"');
  console.log('5. Add authorized redirect URI: http://localhost:3002/api/auth/google/callback');
  console.log('6. Copy the Client ID and Client Secret');
  
  const clientId = await askQuestion('\n🔑 Enter your Google Client ID: ');
  const clientSecret = await askQuestion('🔐 Enter your Google Client Secret: ');
  
  if (!clientId || !clientSecret) {
    console.log('❌ Client ID and Secret are required.');
    return null;
  }
  
  return { clientId, clientSecret };
}

async function updateEnvFile(credentials) {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    return;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (credentials.serviceAccountKey) {
    // Update service account key
    const serviceAccountLine = `GOOGLE_SERVICE_ACCOUNT_KEY=${credentials.serviceAccountKey}`;
    
    if (envContent.includes('# GOOGLE_SERVICE_ACCOUNT_KEY=')) {
      envContent = envContent.replace(
        /# GOOGLE_SERVICE_ACCOUNT_KEY=.*/,
        serviceAccountLine
      );
    } else {
      envContent += `\n${serviceAccountLine}\n`;
    }
  }
  
  if (credentials.oauth) {
    // Update OAuth credentials
    const { clientId, clientSecret } = credentials.oauth;
    
    envContent = envContent.replace(
      /# GOOGLE_CLIENT_ID=.*/,
      `GOOGLE_CLIENT_ID=${clientId}`
    );
    envContent = envContent.replace(
      /# GOOGLE_CLIENT_SECRET=.*/,
      `GOOGLE_CLIENT_SECRET=${clientSecret}`
    );
    envContent = envContent.replace(
      /# GOOGLE_REDIRECT_URI=.*/,
      `GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback`
    );
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local updated successfully!');
}

async function main() {
  try {
    const method = await askQuestion('Choose setup method:\n1. Service Account (Recommended)\n2. OAuth 2.0\nEnter choice (1 or 2): ');
    
    let credentials = {};
    
    if (method === '1') {
      const serviceAccountKey = await setupServiceAccount();
      if (!serviceAccountKey) {
        console.log('❌ Service Account setup failed.');
        rl.close();
        return;
      }
      credentials.serviceAccountKey = serviceAccountKey;
    } else if (method === '2') {
      const oauth = await setupOAuth();
      if (!oauth) {
        console.log('❌ OAuth setup failed.');
        rl.close();
        return;
      }
      credentials.oauth = oauth;
    } else {
      console.log('❌ Invalid choice.');
      rl.close();
      return;
    }
    
    await updateEnvFile(credentials);
    
    console.log('\n🎉 Setup Complete!');
    console.log('==================');
    console.log('✅ Google Drive integration is now configured');
    console.log('✅ Video AI Assistant can now create folders');
    console.log('✅ Restart your application to apply changes');
    
    if (credentials.serviceAccountKey) {
      const parsed = JSON.parse(credentials.serviceAccountKey);
      console.log('\n📧 Remember to share folders with this service account email:');
      console.log(`   ${parsed.client_email}`);
    }
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

main();
