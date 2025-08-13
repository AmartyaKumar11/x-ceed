const { PDFTextExtractor } = require('./src/lib/pdfExtractor.js');
const path = require('path');

async function testResumeExtraction() {
  console.log('🧪 Testing resume extraction...');
  
  // Test with the actual resume path from your logs
  const resumePath = '/uploads/application-resumes/686d41c8a7597e3bc30ee649_Data-Analyst_1755081370287.pdf';
  const fullPath = path.join(process.cwd(), 'public', resumePath);
  
  console.log('📁 Checking file path:', fullPath);
  
  const fs = require('fs');
  if (!fs.existsSync(fullPath)) {
    console.error('❌ Resume file not found at:', fullPath);
    
    // Check if the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('📂 Uploads directory exists, listing contents...');
      const files = fs.readdirSync(uploadsDir, { recursive: true });
      console.log('Files found:', files.slice(0, 10)); // Show first 10 files
    } else {
      console.log('❌ Uploads directory does not exist');
    }
    return;
  }
  
  try {
    console.log('📄 Extracting text from PDF...');
    const extractedText = await PDFTextExtractor.extractFromFile(fullPath);
    console.log('✅ Extraction successful!');
    console.log('📊 Text length:', extractedText.length);
    console.log('📝 First 300 characters:');
    console.log(extractedText.substring(0, 300));
    console.log('...');
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testResumeExtraction();
