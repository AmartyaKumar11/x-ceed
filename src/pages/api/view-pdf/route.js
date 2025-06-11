import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    const highlights = url.searchParams.get('highlights');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    // Construct full file path
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the PDF file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // For now, we'll serve the PDF directly
    // In a full implementation, we'd inject JavaScript to add highlights
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
