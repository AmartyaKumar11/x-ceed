import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(request, { params }) {
  try {
    const { filename } = params;
    console.log('📄 PDF view request for filename:', filename);
    
    if (!filename) {
      console.log('❌ No filename provided');
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'temp-resumes', filename);
    console.log('📁 Looking for file at:', filePath);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('❌ File not found at path:', filePath);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    console.log('✅ File found, reading...');
    // Read the file
    const fileBuffer = await readFile(filePath);
    console.log('📄 File read successfully, size:', fileBuffer.length, 'bytes');

    // Return the PDF with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('💥 Error serving PDF:', error);
    return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 });
  }
}
