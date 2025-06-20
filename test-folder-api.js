// Test the folder creation API directly
async function testCreateFolder() {
  console.log('Testing folder creation API...');
  
  try {
    const response = await fetch('/api/google-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_project_folder',
        data: { 
          projectName: 'Test Video Project - ' + new Date().toISOString().slice(0, 10),
          videoTitle: 'Test Video',
          userEmail: 'kumaramartya11@gmail.com'
        }
      })
    });

    const result = await response.json();
    console.log('API Response:', result);
    
    if (result.success) {
      console.log('✅ Folder created successfully!');
      console.log('📁 Folder ID:', result.folder.folderId);
      console.log('🔗 Folder URL:', result.folder.folderUrl);
    } else {
      console.error('❌ API Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Test when page loads
if (typeof window !== 'undefined') {
  testCreateFolder();
}

export default testCreateFolder;
