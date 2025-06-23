import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('resume');
        const jobTitle = formData.get('jobTitle');
        const jobLevel = formData.get('jobLevel');
        const jobDescription = formData.get('jobDescription');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Create a temporary file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const tempFileName = `temp_${timestamp}_${originalName}`;
        const tempFilePath = join(process.cwd(), 'temp', tempFileName);

        try {
            // Ensure temp directory exists
            const { mkdir } = await import('fs/promises');
            try {
                await mkdir(join(process.cwd(), 'temp'), { recursive: true });
            } catch (e) {
                // Directory might already exist
            }

            // Write the file
            await writeFile(tempFilePath, buffer);

            // Call Python script to analyze resume
            const pythonResult = await runPythonAnalysis(tempFilePath, {
                title: jobTitle,
                level: jobLevel,
                description: jobDescription
            });

            // Clean up temp file
            try {
                await unlink(tempFilePath);
            } catch (e) {
                console.warn('Could not delete temp file:', e);
            }

            return NextResponse.json(pythonResult);

        } catch (error) {
            console.error('File processing error:', error);
            
            // Clean up temp file if it exists
            try {
                await unlink(tempFilePath);
            } catch (e) {
                // File might not exist
            }
            
            return NextResponse.json({ 
                error: 'Failed to process file: ' + error.message 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error: ' + error.message 
        }, { status: 500 });
    }
}

function runPythonAnalysis(filePath, jobData) {
    return new Promise((resolve, reject) => {
        // Create Python script arguments
        const scriptArgs = [
            join(process.cwd(), 'debug_resume_parser.py'),
            filePath,
            JSON.stringify(jobData)
        ];

        console.log('🐍 Running Python analysis:', scriptArgs);

        const pythonProcess = spawn('python', scriptArgs);
        
        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', errorOutput);
                reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
                return;
            }

            try {
                // Try to parse the JSON output
                const result = JSON.parse(output.split('\n').find(line => line.trim().startsWith('{')));
                resolve(result);
            } catch (parseError) {
                console.error('Failed to parse Python output:', output);
                resolve({
                    extractedText: output,
                    analysis: {
                        overall_score: 0,
                        skill_match_score: 0,
                        experience_score: 0,
                        education_score: 0,
                        detailed_feedback: 'Failed to parse analysis results'
                    }
                });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            reject(new Error('Failed to start Python analysis: ' + error.message));
        });
    });
}
