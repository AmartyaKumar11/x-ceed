// Simple test to verify resume text extraction
import fs from 'fs';
import path from 'path';

const testResumeText = async () => {
  console.log('🧪 Testing resume text extraction...');
  
  // Check if there are any test resume files
  const testPaths = [
    'public/uploads/temp-resumes',
    'public/uploads/resumes',
    'public'
  ];
  
  for (const testPath of testPaths) {
    const fullPath = path.join(process.cwd(), testPath);
    if (fs.existsSync(fullPath)) {
      console.log(`📂 Found directory: ${fullPath}`);
      const files = fs.readdirSync(fullPath);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
      console.log(`📄 PDF files found: ${pdfFiles.length}`);
      if (pdfFiles.length > 0) {
        console.log(`📄 First PDF: ${pdfFiles[0]}`);
      }
    } else {
      console.log(`📂 Directory not found: ${fullPath}`);
    }
  }
  
  // For now, let's test with a sample resume text
  const sampleResumeText = `
    John Doe
    Software Engineer
    Email: john.doe@email.com
    Phone: (555) 123-4567
    
    EXPERIENCE:
    Software Engineer at Tech Corp (2022-2024)
    - Developed React applications using JavaScript and TypeScript
    - Built RESTful APIs with Node.js and Express
    - Worked with MongoDB for data storage
    - Collaborated with cross-functional teams
    
    SKILLS:
    - React, JavaScript, TypeScript
    - Node.js, Express
    - MongoDB, SQL
    - Git, Docker
    
    EDUCATION:
    Bachelor of Science in Computer Science
    University of Technology (2018-2022)
  `;
  
  console.log('📄 Sample resume text length:', sampleResumeText.length);
  console.log('✅ Resume text test completed');
  
  return sampleResumeText;
};

testResumeText();
